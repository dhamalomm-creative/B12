const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const UserBmiLog = require('../models/UserBmiLog');
const { sendSuccess, sendError, getAgeGroup, getDietPenalty } = require('../utils/response');
const { logSecurityEvent, EVENTS } = require('../middleware/auditLogger');

const router = express.Router();
router.use(authMiddleware);

// ── POST /api/users/profile — Save / update profile (exact endpoint from app README) ──
const BOOL_FIELDS = ['hasPerniciousAnemia', 'hasCrohnsCeliac', 'hasGastricSurgery',
  'takesMetformin', 'takesPpi', 'isPregnant', 'isBreastfeeding'];

router.post('/profile', [
  body('name').optional({ nullable: true }).isString().trim().isLength({ max: 80 }).withMessage('Name must be 80 characters or fewer.'),
  body('age').optional({ nullable: true }).isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120.'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender.'),
  body('dietType').optional().isIn(['vegan', 'vegetarian', 'pescatarian', 'omnivore']).withMessage('Invalid diet type.'),
  ...BOOL_FIELDS.map((f) => body(f).optional().isBoolean().withMessage(`${f} must be true or false.`).toBoolean()),
  body('alcoholFrequency').optional({ nullable: true }).isString().isLength({ max: 20 }),
  body('smokingStatus').optional({ nullable: true }).isString().isLength({ max: 20 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { name, age, gender, dietType,
      hasPerniciousAnemia, hasCrohnsCeliac, hasGastricSurgery,
      takesMetformin, takesPpi, isPregnant, isBreastfeeding,
      alcoholFrequency, smokingStatus } = req.body;

    const ageNum = (age !== undefined && age !== null && age !== '') ? parseInt(age, 10) : undefined;

    const profileData = {
      user_id: req.user.id,
      ...(name !== undefined && { name }),
      ...(ageNum !== undefined && { age: ageNum, age_group: getAgeGroup(ageNum) }),
      ...(gender !== undefined && { gender }),
      ...(dietType !== undefined && { diet_type: dietType, diet_penalty_score: getDietPenalty(dietType) }),
      ...(hasPerniciousAnemia !== undefined && { has_pernicious_anemia: hasPerniciousAnemia }),
      ...(hasCrohnsCeliac !== undefined && { has_crohns_disease: hasCrohnsCeliac, has_celiac_disease: hasCrohnsCeliac }),
      ...(hasGastricSurgery !== undefined && { has_gastric_surgery: hasGastricSurgery }),
      ...(takesMetformin !== undefined && { takes_metformin: takesMetformin }),
      ...(takesPpi !== undefined && { takes_ppi: takesPpi }),
      ...(isPregnant !== undefined && { is_pregnant: isPregnant }),
      ...(isBreastfeeding !== undefined && { is_breastfeeding: isBreastfeeding }),
      ...(alcoholFrequency !== undefined && { alcohol_frequency: alcoholFrequency }),
      ...(smokingStatus !== undefined && { smoking_status: smokingStatus }),
    };

    const [profile, created] = await UserProfile.upsert(profileData, { conflictFields: ['user_id'], returning: true });
    return sendSuccess(res, { profile }, created ? 201 : 200);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/profile ──
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['id', 'email', 'created_at'] });
    const profile = await UserProfile.findOne({ where: { user_id: req.user.id } });
    return sendSuccess(res, { user, profile });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users/password — change password ──
// Same policy as registration so accounts can't be downgraded to weak passwords.
router.post('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8, max: 128 }).withMessage('New password must be 8–128 characters.')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('New password must contain at least one number.'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user || !user.password_hash) return sendError(res, 'Unable to update password.', 400);

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return sendError(res, 'Current password is incorrect.', 400);

    if (await bcrypt.compare(newPassword, user.password_hash)) {
      return sendError(res, 'New password must be different from your current password.', 400);
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await user.update({ password_hash });
    await logSecurityEvent(req, EVENTS.PASSWORD_CHANGE, { userId: user.id });
    return sendSuccess(res, { message: 'Password updated.' });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/users/me — permanently delete account + all health data ──
// Health data is sensitive: when a user asks to delete their account we remove it
// (profile, assessments, answers, check-ins, BMI logs cascade via ON DELETE CASCADE).
// If a password is supplied in the body it is verified first (the web app always sends it).
router.delete('/me', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return sendError(res, 'Account not found.', 404);

    const { password } = req.body || {};
    if (password !== undefined) {
      const ok = user.password_hash && await bcrypt.compare(String(password), user.password_hash);
      if (!ok) return sendError(res, 'Password is incorrect.', 400);
    }

    await logSecurityEvent(req, EVENTS.ACCOUNT_DELETED, { userId: user.id, metadata: {} });
    await user.destroy();
    return sendSuccess(res, { message: 'Your account and health data have been deleted.' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/users/bmi — Save BMI measurement ──
router.post('/bmi', [
  body('heightCm').isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm'),
  body('weightKg').isFloat({ min: 10, max: 500 }).withMessage('Weight must be between 10 and 500 kg'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { heightCm, weightKg } = req.body;
    const h = parseFloat(heightCm) / 100;
    const w = parseFloat(weightKg);
    const bmi = Math.round((w / (h * h)) * 10) / 10;

    let bmiCategory;
    if (bmi < 18.5)      bmiCategory = 'underweight';
    else if (bmi < 25)   bmiCategory = 'normal';
    else if (bmi < 30)   bmiCategory = 'overweight';
    else                 bmiCategory = 'obese';

    if (!Number.isFinite(bmi) || bmi < 5 || bmi > 150) {
      return sendError(res, 'Those measurements do not look right. Please check height and weight.');
    }

    const today = new Date().toISOString().split('T')[0];
    const log = await UserBmiLog.create({
      user_id: req.user.id,
      height_cm: parseFloat(heightCm),
      weight_kg: w,
      bmi,
      bmi_category: bmiCategory,
      measured_at: today,
    });

    return sendSuccess(res, { bmi: log }, 201);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/bmi/latest — Get most recent BMI record ──
router.get('/bmi/latest', async (req, res, next) => {
  try {
    const latest = await UserBmiLog.findOne({
      where: { user_id: req.user.id },
      order: [['measured_at', 'DESC'], ['created_at', 'DESC']],
    });
    if (!latest) return sendSuccess(res, { bmi: null });
    return sendSuccess(res, { bmi: latest });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/users/bmi/history — Get BMI history ──
router.get('/bmi/history', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const logs = await UserBmiLog.findAll({
      where: { user_id: req.user.id },
      order: [['measured_at', 'DESC'], ['created_at', 'DESC']],
      limit,
    });
    return sendSuccess(res, { history: logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
