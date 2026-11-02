const express = require('express');
const { body, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Question = require('../models/Question');
const Assessment = require('../models/Assessment');
const AssessmentAnswer = require('../models/AssessmentAnswer');
const UserProfile = require('../models/UserProfile');
const UserHealthState = require('../models/UserHealthState');
const scoringProxy = require('../services/scoringProxy');
const scoringV2 = require('../services/scoringEngineV2');
const { sendSuccess, sendError } = require('../utils/response');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

const router = express.Router();
router.use(authMiddleware);

// ── GET /api/questionnaire/questions ──
// Returns adaptive question set filtered by user's age_group and gender
router.get('/questions', async (req, res, next) => {
  try {
    const profile = await UserProfile.findOne({ where: { user_id: req.user.id } });
    const ageGroup = profile?.age_group || 'all';
    const gender = profile?.gender || 'all';

    const questions = await Question.findAll({
      where: {
        is_active: true,
        audience: { [Op.in]: ['all', gender] },
        age_group: { [Op.in]: ['all', ageGroup] },
      },
      order: [['display_order', 'ASC']],
      attributes: ['id', 'question_text', 'category', 'weight', 'options', 'audience', 'age_group'],
    });

    return sendSuccess(res, { questions, total: questions.length });
  } catch (err) {
    next(err);
  }
});

// Snapshot of the profile stored with every assessment (for history + ML)
const profileSnapshot = (profile) => ({
  age_at_assessment:     profile?.age || null,
  age_group:             profile?.age_group || null,
  gender:                profile?.gender || null,
  diet_type:             profile?.diet_type || null,
  diet_penalty_score:    profile?.diet_penalty_score || 0,
  has_pernicious_anemia: profile?.has_pernicious_anemia || false,
  has_crohns_disease:    profile?.has_crohns_disease || false,
  has_celiac_disease:    profile?.has_celiac_disease || false,
  has_gastric_surgery:   profile?.has_gastric_surgery || false,
  takes_metformin:       profile?.takes_metformin || false,
  takes_ppi:             profile?.takes_ppi || false,
});

// Persist assessment + answers + health-state baseline atomically.
const persistAssessment = async ({ userId, profile, result, answerRows, scoringVersion }) => {
  return sequelize.transaction(async (t) => {
    const assessment = await Assessment.create({
      user_id: userId,
      ...profileSnapshot(profile),
      raw_score: result.raw_score,
      max_possible_score: result.max_possible_score,
      normalized_score: result.normalized_score,
      risk_percentage: result.percentage,
      risk_level: result.risk_level,
      category_breakdown: result.breakdown,
      suggestions: result.suggestions,
      questions_shown: answerRows.length,
      scoring_version: scoringVersion,
    }, { transaction: t });

    await AssessmentAnswer.bulkCreate(
      answerRows.map((r) => ({ ...r, assessment_id: assessment.id, user_id: userId })),
      { transaction: t },
    );

    // Seed / refresh user_health_state with the questionnaire baseline.
    // The current_* daily columns are left untouched until the next check-in.
    await UserHealthState.upsert({
      user_id:             userId,
      assessment_id:       assessment.id,
      ...profileSnapshot(profile),
      baseline_risk_level: result.risk_level,
      baseline_risk_score: result.normalized_score,
    }, { conflictFields: ['user_id'], transaction: t });

    return assessment;
  });
};

// ── POST /api/questionnaire/submit ──
// Two answer formats are accepted:
//   v1 (Android app): { answers: [{ questionId: 1..25, answerValue }] }
//   v2 (web app):     { answers: [{ questionKey: 'fatigue_frequency', answerValue }] }
router.post('/submit', [
  body('answers').isArray({ min: 1, max: 60 }).withMessage('answers array is required'),
  body('answers.*.answerValue').isString().isLength({ min: 1, max: 100 }).withMessage('Each answer needs an answerValue.'),
  body('answers.*.questionId').optional().isInt({ min: 1, max: 1000 }).toInt(),
  body('answers.*.questionKey').optional().isString().isLength({ max: 60 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { answers } = req.body;
    const profile = await UserProfile.findOne({ where: { user_id: req.user.id } });
    const isV2 = answers.every((a) => typeof a.questionKey === 'string' && a.questionKey.length > 0);
    const isV1 = answers.every((a) => Number.isInteger(a.questionId));

    if (!isV1 && !isV2) {
      return sendError(res, 'Each answer must have either a questionKey or a numeric questionId.');
    }

    // ── v2: web questionnaire ──────────────────────────────────────────────
    if (isV2) {
      let items;
      try {
        items = scoringV2.resolveAnswers(answers);
      } catch (e) {
        return sendError(res, e.message, e.statusCode || 400);
      }
      const r = scoringV2.scoreItems(items, profile?.diet_type || 'omnivore');
      const result = {
        raw_score: r.score,
        max_possible_score: r.maxPossible,
        normalized_score: r.percentage,
        percentage: r.percentage,
        risk_level: r.level.toLowerCase(),
        breakdown: r.breakdown,
        suggestions: r.suggestions,
      };
      const answerRows = items.map((it) => ({
        question_id: null,
        answer_value: it.answerValue,
        answer_label: it.answerLabel,
        answer_score: it.score,
        question_weight: it.weight,
        question_category: it.category.slice(0, 30),
        question_text_snapshot: `[${it.questionKey}] ${it.questionText}`,
      }));

      const assessment = await persistAssessment({
        userId: req.user.id, profile, result, answerRows, scoringVersion: scoringV2.SCORING_VERSION,
      });

      return sendSuccess(res, {
        assessment_id: assessment.id,
        risk_level: result.risk_level,
        percentage: result.percentage,
        breakdown: result.breakdown,
        suggestions: result.suggestions,
        scoring_version: scoringV2.SCORING_VERSION,
        completed_at: assessment.completed_at,
      });
    }

    // ── v1: Android questionnaire (numeric question IDs) ───────────────────
    const ids = answers.map((a) => a.questionId);
    if (new Set(ids).size !== ids.length) {
      return sendError(res, 'Each question can only be answered once.');
    }

    const questions = await Question.findAll({ where: { id: ids } });
    const questionMap = {};
    questions.forEach((q) => { questionMap[q.id] = q; });

    const scoringResult = await scoringProxy.score({
      answers: answers.map((a) => ({
        question_id: a.questionId,
        answer_value: a.answerValue,
      })),
      profile: {
        age_group: profile?.age_group || 'all',
        gender: profile?.gender || 'all',
        diet_type: profile?.diet_type || 'omnivore',
        diet_penalty: profile?.diet_penalty_score || 0,
        has_pernicious_anemia: profile?.has_pernicious_anemia || false,
        has_crohns_celiac: profile?.has_crohns_disease || profile?.has_celiac_disease || false,
        has_gastric_surgery: profile?.has_gastric_surgery || false,
        takes_metformin: profile?.takes_metformin || false,
        takes_ppi: profile?.takes_ppi || false,
      },
    });

    const answerRows = answers.map((a) => {
      const q = questionMap[a.questionId];
      const options = Array.isArray(q?.options) ? q.options : [];
      const matchedOption = options.find((o) => o.value === a.answerValue) || null;
      return {
        question_id: q ? a.questionId : null,
        answer_value: a.answerValue,
        answer_label: matchedOption?.label || a.answerValue,
        answer_score: matchedOption?.score ?? 0,
        question_weight: q?.weight ?? 1.0,
        question_category: q?.category || null,
        question_text_snapshot: q?.question_text || null,
      };
    });

    const assessment = await persistAssessment({
      userId: req.user.id, profile, result: scoringResult, answerRows, scoringVersion: '1.0',
    });

    // Return shape matching the Android app's expected response
    return sendSuccess(res, {
      assessment_id: assessment.id,
      risk_level: scoringResult.risk_level,
      percentage: scoringResult.percentage,
      breakdown: scoringResult.breakdown,
      suggestions: scoringResult.suggestions,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/questionnaire/history ──
router.get('/history', async (req, res, next) => {
  try {
    const assessments = await Assessment.findAll({
      where: { user_id: req.user.id },
      order: [['completed_at', 'DESC']],
      attributes: ['id', 'risk_level', 'risk_percentage', 'normalized_score', 'category_breakdown', 'questions_shown', 'scoring_version', 'completed_at'],
      limit: Math.min(parseInt(req.query.limit, 10) || 20, 100),
    });
    return sendSuccess(res, { assessments });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/questionnaire/latest ──
router.get('/latest', async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({
      where: { user_id: req.user.id },
      order: [['completed_at', 'DESC']],
    });
    if (!assessment) return sendSuccess(res, { assessment: null });
    return sendSuccess(res, { assessment });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/questionnaire/:id ──
router.get('/:id', async (req, res, next) => {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return sendError(res, 'Assessment not found', 404);
    const assessment = await Assessment.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!assessment) return sendError(res, 'Assessment not found', 404);
    const answers = await AssessmentAnswer.findAll({ where: { assessment_id: assessment.id } });
    return sendSuccess(res, { assessment, answers });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
