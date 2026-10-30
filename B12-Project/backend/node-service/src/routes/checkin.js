const express = require('express');
const { body, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { DailyCheckin, UserStreak } = require('../models/DailyCheckin');
const UserHealthState = require('../models/UserHealthState');
const { sendSuccess, sendError } = require('../utils/response');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authMiddleware);

// ─── Streak updater ───────────────────────────────
const updateStreak = async (userId, today) => {
  let streak = await UserStreak.findOne({ where: { user_id: userId } });
  if (!streak) {
    streak = await UserStreak.create({ user_id: userId });
  }

  // If user already logged today, do not reset or increment duplicate streak
  if (streak.last_checkin_date === today) {
    return { current_streak: streak.current_streak, longest_streak: streak.longest_streak };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yDate = yesterday.toISOString().split('T')[0];

  const isConsecutive = streak.last_checkin_date === yDate;
  const newCurrent = isConsecutive ? streak.current_streak + 1 : 1;
  const newLongest = Math.max(newCurrent, streak.longest_streak);

  await streak.update({
    current_streak: newCurrent,
    longest_streak: newLongest,
    total_checkins: streak.total_checkins + 1,
    last_checkin_date: today,
  });

  return { current_streak: newCurrent, longest_streak: newLongest };
};

// ── POST /api/checkin/daily — Submit daily check-in ──
router.post('/daily', [
  body('energyScore').isInt({ min: 0, max: 4 }),
  body('fatigueScore').isInt({ min: 0, max: 4 }),
  body('moodScore').isInt({ min: 0, max: 4 }),
  body('sleepScore').isInt({ min: 0, max: 4 }),
  body('focusScore').isInt({ min: 0, max: 4 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const { energyScore, fatigueScore, moodScore, sleepScore, focusScore, notes, durationSeconds } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Upsert — one check-in per day (handled via compound unique key user_id + checkin_date)
    const [checkin, created] = await DailyCheckin.upsert({
      user_id: req.user.id,
      checkin_date: today,
      energy_score: energyScore,
      fatigue_score: fatigueScore,
      mood_score: moodScore,
      sleep_score: sleepScore,
      focus_score: focusScore,
      notes: notes || null,
      duration_seconds: durationSeconds || null,
    }, { conflictFields: ['user_id', 'checkin_date'], returning: true });

    const streak = await updateStreak(req.user.id, today);

    // ── Update user_health_state with today's daily scores ──────────────────
    const healthState = await UserHealthState.findOne({ where: { user_id: req.user.id } });
    if (healthState) {
      await healthState.update({
        current_energy_score:  energyScore,
        current_fatigue_score: fatigueScore,
        current_mood_score:    moodScore,
        current_sleep_score:   sleepScore,
        current_focus_score:   focusScore,
        current_daily_total:   energyScore + fatigueScore + moodScore + sleepScore + focusScore,
        last_checkin_date:     today,
        total_checkins:        (healthState.total_checkins || 0) + (created ? 1 : 0),
      });
    }

    return sendSuccess(res, { checkin, streak, isNew: created }, 201);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/checkin/history — Fetch history for trend charts ──
router.get('/history', [
  query('days').optional().isInt({ min: 1, max: 90 }),
], async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await DailyCheckin.findAll({
      where: {
        user_id: req.user.id,
        checkin_date: { [Op.gte]: since.toISOString().split('T')[0] },
      },
      order: [['checkin_date', 'ASC']],
    });

    const streak = await UserStreak.findOne({ where: { user_id: req.user.id } });

    return sendSuccess(res, { logs, streak, days });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
