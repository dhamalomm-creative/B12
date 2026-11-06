/**
 * Verifies the web (frontend) and server (backend) scoring v2 engines agree,
 * and that the backend question bank matches frontend-web/data/questions.js.
 * Run from B12-Project/:  node scripts/check-scoring-parity.mjs
 */
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const require = createRequire(import.meta.url);
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// The frontend files use extension-less "@/..." imports, so copy the two we need
// into a temp folder as .mjs and import them directly.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'b12-parity-'));
fs.copyFileSync(path.join(root, 'frontend-web/data/questions.js'), path.join(tmp, 'questions.mjs'));
fs.copyFileSync(path.join(root, 'frontend-web/utils/riskCalculator.js'), path.join(tmp, 'risk.mjs'));
// import() needs file:// URLs — a bare "C:\..." path is rejected on Windows.
const Q = await import(pathToFileURL(path.join(tmp, 'questions.mjs')).href);
const R = await import(pathToFileURL(path.join(tmp, 'risk.mjs')).href);
const server = require(path.join(root, 'backend/node-service/src/services/scoringEngineV2.js'));

let failures = 0;
const fail = (msg) => { failures += 1; console.error('✗', msg); };

// 1. Bank parity
const all = [
  ...Q.COMMON_QUESTIONS.filter((q) => q.id !== 'b12_food_intake'),
  ...Object.values(Q.DIET_B12_QUESTIONS), Q.SUPPLEMENT_QUESTION, ...Q.CLINICAL_QUESTIONS,
  ...Object.values(Q.AGE_QUESTIONS).flat(), ...Object.values(Q.GENDER_QUESTIONS).flat(),
];
for (const q of all) {
  const b = server.BANK[q.id];
  if (!b) { fail(`missing in backend bank: ${q.id}`); continue; }
  if (b.weight !== q.weight || b.category !== q.category) fail(`weight/category mismatch: ${q.id}`);
  // The food question has one bank entry shared by every diet, so its wording is neutral there
  if (q.id !== 'b12_food_intake' && b.question !== q.question) fail(`question text mismatch: ${q.id}`);
  for (const o of q.options) {
    if (!b.options[o.id] || b.options[o.id].score !== o.score) fail(`option mismatch: ${q.id}.${o.id}`);
    else if (b.options[o.id].label !== o.label) fail(`option label mismatch: ${q.id}.${o.id}`);
  }
}

// 2. Random scoring parity, answering the way the questionnaire does: one visible question
//    at a time, so answers to questions an earlier answer hid are never collected.
const diets = ['vegan', 'vegetarian', 'pescatarian', 'omnivore'];
const genders = ['male', 'female', 'other'];
const pick = (q) => q.options[Math.floor(Math.random() * q.options.length)];
const walk = (qs, chooser = pick) => {
  const answers = {};
  for (let q = qs[0]; q; q = Q.getVisibleQuestions(qs, answers).find((x) => !answers[x.id])) {
    answers[q.id] = chooser(q);
  }
  return answers;
};
const PERIOD_IDS = ['heavy_bleeding', 'period_fatigue', 'irregular_periods', 'period_dizziness'];
const sameScore = (web, srv) => JSON.stringify([web.percentage, web.level, web.breakdown, web.suggestions])
  === JSON.stringify([srv.percentage, srv.level, srv.breakdown, srv.suggestions]);
const serverScore = (answers, qs, diet) => server.scoreItems(server.resolveAnswers(R.toServerAnswers(answers, qs)), diet);

for (let i = 0; i < 2000; i += 1) {
  const diet = diets[i % 4];
  const qs = Q.buildQuestionSet(15 + (i % 60), genders[i % 3], diet);
  const answers = walk(qs);
  const visible = Q.getVisibleQuestions(qs, answers);
  const web = R.calculateRisk(answers, visible, diet);
  const srv = serverScore(answers, visible, diet);
  if (!sameScore(web, srv)) {
    fail(`score mismatch (iteration ${i})\n  web: ${JSON.stringify(web)}\n  srv: ${JSON.stringify(srv)}`);
    break;
  }
  if (visible.length > 60) fail(`more answers than the API allows: ${visible.length}`);
}

// 3. Branching rules
const option = (qs, id, optId) => qs.find((q) => q.id === id).options.find((o) => o.id === optId);
const ids = (qs, answers) => Q.getVisibleQuestions(qs, answers).map((q) => q.id);
const female = Q.buildQuestionSet(45, 'female', 'vegetarian');
const screenAt = female.findIndex((q) => q.id === 'period_status');

if (female[screenAt - 1]?.category === 'Female Health' || female.slice(0, screenAt).some((q) => q.showIf)) {
  fail('period_status must be asked first in the female set');
}
for (const [age, gender] of [[30, 'male'], [30, 'other']]) {
  const set = ids(Q.buildQuestionSet(age, gender, 'omnivore'), {}).join();
  if (/period|pregnant|heavy_bleeding/.test(set)) fail(`${gender} is asked about periods or pregnancy`);
}
Q.buildQuestionSet(70, 'female', 'vegan').forEach((q) => { if (q.id === 'pregnant_postpartum') fail('pregnancy asked at 60+'); });
if (!ids(Q.buildQuestionSet(70, 'female', 'vegan'), {}).includes('period_status')) fail('period_status hidden by age');

const expected = { yes: [true, true], menopause: [false, false], other: [false, true] };
Object.entries(expected).forEach(([answer, [periods, pregnancy]]) => {
  const shown = ids(female, { period_status: option(female, 'period_status', answer) });
  if (PERIOD_IDS.some((id) => shown.includes(id) !== periods)) fail(`period questions wrong for "${answer}"`);
  if (shown.includes('pregnant_postpartum') !== pregnancy) fail(`pregnancy question wrong for "${answer}"`);
});

// Going back and changing the screening answer drops what it now hides, from both engines
const filled = walk(female, (q) => (q.id === 'period_status' ? option(female, q.id, 'yes') : q.options[q.options.length - 1]));
const changed = Q.dropHiddenAnswers(female, { ...filled, period_status: option(female, 'period_status', 'menopause') });
if (PERIOD_IDS.concat('pregnant_postpartum').some((id) => changed[id])) fail('hidden answers survived a changed answer');
const changedQs = Q.getVisibleQuestions(female, changed);
if (R.toServerAnswers(changed, changedQs).some((a) => PERIOD_IDS.includes(a.questionKey))) fail('hidden answers would be submitted');
if (!sameScore(R.calculateRisk(changed, changedQs, 'vegetarian'), serverScore(changed, changedQs, 'vegetarian'))) {
  fail('score mismatch after changing the screening answer');
}

// The screening question itself never moves a score or adds an empty breakdown group
{
  const qs = changedQs;
  const { period_status: _screen, ...without } = changed;
  const a = R.calculateRisk(changed, qs, 'vegetarian');
  const b = R.calculateRisk(without, qs, 'vegetarian');
  if (a.score !== b.score || a.maxPossible !== b.maxPossible || JSON.stringify(a.breakdown) !== JSON.stringify(b.breakdown)) {
    fail('period_status changes the score');
  }
  if ('female_health' in a.breakdown) fail('empty female_health group in the breakdown');
}

// 4. Every question, option and explanation must fit the chosen diet
const FORBIDDEN = {
  vegan: /\b(eggs?|meat|fish|poultry|seafood|dairy|curd|cheese|paneer)\b/i,
  vegetarian: /\b(eggs?|meat|fish|poultry|seafood)\b/i,
  pescatarian: /\b(meat|poultry)\b/i,
  omnivore: /\b(vegans?|vegetarians?|plant-based)\b/i,
};
Object.entries(FORBIDDEN).forEach(([diet, words]) => {
  Q.buildQuestionSet(30, 'female', diet).concat(Q.buildQuestionSet(20, 'male', diet), Q.buildQuestionSet(50, 'male', diet),
    Q.buildQuestionSet(70, 'male', diet)).forEach((q) => {
    const hit = JSON.stringify(q).match(words);
    if (hit) fail(`${diet}: "${hit[0]}" appears in ${q.id}`);
  });
});

fs.rmSync(tmp, { recursive: true, force: true });
if (failures) { console.error(`\n${failures} parity problem(s).`); process.exit(1); }
console.log('✓ Web and server scoring v2 are in sync (bank + 2000 random assessments + branching + diet wording).');
