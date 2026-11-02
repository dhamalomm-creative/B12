// ─── Questionnaire sections & "Did you know" breaks ───────────────────────────
// Groups the adaptive question set into a few friendly sections for the stepper,
// and provides short evidence-based facts shown between sections.
// Facts are paraphrased from the NIH Office of Dietary Supplements B12 fact sheet.

export const SECTIONS = [
  { id: 'energy', label: 'Energy',          icon: '⚡' },
  { id: 'brain',  label: 'Brain & mood',    icon: '🧠' },
  { id: 'diet',   label: 'Diet',            icon: '🥗' },
  { id: 'body',   label: 'Body signs',      icon: '🫀' },
  { id: 'health', label: 'Health history',  icon: '🩺' },
  { id: 'you',    label: 'Just for you',    icon: '✨' },
];

const SECTION_BY_QUESTION = {
  fatigue_frequency: 'energy',
  weakness_after_rest: 'energy',
  low_energy_day: 'energy',
  tingling_numbness: 'brain',
  concentration: 'brain',
  memory_issues: 'brain',
  mood: 'brain',
  b12_food_intake: 'diet',
  supplement_use: 'diet',
  sleep_quality: 'body',
  dizziness: 'body',
  tongue_mouth: 'body',
  breathless_pale: 'body',
  absorption_conditions: 'health',
  medications: 'health',
  alcohol: 'health',
};

export const getSectionId = (questionId) => SECTION_BY_QUESTION[questionId] || 'you';

export const SECTION_FACTS = {
  energy: {
    emoji: '🩸',
    title: 'Why tiredness comes first',
    body: 'B12 is needed to make healthy red blood cells. When levels fall, fewer and larger red cells carry less oxygen — so tiredness and weakness are often the earliest signs people notice.',
    stat: '2.4 mcg',
    statLabel: 'B12 an adult needs per day',
  },
  brain: {
    emoji: '🧠',
    title: 'B12 protects your nerves',
    body: 'B12 helps maintain myelin, the insulating layer around nerves. Tingling, numbness, memory and mood changes can appear even before a blood count looks abnormal — which is why they carry extra weight in your score.',
    stat: 'Early',
    statLabel: 'treatment helps nerve symptoms recover',
  },
  diet: {
    emoji: '🫙',
    title: 'Your body keeps a reserve',
    body: 'Your liver can store several years’ worth of B12. That means a low-B12 diet may not cause symptoms for a long time — and by the time it does, stores are already running low.',
    stat: '3–5 yrs',
    statLabel: 'that liver stores can last',
  },
  body: {
    emoji: '👅',
    title: 'Clues your body gives',
    body: 'Fast-renewing tissues show low B12 early: a smooth, sore tongue, mouth ulcers, pale skin and breathlessness on light activity are all classic signs doctors look for.',
    stat: '50+',
    statLabel: 'age when absorption naturally declines',
  },
  health: {
    emoji: '💊',
    title: 'Absorption matters as much as diet',
    body: 'Stomach acid and a protein called intrinsic factor are needed to absorb B12. Long-term acid reducers, metformin, gut conditions and stomach surgery can all lower levels even with a good diet.',
    stat: 'Yearly',
    statLabel: 'testing is often advised for these groups',
  },
};
