const express = require('express');
const { body, query, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { DailyCheckin, UserStreak } = require('../models/DailyCheckin');
const UserHealthState = require('../models/UserHealthState');
const { sendSuccess, sendError } = require('../utils/response');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authMiddleware);

// ─── Date helpers ─────────────────────────────────
const toISODate = (d) => d.toISOString().split('T')[0];

const addDays = (isoDate, days) => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
};

/**
 * Resolve the check-in date.
 * Clients may send `localDate` (YYYY-MM-DD in the user's own timezone) so a user in
 * India checking in at 2am isn't credited to "yesterday" (UTC). We only accept dates
 * within ±1 day of the server's UTC date, so the streak can't be gamed.
 * Older clients (Android) that don't send it fall back to the UTC date.
 */
const resolveCheckinDate = (localDate) => {
  const utcToday = toISODate(new Date());
  if (typeof localDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return utcToday;
  const allowed = [addDays(utcToday, -1), utcToday, addDays(utcToday, 1)];
  return allowed.includes(localDate) ? localDate : utcToday;
};

// ─── Streak updater ───────────────────────────────
const updateStreak = async (userId, today) => {
  let streak = await UserStreak.findOne({ where: { user_id: userId } });
  if (!streak) {
    streak = await UserStreak.create({ user_id: userId });
  }

  const last = streak.last_checkin_date;

  // Already logged today (an edit) — or the date is older than the last check-in
  // (timezone edge case) — never reset or double-count the streak.
  if (last && today <= last) {
    return {
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      total_checkins: streak.total_checkins,
      last_checkin_date: last,
    };
  }

  const isConsecutive = last === addDays(today, -1);
  const newCurrent = isConsecutive ? streak.current_streak + 1 : 1;
  const newLongest = Math.max(newCurrent, streak.longest_streak);

  await streak.update({
    current_streak: newCurrent,
    longest_streak: newLongest,
    total_checkins: streak.total_checkins + 1,
    last_checkin_date: today,
  });

  return {
    current_streak: newCurrent,
    longest_streak: newLongest,
    total_checkins: streak.total_checkins,
    last_checkin_date: today,
  };
};

const scoreValidators = [
  body('energyScore').isInt({ min: 0, max: 4 }).toInt(),
  body('fatigueScore').isInt({ min: 0, max: 4 }).toInt(),
  body('moodScore').isInt({ min: 0, max: 4 }).toInt(),
  body('sleepScore').isInt({ min: 0, max: 4 }).toInt(),
  body('focusScore').isInt({ min: 0, max: 4 }).toInt(),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 500 }).withMessage('Notes must be 500 characters or fewer.'),
  body('durationSeconds').optional({ nullable: true }).isInt({ min: 0, max: 3600 }).toInt(),
  body('localDate').optional().isString(),
];

const scoreFields = ({ energyScore, fatigueScore, moodScore, sleepScore, focusScore, notes }) => ({
  energy_score: energyScore,
  fatigue_score: fatigueScore,
  mood_score: moodScore,
  sleep_score: sleepScore,
  focus_score: focusScore,
  notes: notes ? String(notes).trim() : null,
});

// Mirror the latest daily scores into user_health_state (ML / insights snapshot).
const syncHealthState = async (userId, today, b, { countAsNew }) => {
  const healthState = await UserHealthState.findOne({ where: { user_id: userId } });
  if (!healthState) return;
  await healthState.update({
    current_energy_score:  b.energyScore,
    current_fatigue_score: b.fatigueScore,
    current_mood_score:    b.moodScore,
    current_sleep_score:   b.sleepScore,
    current_focus_score:   b.focusScore,
    current_daily_total:   b.energyScore + b.fatigueScore + b.moodScore + b.sleepScore + b.focusScore,
    last_checkin_date:     today,
    total_checkins:        (healthState.total_checkins || 0) + (countAsNew ? 1 : 0),
  });
};

const alreadyCheckedIn = (res, checkin, today) => res.status(409).json({
  success: false,
  code: 'ALREADY_CHECKED_IN',
  error: "You've already checked in today. You can edit today's check-in instead.",
  checkin,
  checkinDate: today,
});

// ── POST /api/checkin/daily — Submit today's check-in (once per day) ──
// Score semantics (shared with the Android app and insights engine):
//   energy / mood / sleep / focus : 0 = very poor … 4 = excellent
//   fatigue                       : 0 = none      … 4 = severe
// A second submission for the same day is rejected with 409 ALREADY_CHECKED_IN;
// changes to today's entry go through PUT /api/checkin/daily instead.
router.post('/daily', scoreValidators, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const today = resolveCheckinDate(req.body.localDate);

    const existing = await DailyCheckin.findOne({ where: { user_id: req.user.id, checkin_date: today } });
    if (existing) return alreadyCheckedIn(res, existing, today);

    let checkin;
    try {
      checkin = await DailyCheckin.create({
        user_id: req.user.id,
        checkin_date: today,
        ...scoreFields(req.body),
        duration_seconds: req.body.durationSeconds || null,
      });
    } catch (err) {
      // Two submissions racing (double tap, two tabs) — the UNIQUE(user_id, checkin_date)
      // constraint lets only one through; the loser gets the same 409 as above.
      if (err.name === 'SequelizeUniqueConstraintError') {
        const winner = await DailyCheckin.findOne({ where: { user_id: req.user.id, checkin_date: today } });
        return alreadyCheckedIn(res, winner, today);
      }
      throw err;
    }

    const streak = await updateStreak(req.user.id, today);
    await syncHealthState(req.user.id, today, req.body, { countAsNew: true });

    return sendSuccess(res, { checkin, streak, isNew: true, checkinDate: today }, 201);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/checkin/daily — Edit today's existing check-in ──
// Only today's entry can be edited; streak and totals are not touched.
router.put('/daily', scoreValidators, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, errors.array()[0].msg);

    const today = resolveCheckinDate(req.body.localDate);
    const checkin = await DailyCheckin.findOne({ where: { user_id: req.user.id, checkin_date: today } });
    if (!checkin) return sendError(res, "You haven't checked in today yet.", 404);

    await checkin.update(scoreFields(req.body));
    await syncHealthState(req.user.id, today, req.body, { countAsNew: false });

    const streakRow = await UserStreak.findOne({ where: { user_id: req.user.id } });
    return sendSuccess(res, { checkin, streak: streakRow, isNew: false, checkinDate: today });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/checkin/history — Fetch history for trend charts ──
router.get('/history', [
  query('days').optional().isInt({ min: 1, max: 90 }),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendError(res, 'days must be between 1 and 90.');

    const days = parseInt(req.query.days, 10) || 7;
    // Include one extra day so users ahead of UTC still see "today".
    const since = addDays(toISODate(new Date()), -days);

    const logs = await DailyCheckin.findAll({
      where: {
        user_id: req.user.id,
        checkin_date: { [Op.gte]: since },
      },
      order: [['checkin_date', 'ASC']],
    });

    const streakRow = await UserStreak.findOne({ where: { user_id: req.user.id } });
    let streak = streakRow ? streakRow.toJSON() : null;

    // A streak is only "current" if the last check-in was today or yesterday.
    // (2-day tolerance covers users in timezones ahead of/behind UTC.)
    if (streak && streak.last_checkin_date) {
      const cutoff = addDays(toISODate(new Date()), -2);
      if (streak.last_checkin_date < cutoff) streak = { ...streak, current_streak: 0 };
    }

    return sendSuccess(res, { logs, streak, days });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
