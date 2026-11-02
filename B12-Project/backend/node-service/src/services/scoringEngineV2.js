/**
 * scoringEngineV2.js — B12 risk scoring for the web questionnaire (scoring v2)
 * ===========================================================================
 * Mirrors frontend-web/utils/riskCalculator.js exactly, so the score a guest sees
 * on-device is the same score that gets saved once they create an account.
 *
 * Question definitions live in questionBankV2.json (generated from
 * frontend-web/data/questions.js). The Android app keeps using scoring v1
 * (numeric question IDs) via scoringEngine.js — both paths are supported.
 */

const BANK = require('./questionBankV2.json');

const SCORING_VERSION = '2.0';
const DIET_PENALTY = { vegan: 12, vegetarian: 8, pescatarian: 4, omnivore: 0 };
const MAX_DIET_PENALTY = 12;
const THRESHOLD_LOW = 35;
const THRESHOLD_HIGH = 65;

const CATEGORY_GROUPS = {
  'Energy & Fatigue': 'energy',
  Energy: 'energy',
  Fatigue: 'energy',
  Neurological: 'neurological',
  Mood: 'psychological',
  Diet: 'diet',
  'Diet Habits': 'diet',
  'Digestive Health': 'digestive',
  Medical: 'medical',
  Lifestyle: 'lifestyle',
  Sleep: 'lifestyle',
  'Work Lifestyle': 'lifestyle',
  Physical: 'physical',
  'Female Health': 'female_health',
};

const getRiskLevel = (percentage) => {
  if (percentage < THRESHOLD_LOW) return 'LOW';
  if (percentage < THRESHOLD_HIGH) return 'MEDIUM';
  return 'HIGH';
};

function buildSuggestions(level, breakdown, dietType, answers = {}) {
  const out = [];
  const b = (k) => breakdown[k] || 0;

  if (level === 'HIGH') {
    out.push('See a doctor and ask for a vitamin B12 blood test (serum B12 — your doctor may add MMA or homocysteine).');
  } else if (level === 'MEDIUM') {
    out.push('Consider a B12 blood test at your next check-up, especially if your symptoms continue.');
  }

  if (b('neurological') >= 50) {
    out.push('Tingling, numbness, balance or memory changes should be checked by a doctor soon — nerve symptoms from low B12 can become lasting if untreated.');
  }
  if (answers.absorption_conditions === 'yes') {
    out.push('Conditions that affect absorption often need B12 injections or high-dose tablets — discuss this with your doctor.');
  }
  if (answers.medications === 'one' || answers.medications === 'both') {
    out.push("Metformin and acid-reducing medicines can lower B12 over time. Ask your doctor about yearly B12 checks — don't stop them on your own.");
  }
  if (dietType === 'vegan' && answers.supplement_use !== 'yes_regular') {
    out.push('On a vegan diet, a regular B12 supplement or B12-fortified foods every day is essential.');
  } else if (dietType === 'vegetarian' && answers.supplement_use === 'no') {
    out.push('Include dairy, eggs or fortified foods daily, or consider a B12 supplement.');
  }
  if (b('diet') >= 40) {
    out.push('Add B12-rich foods to most meals — the Foods tab lists options that fit your diet.');
  }
  if (answers.alcohol === 'daily' || answers.alcohol === 'weekly') {
    out.push('Cutting back on alcohol helps your stomach absorb B vitamins.');
  }
  if (b('energy') >= 50) {
    out.push('Log the 30-second daily check-in — two weeks of energy and fatigue data is useful to show your doctor.');
  }
  if (level === 'LOW') {
    out.push('Your answers suggest a low risk right now. Keep eating B12 sources regularly and recheck in 3–6 months.');
  }

  return [...new Set(out)].slice(0, 6);
}

function scoreItems(items, dietType) {
  const diet = DIET_PENALTY[dietType] !== undefined ? dietType : 'omnivore';
  const penalty = DIET_PENALTY[diet];

  let raw = penalty;
  let max = MAX_DIET_PENALTY;
  const groupScore = { diet: penalty };
  const groupMax = { diet: MAX_DIET_PENALTY };

  items.forEach((it) => {
    const w = Number(it.weight) || 1;
    const got = (Number(it.score) || 0) * w;
    const top = (Number(it.maxScore) || 0) * w;
    raw += got;
    max += top;
    const g = CATEGORY_GROUPS[it.category] || 'lifestyle';
    groupScore[g] = (groupScore[g] || 0) + got;
    groupMax[g] = (groupMax[g] || 0) + top;
  });

  const percentage = max > 0 ? Math.min(100, Math.round((raw / max) * 100)) : 0;
  const breakdown = {};
  Object.keys(groupMax).forEach((g) => {
    breakdown[g] = groupMax[g] > 0 ? Math.min(100, Math.round((groupScore[g] / groupMax[g]) * 100)) : 0;
  });

  const level = getRiskLevel(percentage);
  const answers = {};
  items.forEach((it) => { answers[it.questionKey] = it.answerValue; });

  return {
    score: Math.round(raw * 100) / 100,
    maxPossible: Math.round(max * 100) / 100,
    percentage,
    level,
    breakdown,
    suggestions: buildSuggestions(level, breakdown, diet, answers),
    scoringVersion: SCORING_VERSION,
    answeredCount: items.length,
  };
}

/**
 * Validate raw answers against the bank and convert them to scoring items.
 * Throws an Error with statusCode 400 on unknown questions/answers or duplicates.
 * @param {Array<{questionKey: string, answerValue: string}>} answers
 */
function resolveAnswers(answers) {
  const seen = new Set();
  return answers.map((a) => {
    const key = String(a.questionKey || '');
    const value = String(a.answerValue || '');
    const q = BANK[key];
    if (!q) {
      const err = new Error(`Unknown question: ${key.slice(0, 50)}`);
      err.statusCode = 400;
      throw err;
    }
    if (seen.has(key)) {
      const err = new Error(`Duplicate answer for question: ${key}`);
      err.statusCode = 400;
      throw err;
    }
    seen.add(key);
    const opt = q.options[value];
    if (!opt) {
      const err = new Error(`Invalid answer for question: ${key}`);
      err.statusCode = 400;
      throw err;
    }
    return {
      questionKey: key,
      category: q.category,
      weight: q.weight,
      score: opt.score,
      maxScore: Math.max(...Object.values(q.options).map((o) => o.score)),
      answerValue: value,
      answerLabel: opt.label,
      questionText: q.question,
    };
  });
}

module.exports = {
  SCORING_VERSION,
  BANK,
  scoreItems,
  resolveAnswers,
  buildSuggestions,
  getRiskLevel,
};
