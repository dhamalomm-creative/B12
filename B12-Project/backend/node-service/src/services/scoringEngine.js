/**
 * scoringEngine.js — Native JavaScript B12 Deficiency Risk & Trend Engine
 * =====================================================================
 * Replaces the Python FastAPI microservice completely.
 * Zero network overhead, zero extra process, runs directly inside Node.js.
 *
 * Scoring algorithm:
 *   1. For each answer: weighted_score = answer.score × question.weight
 *   2. raw_score = sum of all weighted_scores
 *   3. normalized_score = (raw_score / max_possible_score) × 100
 *   4. Risk level: Low < 35% | Medium 35–65% | High > 65%
 */

const QUESTION_WEIGHTS = {
  1: 2.0, 2: 1.5, 3: 1.8, 4: 2.0, 5: 1.8, 6: 1.6, 7: 1.5,
  8: 1.4, 9: 2.0, 10: 1.6, 11: 1.8, 12: 1.2, 13: 2.0, 14: 2.0,
  15: 2.5, 16: 2.5, 17: 1.5, 18: 2.2, 19: 2.5, 20: 1.6, 21: 1.8,
  22: 1.4, 23: 1.2, 24: 1.3, 25: 1.1,
};

const QUESTION_CATEGORIES = {
  1: 'diet', 2: 'diet', 3: 'energy', 4: 'neurological', 5: 'neurological',
  6: 'energy', 7: 'psychological', 8: 'digestive', 9: 'energy', 10: 'digestive',
  11: 'diet', 12: 'lifestyle', 13: 'lifestyle', 14: 'lifestyle', 15: 'lifestyle',
  16: 'lifestyle', 17: 'diet', 18: 'neurological', 19: 'neurological',
  20: 'energy', 21: 'lifestyle', 22: 'lifestyle', 23: 'lifestyle',
  24: 'psychological', 25: 'lifestyle',
};

const ANSWER_SCORES = {
  1: { daily: 0, few_week: 1, rarely: 3, never: 4 },
  2: { yes_regular: 0, yes_occasional: 1, no: 4 },
  3: { never: 0, sometimes: 1, often: 3, always: 4 },
  4: { never: 0, occasionally: 1, frequently: 3, daily: 4 },
  5: { never: 0, occasionally: 1, frequently: 3, very_often: 4 },
  6: { never: 0, rarely: 1, sometimes: 2, frequently: 4 },
  7: { positive: 0, occasional_low: 1, frequent_low: 3, persistent_low: 4 },
  8: { never: 0, occasionally: 1, frequently: 3, always: 4 },
  9: { no: 0, past: 2, current: 4 },
  10: { no: 0, occasionally: 2, yes: 4 },
  11: { no: 0, vegetarian: 1, vegan_fortified: 2, strict_vegan: 4 },
  12: { never: 0, occasionally: 1, often: 3, daily: 4 },
  13: { no: 0, planning: 1, pregnant: 3, breastfeeding: 3 },
  14: { no: 0, occasionally: 1, yes_one: 3, yes_both: 4 },
  15: { no: 0, minor: 1, major: 4 },
  16: { no: 0, suspected: 2, yes: 4 },
  17: { yes: 0, diet_focused: 1, no_supplement_some: 3, no_supplement_none: 4 },
  18: { no: 0, occasionally: 2, frequently: 4 },
  19: { no: 0, some: 1, noticeable: 3, significant: 4 },
  20: { no: 0, moderate: 1, heavy: 3 },
  21: { no: 0, over_6mo: 1, recent: 3 },
  22: { no: 0, low: 1, moderate: 2, daily: 4 },
  23: { no: 0, recreational: 0, high_intensity: 1, professional: 2 },
  24: { low: 0, moderate: 1, high: 3, very_high: 4 },
  25: { optimal: 0, slightly_less: 1, less: 2, very_less: 4 },
};

const MAX_OPTION_SCORES = {
  1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 4,
  11: 4, 12: 4, 13: 3, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4,
  20: 3, 21: 3, 22: 4, 23: 2, 24: 4, 25: 4,
};

const THRESHOLD_LOW = 35.0;
const THRESHOLD_HIGH = 65.0;

function getRiskLevel(percentage) {
  if (percentage < THRESHOLD_LOW) return 'low';
  if (percentage <= THRESHOLD_HIGH) return 'medium';
  return 'high';
}

function getSuggestions(riskLevel, breakdown, profile = {}) {
  const suggestions = [];

  if (riskLevel === 'high') {
    suggestions.push('⚠️ Consult a healthcare provider and request a serum B12 blood test.');
    suggestions.push('Consider starting a B12 supplement (1000mcg cyanocobalamin daily).');
  } else if (riskLevel === 'medium') {
    suggestions.push('Consider taking a regular Vitamin B12 supplement.');
  }

  if ((breakdown.diet || 0) >= 40) {
    suggestions.push('Include more B12-rich foods: eggs, dairy, fish, or fortified plant milks.');
  }
  if ((breakdown.neurological || 0) >= 50) {
    suggestions.push('Neurological symptoms can be early signs of B12 deficiency. Discuss with a doctor.');
  }
  if ((breakdown.energy || 0) >= 50) {
    suggestions.push('Persistent fatigue and weakness are core B12 deficiency indicators.');
  }
  if ((breakdown.digestive || 0) >= 50) {
    suggestions.push('Digestive issues can impair B12 absorption — consider sublingual supplements.');
  }

  if (profile.diet_type === 'vegan') {
    suggestions.push('As a vegan, B12 supplementation is essential. Look for B12-fortified foods daily.');
  }
  if (profile.diet_type === 'vegetarian') {
    suggestions.push('Vegetarians may absorb less B12 — regular supplementation is recommended.');
  }
  if (profile.takes_metformin) {
    suggestions.push('Metformin can deplete B12 levels. Ask your doctor to monitor your B12 annually.');
  }
  if (profile.has_pernicious_anemia || profile.has_crohns_celiac) {
    suggestions.push('Your medical condition significantly affects B12 absorption — discuss B12 injections with your doctor.');
  }

  // Deduplicate and limit to top 5
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Calculate questionnaire B12 risk score
 * @param {Object} payload { answers: [{ question_id, answer_value }], profile: {...} }
 */
function score(payload) {
  const answers = payload.answers || [];
  const profile = payload.profile || {};

  let rawScore = 0.0;
  let maxPossibleScore = 0.0;
  const categoryTotals = {};
  const categoryMax = {};

  for (const answer of answers) {
    const qid = answer.question_id;
    const val = answer.answer_value;

    const weight = QUESTION_WEIGHTS[qid] || 1.0;
    const answerScore = (ANSWER_SCORES[qid] && ANSWER_SCORES[qid][val] !== undefined)
      ? ANSWER_SCORES[qid][val]
      : 0;
    const maxAnswerScore = MAX_OPTION_SCORES[qid] || 4;
    const category = QUESTION_CATEGORIES[qid] || 'other';

    const weighted = answerScore * weight;
    const maxWeighted = maxAnswerScore * weight;

    rawScore += weighted;
    maxPossibleScore += maxWeighted;

    categoryTotals[category] = (categoryTotals[category] || 0.0) + weighted;
    categoryMax[category] = (categoryMax[category] || 0.0) + maxWeighted;
  }

  const normalized = maxPossibleScore > 0 ? (rawScore / maxPossibleScore) * 100 : 0.0;

  const breakdown = {};
  for (const [cat, total] of Object.entries(categoryTotals)) {
    const maxCat = categoryMax[cat] || 1;
    breakdown[cat] = maxCat > 0 ? Number(((total / maxCat) * 100).toFixed(1)) : 0.0;
  }

  const riskLevel = getRiskLevel(normalized);
  const suggestions = getSuggestions(riskLevel, breakdown, profile);

  return {
    raw_score: Number(rawScore.toFixed(2)),
    max_possible_score: Number(maxPossibleScore.toFixed(2)),
    normalized_score: Number(normalized.toFixed(2)),
    percentage: Number(normalized.toFixed(2)),
    risk_level: riskLevel,
    breakdown,
    suggestions,
  };
}

/**
 * Helper to compute direction for an array of values
 */
function calculateDirection(values) {
  if (!values || values.length < 2) return 'stable';
  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondHalf = values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);
  const diff = secondHalf - firstHalf;
  if (diff > 0.3) return 'improving';
  if (diff < -0.3) return 'declining';
  return 'stable';
}

/**
 * Trend analysis for check-in logs
 * @param {Array} logs
 */
function getTrends(logs = []) {
  if (!logs || logs.length === 0) {
    return { trends: [], pattern_alerts: [], days_analyzed: 0 };
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(a.checkin_date) - new Date(b.checkin_date));
  const n = sortedLogs.length;

  const metricsConfig = [
    { key: 'energy_score', label: 'Energy' },
    { key: 'fatigue_score', label: 'Fatigue' },
    { key: 'mood_score', label: 'Mood' },
    { key: 'sleep_score', label: 'Sleep' },
    { key: 'focus_score', label: 'Focus' },
  ];

  const trends = [];
  const pattern_alerts = [];

  for (const { key, label } of metricsConfig) {
    const values = sortedLogs.map((log) => Number(log[key] || 0));
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const direction = calculateDirection(values);

    trends.push({
      metric: label,
      values,
      average: Number(avg.toFixed(2)),
      direction,
    });
  }

  // Pattern alerts
  const fatigueValues = sortedLogs.map((log) => Number(log.fatigue_score || 0));
  const highFatigueCount = fatigueValues.filter((v) => v >= 3).length;
  if (highFatigueCount >= 3) {
    pattern_alerts.push(`⚠️ Fatigue reported highly ${highFatigueCount} of last ${n} days`);
  }

  const energyValues = sortedLogs.map((log) => Number(log.energy_score || 0));
  const avgEnergy = energyValues.length ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length : 0;
  if (avgEnergy < 1.5) {
    pattern_alerts.push(`⚡ Low average energy (${avgEnergy.toFixed(1)}/4) this period`);
  }

  const sleepValues = sortedLogs.map((log) => Number(log.sleep_score || 0));
  const poorSleepCount = sleepValues.filter((v) => v <= 1).length;
  if (poorSleepCount >= 3) {
    pattern_alerts.push(`😴 Poor sleep ${poorSleepCount} of last ${n} days`);
  }

  const moodValues = sortedLogs.map((log) => Number(log.mood_score || 0));
  const lowMoodCount = moodValues.filter((v) => v <= 1).length;
  if (lowMoodCount >= 3) {
    pattern_alerts.push(`🧠 Low mood reported ${lowMoodCount} of last ${n} days`);
  }

  return {
    trends,
    pattern_alerts,
    days_analyzed: n,
  };
}

module.exports = {
  score,
  getTrends,
};
