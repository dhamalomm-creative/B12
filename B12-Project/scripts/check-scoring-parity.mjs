/**
 * Verifies the web (frontend) and server (backend) scoring v2 engines agree,
 * and that the backend question bank matches frontend-web/data/questions.js.
 * Run from B12-Project/:  node scripts/check-scoring-parity.mjs
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
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
const Q = await import(path.join(tmp, 'questions.mjs'));
const R = await import(path.join(tmp, 'risk.mjs'));
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
  for (const o of q.options) {
    if (!b.options[o.id] || b.options[o.id].score !== o.score) fail(`option mismatch: ${q.id}.${o.id}`);
  }
}

// 2. Random scoring parity
const diets = ['vegan', 'vegetarian', 'pescatarian', 'omnivore'];
const genders = ['male', 'female', 'other'];
for (let i = 0; i < 2000; i += 1) {
  const diet = diets[i % 4];
  const qs = Q.buildQuestionSet(15 + (i % 60), genders[i % 3], diet);
  const answers = {};
  qs.forEach((q) => { answers[q.id] = q.options[Math.floor(Math.random() * q.options.length)]; });
  const web = R.calculateRisk(answers, qs, diet);
  const srv = server.scoreItems(server.resolveAnswers(R.toServerAnswers(answers, qs)), diet);
  const a = JSON.stringify([web.percentage, web.level, web.breakdown, web.suggestions]);
  const b = JSON.stringify([srv.percentage, srv.level, srv.breakdown, srv.suggestions]);
  if (a !== b) { fail(`score mismatch (iteration ${i})\n  web: ${a}\n  srv: ${b}`); break; }
}

fs.rmSync(tmp, { recursive: true, force: true });
if (failures) { console.error(`\n${failures} parity problem(s).`); process.exit(1); }
console.log('✓ Web and server scoring v2 are in sync (bank + 2000 random assessments).');
