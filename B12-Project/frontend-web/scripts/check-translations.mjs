// Checks that every piece of app text has Hindi and Marathi, and that placeholders match.
// Run with: npm run i18n:check
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (file) => import(pathToFileURL(join(root, file)).href);

const dict = {
  ...(await load('i18n/translations/ui.js')).default,
  ...(await load('i18n/translations/questions.js')).default,
  ...(await load('i18n/translations/foods.js')).default,
};
const questionData = await load('data/questions.js');
const foodData = await load('data/b12Foods.js');
const sectionData = await load('data/questionnaireSections.js');
const risk = await load('utils/riskCalculator.js');
const lab = await load('utils/labResult.js');

const stripIcon = (s) => s.replace(/^[^\p{L}\p{N}"({“]+\s*/u, ''); // option labels start with an emoji
const needed = new Map(); // English text → where it came from
const need = (text, from) => {
  if (typeof text === 'string' && /[A-Za-z]{2}/.test(text)) needed.set(stripIcon(text), from);
};

// ── Data files: only fields that reach the screen ──
const TEXT_FIELDS = ['label', 'question', 'insight', 'category', 'simpleText', 'whyItMatters', 'name', 'serving', 'desc', 'title', 'body', 'statLabel', 'tip', 'energy', 'light'];
const walk = (value, from) => {
  if (Array.isArray(value)) value.forEach((v) => walk(v, from));
  else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, v]) => {
      if (key === 'keySigns') v.forEach((s) => need(s, from));
      else if (TEXT_FIELDS.includes(key) && typeof v === 'string') need(v, from);
      else walk(v, from);
    });
  }
};
const { DAILY_CHECKIN, ...questions } = questionData; // DAILY_CHECKIN isn't used by the web app
Object.values(questions).filter((v) => typeof v === 'object').forEach((v) => walk(v, 'data/questions.js'));
walk(foodData.B12_FOODS, 'data/b12Foods.js');
foodData.B12_FOODS.forEach((f) => need(f.type, 'data/b12Foods.js'));
walk(foodData.BMI_TIP_FOODS, 'data/b12Foods.js');
Object.values(foodData.BMI_INFO).forEach((b) => need(b.tip, 'data/b12Foods.js'));
walk(sectionData.SECTIONS, 'data/questionnaireSections.js');
walk(sectionData.SECTION_FACTS, 'data/questionnaireSections.js');
Object.values(sectionData.SECTION_FACTS).forEach((f) => need(f.stat, 'data/questionnaireSections.js'));
walk(risk.GROUP_INFO, 'utils/riskCalculator.js');
Object.values(lab.LAB_STATUS).forEach((s) => ['label', 'range', 'message'].forEach((k) => need(s[k], 'utils/labResult.js')));

// ── Source files: strings passed to t()/rich(), and text held in constants ──
const SKIP = new Set(['node_modules', '.next', 'i18n', 'scripts', 'public']);
const SKIP_FILES = /QuestionExplainer|questionnaireInterstitials|EmptyState|ErrorState|privacy.page|terms.page|^data|opengraph|twitter-image|app.layout|not-found/; // legal text and page metadata stay in English
const files = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  if (SKIP.has(name)) return [];
  if (statSync(path).isDirectory()) return files(path);
  return /\.js$/.test(name) ? [path] : [];
});
const LITERAL = String.raw`('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")`;
const CALLS = new RegExp(String.raw`\b(?:t|rich)\(\s*${LITERAL}`, 'g');
const CONDITIONAL = new RegExp(String.raw`\bt\(\s*[^'"()]+?\?\s*${LITERAL}\s*:\s*${LITERAL}`, 'g');
const FIELDS = new RegExp(String.raw`\b(?:label|title|message|desc|hint|q|a|value)\s*:\s*${LITERAL}`, 'g');
const ANY_LITERAL = new RegExp(LITERAL, 'g');
const unquote = (s) => s.slice(1, -1).replace(/\\n/g, '\n').replace(/\\(['"])/g, '$1');

for (const path of files(root)) {
  const from = relative(root, path);
  if (SKIP_FILES.test(from)) continue;
  const source = readFileSync(path, 'utf8');
  for (const m of source.matchAll(CALLS)) need(unquote(m[1]), from);
  for (const m of source.matchAll(CONDITIONAL)) { need(unquote(m[1]), from); need(unquote(m[2]), from); }
  // Multi-line t(a ? 'x' : 'y') chains
  for (const m of source.matchAll(/\bt\(\s*[\s\S]{0,400}?\)\}/g)) {
    if (m[0].includes('?')) for (const lit of m[0].matchAll(ANY_LITERAL)) need(unquote(lit[1]), from);
  }
  if (from !== 'context\\AppContext.js' && !from.startsWith('app\\report')) {
    for (const m of source.matchAll(FIELDS)) need(unquote(m[1]), from);
  }
}

// ── Report ──
const problems = [];
for (const [text, from] of needed) {
  if (/^[a-z]+[_-]?[a-z]*\d*$|^pg\/mL$/.test(text) && !dict[text]) continue; // ids such as 'vegan', and units
  if (!dict[text]) problems.push(`Missing (${from}): ${text}`);
}
const placeholders = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
for (const [text, entry] of Object.entries(dict)) {
  if (entry.length !== 2 || entry.some((s) => !s || !s.trim())) problems.push(`Incomplete: ${text}`);
  entry.forEach((s) => {
    if (placeholders(s) !== placeholders(text)) problems.push(`Placeholder mismatch: ${text} → ${s}`);
    if (/[A-Za-z]{4,}/.test(s.replace(/\{\w+\}|Cobalamin|Save as PDF|Unsplash|Wikimedia Commons|FoodData Central|Health Tracker|Enter|DELETE|USDA|kcal|pmol/g, ''))) {
      problems.push(`Untranslated words: ${s}`);
    }
  });
}

console.log(`${Object.keys(dict).length} translated strings, ${needed.size} strings used by the app.`);
if (problems.length) {
  console.log(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log('All text has Hindi and Marathi.');
}
