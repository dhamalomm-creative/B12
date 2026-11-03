// ─── B12 Risk Engine (scoring v2) ─────────────────────────────────────────────
// IMPORTANT: this logic is mirrored 1:1 in the backend at
//   backend/node-service/src/services/scoringEngineV2.js
// so a guest's on-device score and the score saved to the server are identical.
// If you change anything here, change it there too (a parity test guards this).

export const SCORING_VERSION = '2.0';

export const DIET_PENALTY = { vegan: 12, vegetarian: 8, pescatarian: 4, omnivore: 0 };
const MAX_DIET_PENALTY = 12;

export const THRESHOLD_LOW = 35;
export const THRESHOLD_HIGH = 65;

// Display category → breakdown group
export const CATEGORY_GROUPS = {
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

export const GROUP_INFO = {
  energy:        { label: 'Energy & fatigue', desc: 'Tiredness, weakness and energy dips.' },
  neurological:  { label: 'Nerves & brain', desc: 'Tingling, numbness, balance, focus and memory.' },
  psychological: { label: 'Mood', desc: 'Low mood or irritability without a clear cause.' },
  diet:          { label: 'Diet & intake', desc: 'How much B12 your food and supplements provide.' },
  digestive:     { label: 'Digestion', desc: 'Gut symptoms that can reduce absorption.' },
  medical:       { label: 'Medical & medicines', desc: 'Conditions and medicines that block absorption.' },
  lifestyle:     { label: 'Lifestyle', desc: 'Sleep, stress, alcohol and daily routine.' },
  physical:      { label: 'Physical signs', desc: 'Tongue, breathlessness and paleness.' },
  female_health: { label: "Women's health", desc: 'Periods, pregnancy and related fatigue.' },
};

const round = (n) => Math.round(n);

export const getRiskLevel = (percentage) => {
  if (percentage < THRESHOLD_LOW) return 'LOW';
  if (percentage < THRESHOLD_HIGH) return 'MEDIUM';
  return 'HIGH';
};

/**
 * Core scoring — identical on client and server.
 * @param {Array<{questionKey, category, weight, score, maxScore, answerValue}>} items
 * @param {string} dietType
 */
export const scoreItems = (items, dietType) => {
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

  const percentage = max > 0 ? Math.min(100, round((raw / max) * 100)) : 0;
  const breakdown = {};
  Object.keys(groupMax).forEach((g) => {
    breakdown[g] = groupMax[g] > 0 ? Math.min(100, round((groupScore[g] / groupMax[g]) * 100)) : 0;
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
};

export const buildSuggestions = (level, breakdown, dietType, answers = {}) => {
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
};

/** Turn the local answer map into scoring items using the question definitions. */
export const toScoringItems = (answers, questions) =>
  questions
    .filter((q) => answers[q.id])
    .map((q) => ({
      questionKey: q.id,
      category: q.category,
      weight: q.weight || 1,
      score: answers[q.id].score || 0,
      maxScore: Math.max(...q.options.map((o) => o.score || 0)),
      answerValue: answers[q.id].id,
    }));

/**
 * Calculate B12 deficiency risk from questionnaire answers (guest / offline path).
 * @param {Object} answers   { questionId: option }
 * @param {Array}  questions question set shown to the user
 * @param {string} dietType  vegan | vegetarian | pescatarian | omnivore
 */
export const calculateRisk = (answers, questions, dietType) =>
  scoreItems(toScoringItems(answers, questions), dietType);

/** Payload for POST /api/questionnaire/submit (scoring v2). */
export const toServerAnswers = (answers, questions) =>
  questions
    .filter((q) => answers[q.id])
    .map((q) => ({ questionKey: q.id, answerValue: answers[q.id].id }));

/** Normalise a server assessment / submit response into the client result shape. */
export const normalizeServerResult = (data) => {
  if (!data) return null;
  const pct = data.percentage ?? data.risk_percentage ?? data.normalized_score;
  if (pct === undefined || pct === null) return null;
  return {
    percentage: Math.round(Number(pct) || 0),
    level: String(data.risk_level || data.level || getRiskLevel(Number(pct))).toUpperCase(),
    breakdown: data.breakdown || data.category_breakdown || {},
    suggestions: data.suggestions || [],
    completedAt: data.completed_at || data.completedAt || new Date().toISOString(),
    assessmentId: data.assessment_id || data.id || null,
    scoringVersion: data.scoring_version || SCORING_VERSION,
    // Blood test result, if the user added one (stored in pmol/L)
    labPmol: data.lab_b12_value_pmol != null ? Number(data.lab_b12_value_pmol) : null,
    labStatus: data.ml_label || null,
    synced: true,
  };
};

/** Local-date string (YYYY-MM-DD) in the user's own timezone. */
export const localISODate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
