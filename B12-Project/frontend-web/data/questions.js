// ─── B12 Questionnaire Data ───────────────────────────────────────────────────
// All questions structured with scoring, categories, filters, and visual explanations

export const DIET_TYPES = [
  { id: 'vegan',       label: 'Vegan',        icon: '🌱', weight: 3 },
  { id: 'vegetarian',  label: 'Vegetarian',   icon: '🥦', weight: 2 },
  { id: 'pescatarian', label: 'Pescatarian',  icon: '🐟', weight: 1 },
  { id: 'omnivore',    label: 'Non-Veg',      icon: '🍖', weight: 0 },
];

export const FREQUENCY_OPTIONS = [
  { id: 'never',     label: 'Never',      score: 0 },
  { id: 'rarely',    label: 'Rarely',     score: 1 },
  { id: 'sometimes', label: 'Sometimes',  score: 2 },
  { id: 'often',     label: 'Often',      score: 3 },
  { id: 'always',    label: 'Always',     score: 4 },
];

export const YES_NO_OPTIONS = [
  { id: 'yes', label: 'Yes', score: 3 },
  { id: 'no',  label: 'No',  score: 0 },
];

export const GRADIENT_OPTIONS = [
  { id: 'never',     label: 'Never',      score: 0 },
  { id: 'rarely',    label: 'Rarely',     score: 1 },
  { id: 'sometimes', label: 'Sometimes',  score: 2 },
  { id: 'often',     label: 'Often',      score: 3 },
];

export const SLEEP_OPTIONS = [
  { id: 'great',  label: '😴 Great',   score: 0 },
  { id: 'good',   label: '🙂 Good',    score: 1 },
  { id: 'fair',   label: '😐 Fair',    score: 2 },
  { id: 'poor',   label: '😫 Poor',    score: 3 },
];

export const MOOD_OPTIONS = [
  { id: 'happy',    label: '😄 Happy',     score: 0 },
  { id: 'neutral',  label: '😐 Neutral',   score: 1 },
  { id: 'low',      label: '😔 Low',       score: 2 },
  { id: 'irritable',label: '😤 Irritable', score: 3 },
];

export const B12_FOOD_OPTIONS = [
  { id: 'daily',   label: 'Daily',         score: 0 },
  { id: 'weekly',  label: 'A few/week',    score: 1 },
  { id: 'monthly', label: 'A few/month',   score: 2 },
  { id: 'rarely',  label: 'Rarely/Never',  score: 3 },
];

// ─── Diet-Specific B12 Food Intake Questions ──────────────────────────────────
export const DIET_B12_QUESTIONS = {
  vegan: {
    id: 'b12_food_intake',
    category: 'Diet',
    categoryIcon: '🌱',
    question: 'How often do you consume B12-fortified foods or supplements? (plant milks, nutritional yeast, cereals, or B12 tablets)',
    insight: 'Plant foods do not naturally produce B12. Fortified foods and regular supplements are the essential sources for vegans.',
    explanation: {
      simpleText: 'How regularly you consume fortified items (plant milks, breakfast cereals, nutritional yeast) or B12 supplements/drops to maintain healthy levels.',
      whyItMatters: 'Vitamin B12 is synthesized by micro-organisms and is absent in unfortified plant foods. Vegan diets require fortified foods or supplements to protect nerves and red blood cells.',
      visualType: 'b12_sources',
      keySigns: [
        'Pure plant-based diets supply zero natural B12 without fortified foods or vitamins',
        'Irregular intake of fortified items or supplements leads to progressive depletion',
      ],
    },
    type: 'custom',
    options: B12_FOOD_OPTIONS,
    weight: 4,
  },
  vegetarian: {
    id: 'b12_food_intake',
    category: 'Diet',
    categoryIcon: '🥦',
    question: 'How often do you eat vegetarian B12 sources? (milk, curd/yogurt, cheese, paneer, eggs, or fortified foods)',
    insight: 'Dairy products and eggs contain B12, but intake levels depend heavily on consistent daily portions.',
    explanation: {
      simpleText: 'How regularly your diet contains dairy foods (milk, curd, yogurt, paneer, cheese), eggs, or B12-fortified breakfast cereals.',
      whyItMatters: 'Vegetarians obtain B12 almost exclusively from dairy and eggs. Small or irregular portions frequently fall below daily metabolic requirements.',
      visualType: 'b12_sources',
      keySigns: [
        'Eating low or sporadic amounts of dairy leaves daily B12 requirements unmet',
        'Egg and dairy intake that skips days in a row raises deficiency risk',
      ],
    },
    type: 'custom',
    options: B12_FOOD_OPTIONS,
    weight: 4,
  },
  pescatarian: {
    id: 'b12_food_intake',
    category: 'Diet',
    categoryIcon: '🐟',
    question: 'How often do you eat B12-rich foods? (fish, seafood, eggs, dairy, fortified cereals)',
    insight: 'Fish, shellfish, eggs, and dairy are excellent natural sources of highly bioavailable B12.',
    explanation: {
      simpleText: 'How frequently you eat seafood (salmon, tuna, mackerel, sardines, prawns), shellfish, eggs, and dairy products.',
      whyItMatters: 'Fish and seafood provide very high concentrations of bioavailable Vitamin B12 that are readily absorbed by the digestive tract.',
      visualType: 'b12_sources',
      keySigns: [
        'Infrequent seafood meals (less than twice a week) reduce overall dietary B12 reserve',
        'Combining fish with dairy products ensures steady cellular nutrition',
      ],
    },
    type: 'custom',
    options: B12_FOOD_OPTIONS,
    weight: 4,
  },
  omnivore: {
    id: 'b12_food_intake',
    category: 'Diet',
    categoryIcon: '🍖',
    question: 'How often do you eat B12-rich foods? (meat, fish, eggs, dairy, fortified cereals)',
    insight: 'Low dietary B12 intake is the most preventable cause of deficiency, especially in plant-based diets.',
    explanation: {
      simpleText: 'How regularly your diet contains foods naturally high in Vitamin B12: red meat, poultry, fish, eggs, milk, curd/yogurt, cheese, or B12-fortified foods.',
      whyItMatters: 'The human body cannot manufacture B12. It must come from animal products, fortified items, or supplements.',
      visualType: 'b12_sources',
      keySigns: [
        'Strict vegetarian or vegan diets provide virtually no B12 without supplementation',
        'Infrequent intake of eggs, meat, or dairy raises deficiency risk',
      ],
    },
    type: 'custom',
    options: B12_FOOD_OPTIONS,
    weight: 4,
  },
};

// ─── COMMON QUESTIONS (all users see these) ──────────────────────────────────
export const COMMON_QUESTIONS = [
  {
    id: 'fatigue_frequency',
    category: 'Energy & Fatigue',
    categoryIcon: '⚡',
    question: 'How often do you feel tired without doing heavy work?',
    insight: 'Persistent fatigue without exertion is one of the earliest and most common signs of Vitamin B12 deficiency.',
    explanation: {
      simpleText: 'Feeling drained, sluggish, or lacking physical stamina during normal days when you have not exercised heavily or worked physically.',
      whyItMatters: 'Vitamin B12 is essential for producing red blood cells that transport oxygen to every organ. Without enough oxygen, cells run out of energy fast.',
      visualType: 'energy_drain',
      keySigns: [
        'Feeling exhausted doing simple chores like walking or folding laundry',
        'Wanting to lie down even after sitting quietly at your desk',
      ],
    },
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 3,
  },
  {
    id: 'weakness_after_rest',
    category: 'Energy & Fatigue',
    categoryIcon: '⚡',
    question: 'Do you feel weak or drained even after a full night of rest?',
    insight: 'Weakness despite adequate sleep can signal a nutritional imbalance — particularly low B12 or iron.',
    explanation: {
      simpleText: 'Waking up after a full night of sleep (7–9 hours) still feeling heavy, limp, or worn out rather than refreshed.',
      whyItMatters: 'Sleep relaxes muscles, but if cells lack B12 to convert food into cellular fuel (ATP), your body remains physically drained.',
      visualType: 'sleep_recovery',
      keySigns: [
        'Waking up feeling as tired as when you went to bed',
        'Struggling to muster physical strength in the morning',
      ],
    },
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 3,
  },
  {
    id: 'low_energy_day',
    category: 'Energy & Fatigue',
    categoryIcon: '⚡',
    question: 'Do you experience low energy during the day?',
    insight: 'Daytime energy crashes often correlate with poor vitamin and nutrient absorption.',
    explanation: {
      simpleText: 'Sharp energy slumps or dips during standard hours where you feel sudden sluggishness or a strong urge to nap.',
      whyItMatters: 'B12 helps regulate steady cellular metabolism and blood oxygen. Low levels cause sharp stamina drop-offs.',
      visualType: 'midday_crash',
      keySigns: [
        'Mid-afternoon energy crashes where staying awake is difficult',
        'Relying on snacks, soda, or quick fixes to keep going',
      ],
    },
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 2,
  },
  {
    id: 'tingling_numbness',
    category: 'Neurological',
    categoryIcon: '🧠',
    question: 'Do you feel tingling or numbness in your hands or feet?',
    insight: 'Tingling sensations can indicate nerve-related issues directly linked to B12 deficiency.',
    explanation: {
      simpleText: 'A "pins and needles" prickling sensation, loss of feeling, or buzzing in your fingers, palms, toes, or feet (like a limb fell asleep without pressure).',
      whyItMatters: 'B12 maintains the myelin sheath — the protective insulation around nerve fibers. Low B12 damages this coating, causing nerves to misfire.',
      visualType: 'nerve_tingling',
      keySigns: [
        'Prickling or burning sensations in fingertips or toes',
        'Numbness or reduced touch sensation when holding objects',
      ],
    },
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 4,
  },
  {
    id: 'concentration',
    category: 'Neurological',
    categoryIcon: '🧠',
    question: 'Do you face difficulty concentrating or staying focused?',
    insight: 'Vitamin B12 plays a critical role in brain function, including focus and cognitive performance.',
    explanation: {
      simpleText: 'Struggling to keep your mind anchored on a task, losing your train of thought easily, or taking much longer to finish normal work.',
      whyItMatters: 'B12 is required to synthesize neurotransmitters that keep your prefrontal cortex alert and capable of sustained attention.',
      visualType: 'focus_target',
      keySigns: [
        'Rereading the same sentence multiple times without absorbing it',
        'Frequently zoning out or feeling mentally scattered',
      ],
    },
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 3,
  },
  {
    id: 'memory_issues',
    category: 'Neurological',
    categoryIcon: '🧠',
    question: 'Do you experience memory problems or brain fog?',
    insight: 'Memory lapses and foggy thinking can be early indicators of B12 deficiency.',
    explanation: {
      simpleText: '"Brain fog" — feeling like your thoughts are slow or clouded, forgetting recent conversations, names, or where you placed everyday items.',
      whyItMatters: 'Low B12 impairs neural transmission in the hippocampus, the memory-processing hub of the brain.',
      visualType: 'brain_fog',
      keySigns: [
        'Forgetting why you walked into a room or what you were about to say',
        'Feeling a hazy, sluggish blur when trying to solve basic problems',
      ],
    },
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 3,
  },
  {
    id: 'mood',
    category: 'Mood',
    categoryIcon: '😔',
    question: 'Do you frequently feel low mood or irritability without clear reason?',
    insight: 'Nutritional deficiencies, especially B12, can significantly affect mood regulation and emotional balance.',
    explanation: {
      simpleText: 'Feeling unusually down, sad, irritable, or emotionally sensitive without any obvious stressful life event.',
      whyItMatters: 'B12 is a key cofactor in producing serotonin and dopamine — the brain chemicals responsible for happiness and emotional stability.',
      visualType: 'mood_scale',
      keySigns: [
        'Snapping at friends or family over minor irritations',
        'Sudden drops in mood or motivation without an external cause',
      ],
    },
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 2,
  },
  {
    id: 'b12_food_intake',
    category: 'Diet',
    categoryIcon: '🥩',
    question: 'How often do you eat B12-rich foods? (meat, fish, eggs, dairy, fortified cereals)',
    insight: 'Low dietary B12 intake is the most preventable cause of deficiency, especially in plant-based diets.',
    explanation: {
      simpleText: 'How regularly your diet contains foods naturally high in Vitamin B12: red meat, poultry, fish, eggs, milk, curd/yogurt, cheese, or B12-fortified foods.',
      whyItMatters: 'The human body cannot manufacture B12. It must come from animal products, fortified items, or supplements.',
      visualType: 'b12_sources',
      keySigns: [
        'Strict vegetarian or vegan diets provide virtually no B12 without supplementation',
        'Infrequent intake of eggs, meat, or dairy raises deficiency risk',
      ],
    },
    type: 'custom',
    options: B12_FOOD_OPTIONS,
    weight: 4,
  },
  {
    id: 'sleep_quality',
    category: 'Lifestyle',
    categoryIcon: '💤',
    question: 'How would you rate your overall sleep quality?',
    insight: 'Poor sleep can worsen fatigue and compound the effects of vitamin deficiency.',
    explanation: {
      simpleText: 'Whether your sleep feels deep and continuous, or shallow, restless, and frequently interrupted.',
      whyItMatters: 'B12 directly participates in the biochemical cycle that produces melatonin (the natural sleep hormone).',
      visualType: 'sleep_quality',
      keySigns: [
        'Tossing and turning or waking up multiple times in the middle of the night',
        'Difficulty slipping into deep, restorative REM sleep',
      ],
    },
    type: 'custom',
    options: SLEEP_OPTIONS,
    weight: 2,
  },
  {
    id: 'dizziness',
    category: 'Lifestyle',
    categoryIcon: '💫',
    question: 'Do you experience dizziness or lightheadedness?',
    insight: 'Dizziness may be linked to anemia caused by low B12 levels.',
    explanation: {
      simpleText: 'Feeling faint, lightheaded, woozy, or like the room or your head is briefly spinning when standing up or moving around.',
      whyItMatters: 'B12 deficiency leads to megaloblastic anemia, where enlarged, fragile red blood cells fail to carry adequate oxygen to your brain.',
      visualType: 'dizziness_swirl',
      keySigns: [
        'Feeling a head rush or darkness when standing up quickly from a chair or bed',
        'Brief momentary loss of balance or floating sensations',
      ],
    },
    type: 'frequency',
    options: FREQUENCY_OPTIONS,
    weight: 3,
  },
];

// ─── AGE-BASED QUESTIONS ─────────────────────────────────────────────────────
export const AGE_QUESTIONS = {
  '15-24': [
    {
      id: 'skip_meals_young',
      category: 'Diet Habits',
      categoryIcon: '🍔',
      question: 'How often do you skip meals during the day?',
      insight: 'Skipping meals disrupts nutrient absorption patterns, increasing deficiency risk.',
      explanation: {
        simpleText: 'Going long stretches without eating meals, such as skipping breakfast or lunch due to classes, studying, or busy routines.',
        whyItMatters: 'Skipping meals deprives the digestive tract of a steady supply of micronutrients and hinders metabolic health.',
        visualType: 'meal_clock',
        keySigns: [
          'Replacing full meals with packaged chips, soda, or snacks',
          'Only eating one heavy meal late in the evening',
        ],
      },
      type: 'gradient',
      options: GRADIENT_OPTIONS,
      weight: 2,
    },
    {
      id: 'junk_food',
      category: 'Diet Habits',
      categoryIcon: '🍟',
      question: 'How often do you rely on junk or processed food?',
      insight: 'Processed foods contain little to no B12 and deplete essential nutrients.',
      explanation: {
        simpleText: 'Frequently having ultra-processed items, instant noodles, deep-fried snacks, or fast food instead of fresh, nutrient-rich meals.',
        whyItMatters: 'Processed foods fill you with calories but provide virtually zero bioavailable Vitamin B12 or essential trace minerals.',
        visualType: 'fast_food',
        keySigns: [
          'Eating fast food or instant takeout 4 or more times per week',
          'Very rare intake of fresh fruits, leafy greens, dairy, or clean protein',
        ],
      },
      type: 'gradient',
      options: GRADIENT_OPTIONS,
      weight: 2,
    },
    {
      id: 'irregular_sleep_young',
      category: 'Sleep',
      categoryIcon: '🌙',
      question: 'How often do you have irregular sleep patterns? (sleeping at different times each night)',
      insight: 'Irregular sleep cycles disrupt the body\'s recovery, worsening nutritional deficiencies.',
      explanation: {
        simpleText: 'Going to bed and waking up at completely different times every day (for example, sleeping at 11 PM one night, then 3 AM the next).',
        whyItMatters: 'Erratic circadian rhythms disrupt hormone release and impair the body\'s nocturnal cell repair and nutrient processing.',
        visualType: 'irregular_clock',
        keySigns: [
          'Late-night screen use delaying sleep on weekdays',
          'Excessive weekend oversleeping to compensate for weekday deficits',
        ],
      },
      type: 'gradient',
      options: GRADIENT_OPTIONS,
      weight: 2,
    },
  ],
  '25-40': [
    {
      id: 'skip_meals_work',
      category: 'Work Lifestyle',
      categoryIcon: '💼',
      question: 'Do you skip meals due to a busy work schedule?',
      insight: 'Work-driven meal skipping is a leading cause of nutritional gaps in adults.',
      explanation: {
        simpleText: 'Missing lunch or delaying meals by many hours because of meetings, tight deadlines, or workload demands.',
        whyItMatters: 'Irregular eating causes blood sugar swings and prevents consistent absorption of daily vitamins like B12.',
        visualType: 'work_desk',
        keySigns: [
          'Realizing it is late afternoon and you have not eaten a proper meal',
          'Relying on quick biscuits or sugary snacks instead of wholesome food',
        ],
      },
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 2,
    },
    {
      id: 'caffeine_reliance',
      category: 'Work Lifestyle',
      categoryIcon: '☕',
      question: 'Do you rely on caffeine (coffee/energy drinks) to get through the day?',
      insight: 'High caffeine reliance often masks fatigue caused by underlying B12 deficiency.',
      explanation: {
        simpleText: 'Needing multiple cups of coffee, tea, or energy drinks throughout the day just to feel alert and functional.',
        whyItMatters: 'Caffeine forces adrenaline release to temporarily mask physical exhaustion, hiding an underlying cellular B12 deficit.',
        visualType: 'caffeine_boost',
        keySigns: [
          'Experiencing headaches or severe sluggishness if you miss your morning caffeine',
          'Drinking 3+ cups daily to overcome constant mental fatigue',
        ],
      },
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 2,
    },
    {
      id: 'drained_after_work',
      category: 'Work Lifestyle',
      categoryIcon: '😮‍💨',
      question: 'Do you feel completely drained after a regular workday?',
      insight: 'Disproportionate fatigue relative to effort is a common B12 deficiency symptom.',
      explanation: {
        simpleText: 'Feeling so physically and mentally spent at the end of a normal workday that you have no stamina left for family, hobbies, or exercise.',
        whyItMatters: 'Healthy cells recover after rest; B12-depleted cells lack the coenzymes needed to rebuild ATP energy reserves.',
        visualType: 'battery_zero',
        keySigns: [
          'Collapsing onto the sofa immediately after finishing work',
          'Lack of motivation or energy to do anything active in the evening',
        ],
      },
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 3,
    },
  ],
  '41-60': [
    {
      id: 'tired_after_rest_mid',
      category: 'Fatigue',
      categoryIcon: '🛋️',
      question: 'Do you frequently feel tired even after resting?',
      insight: 'B12 absorption naturally decreases with age, making deficiency more common after 40.',
      explanation: {
        simpleText: 'Feeling persistent sluggishness and body exhaustion despite getting plenty of rest, quiet weekends, or relaxation.',
        whyItMatters: 'Stomach acid naturally decreases after age 40, reducing your stomach\'s ability to separate B12 from protein in food.',
        visualType: 'aging_absorption',
        keySigns: [
          'Lower stamina compared to just a few years ago',
          'Rest periods no longer fully recharge your physical energy',
        ],
      },
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 3,
    },
    {
      id: 'digestive_issues',
      category: 'Digestive Health',
      categoryIcon: '🫁',
      question: 'Do you experience digestive issues like bloating or indigestion?',
      insight: 'Poor gut health significantly reduces B12 absorption capacity in middle-aged adults.',
      explanation: {
        simpleText: 'Frequent acid reflux, bloating, indigestion, stomach burning, or regularly taking antacid / heartburn pills.',
        whyItMatters: 'B12 requires stomach acid and "Intrinsic Factor" produced by stomach lining cells. Chronic gut inflammation or antacids block B12 absorption.',
        visualType: 'gut_health',
        keySigns: [
          'Feeling heavy or bloated even after light meals',
          'Regular use of antacid tablets or proton pump inhibitors (PPIs)',
        ],
      },
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 2,
    },
  ],
  '60+': [
    {
      id: 'balance_issues',
      category: 'Neurological',
      categoryIcon: '🦵',
      question: 'Do you experience balance problems or unsteadiness when walking?',
      insight: 'Balance issues in older adults are a serious neurological symptom of long-term B12 deficiency.',
      explanation: {
        simpleText: 'Feeling wobbliness, stumbling, or needing to touch walls or furniture for support while walking.',
        whyItMatters: 'Long-term low B12 causes subacute spinal cord changes that degrade proprioception (your nerves\' ability to detect where your feet are).',
        visualType: 'balance_walk',
        keySigns: [
          'Difficulty walking steadily in dim lighting or on uneven walkways',
          'A sensation of swaying or loss of confidence in your footing',
        ],
      },
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 4,
    },
    {
      id: 'frequent_numbness',
      category: 'Neurological',
      categoryIcon: '🤲',
      question: 'Do you frequently experience numbness or tingling in your limbs?',
      insight: 'Frequent numbness in seniors often indicates advanced nerve damage from B12 deficiency.',
      explanation: {
        simpleText: 'Frequent loss of sensation, dullness, or "pins and needles" in your hands, feet, ankles, or lower legs.',
        whyItMatters: 'Peripheral neuropathy from B12 deficiency damages sensory nerve endings, which can become permanent if unaddressed.',
        visualType: 'limb_numbness',
        keySigns: [
          'Reduced ability to feel temperature or textures with your fingers',
          'Feet feeling "wooden" or numb when standing or walking',
        ],
      },
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 4,
    },
  ],
};

// ─── GENDER-BASED QUESTIONS ───────────────────────────────────────────────────
export const GENDER_QUESTIONS = {
  female: [
    {
      id: 'heavy_bleeding',
      category: 'Female Health',
      categoryIcon: '🩸',
      question: 'How often do you experience heavy menstrual bleeding?',
      insight: 'Heavy bleeding leads to significant iron and B12 loss, increasing deficiency risk.',
      explanation: {
        simpleText: 'Periods with unusually heavy flow, such as having to change pads/tampons every 1–2 hours, passing clots, or bleeding longer than 7 days.',
        whyItMatters: 'Substantial blood loss depletes red blood cells rapidly, forcing the bone marrow to consume high amounts of B12 and iron to rebuild them.',
        visualType: 'blood_flow',
        keySigns: [
          'Needing double sanitary protection to prevent accidents',
          'Feeling faint, pale, or completely worn out during peak flow days',
        ],
      },
      type: 'gradient',
      options: GRADIENT_OPTIONS,
      weight: 3,
    },
    {
      id: 'period_fatigue',
      category: 'Female Health',
      categoryIcon: '🔋',
      question: 'How often do you feel significantly more fatigued during your periods?',
      insight: 'Cycle-related fatigue can be both a symptom and amplifier of nutritional deficiencies.',
      explanation: {
        simpleText: 'Experiencing intense fatigue, heavy limbs, or deep sluggishness right before or during your menstrual period.',
        whyItMatters: 'Hormonal shifts combined with marginal B12/iron stores cause sharp drops in oxygen-carrying hemoglobin.',
        visualType: 'period_cycle',
        keySigns: [
          'Struggling to get out of bed on the first few cycle days',
          'Feeling physically weaker compared to the rest of the month',
        ],
      },
      type: 'gradient',
      options: GRADIENT_OPTIONS,
      weight: 2,
    },
    {
      id: 'irregular_periods',
      category: 'Female Health',
      categoryIcon: '📅',
      question: 'How often are your periods irregular?',
      insight: 'Irregular cycles can be connected to hormonal imbalances influenced by nutritional status.',
      explanation: {
        simpleText: 'Menstrual cycles that vary unpredictably in timing, arrive very early or late, or skip months entirely.',
        whyItMatters: 'Nutritional stress and low cellular micronutrients directly impact hypothalamic-pituitary hormone production.',
        visualType: 'cycle_calendar',
        keySigns: [
          'Cycle length fluctuating by more than 7–10 days each month',
          'Skipping cycles without pregnancy or medical explanation',
        ],
      },
      type: 'gradient',
      options: GRADIENT_OPTIONS,
      weight: 2,
    },
    {
      id: 'period_dizziness',
      category: 'Female Health',
      categoryIcon: '💫',
      question: 'How often do you feel dizzy during or after your period?',
      insight: 'Dizziness around the cycle can signal anemia linked to blood-loss and low B12.',
      explanation: {
        simpleText: 'Feeling lightheaded, woozy, or seeing dark spots when standing up during or immediately after your period.',
        whyItMatters: 'Temporary drop in blood volume combined with low red blood cell count reduces oxygen delivery to brain tissue.',
        visualType: 'cycle_dizziness',
        keySigns: [
          'Head rushes when getting up from sitting or lying down',
          'Feeling unsteady or having to sit down to catch your balance',
        ],
      },
      type: 'gradient',
      options: GRADIENT_OPTIONS,
      weight: 3,
    },
    {
      id: 'pregnant_postpartum',
      category: 'Female Health',
      categoryIcon: '🤰',
      question: 'Are you currently pregnant or in the postpartum period?',
      insight: 'Pregnancy and breastfeeding dramatically increase B12 requirements.',
      explanation: {
        simpleText: 'Currently expecting a baby, or within the first year after childbirth and/or nursing your infant.',
        whyItMatters: 'Fetal neurological development and breast milk production consume large amounts of maternal B12 stores, doubling daily demand.',
        visualType: 'pregnancy_care',
        keySigns: [
          'Increased maternal fatigue and brain fog while breastfeeding',
          'Heightened dietary necessity for nerve and brain development',
        ],
      },
      type: 'yesno',
      options: YES_NO_OPTIONS,
      weight: 4,
    },
  ],
  male: [
    {
      id: 'low_energy_rest_male',
      category: 'Energy',
      categoryIcon: '⚡',
      question: 'Do you experience consistently low energy despite adequate rest?',
      insight: 'Unexplained energy crashes in men often point to nutritional deficiencies including B12.',
      explanation: {
        simpleText: 'Feeling chronically low on stamina, physical drive, or enthusiasm throughout the day even when you slept well.',
        whyItMatters: 'Low B12 reduces oxygenation of major muscle groups and slows down energy release from fats and proteins.',
        visualType: 'male_stamina',
        keySigns: [
          'Loss of physical vitality and afternoon motivation',
          'Unexplained lethargy that does not improve with rest',
        ],
      },
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 3,
    },
    {
      id: 'unexplained_weakness',
      category: 'Physical',
      categoryIcon: '💪',
      question: 'Do you experience unexplained physical weakness or reduced strength?',
      insight: 'B12 deficiency can impair muscle function and physical performance.',
      explanation: {
        simpleText: 'A noticeable decline in grip strength, arm/leg power, or muscles feeling like they "give out" or fatigue unusually fast.',
        whyItMatters: 'Motor neurons and muscle mitochondria depend on B12 for rapid electrical signals and peak contraction power.',
        visualType: 'muscle_strength',
        keySigns: [
          'Trouble with everyday grip tasks like opening sealed jars or carrying bags',
          'Leg muscles shaking or feeling weak when climbing stairs',
        ],
      },
      type: 'frequency',
      options: FREQUENCY_OPTIONS,
      weight: 3,
    },
  ],
};

// ─── DAILY CHECK-IN QUESTIONS ─────────────────────────────────────────────────
export const DAILY_CHECKIN = [
  {
    id: 'daily_energy',
    question: 'How is your energy today?',
    icon: '⚡',
    type: 'scale5',
    options: [
      { id: '1', label: 'Very Low',  emoji: '😴', score: 4 },
      { id: '2', label: 'Low',       emoji: '😔', score: 3 },
      { id: '3', label: 'Moderate',  emoji: '😐', score: 2 },
      { id: '4', label: 'Good',      emoji: '🙂', score: 1 },
      { id: '5', label: 'Excellent', emoji: '😄', score: 0 },
    ],
  },
  {
    id: 'daily_fatigue',
    question: 'How tired do you feel right now?',
    icon: '😴',
    type: 'scale5',
    options: [
      { id: '1', label: 'Exhausted',     emoji: '😫', score: 4 },
      { id: '2', label: 'Very Tired',    emoji: '😔', score: 3 },
      { id: '3', label: 'Somewhat Tired',emoji: '😐', score: 2 },
      { id: '4', label: 'A Little',      emoji: '🙂', score: 1 },
      { id: '5', label: 'Refreshed',     emoji: '😄', score: 0 },
    ],
  },
  {
    id: 'daily_mood',
    question: 'How is your mood today?',
    icon: '🧠',
    type: 'scale5',
    options: [
      { id: '1', label: 'Very Low',   emoji: '😢', score: 4 },
      { id: '2', label: 'Low',        emoji: '😔', score: 3 },
      { id: '3', label: 'Neutral',    emoji: '😐', score: 2 },
      { id: '4', label: 'Good',       emoji: '🙂', score: 1 },
      { id: '5', label: 'Great',      emoji: '😄', score: 0 },
    ],
  },
  {
    id: 'daily_sleep',
    question: 'How did you sleep last night?',
    icon: '💤',
    type: 'scale5',
    options: [
      { id: '1', label: 'Terrible', emoji: '😫', score: 4 },
      { id: '2', label: 'Poor',     emoji: '😔', score: 3 },
      { id: '3', label: 'Fair',     emoji: '😐', score: 2 },
      { id: '4', label: 'Good',     emoji: '🙂', score: 1 },
      { id: '5', label: 'Great',    emoji: '😴', score: 0 },
    ],
  },
  {
    id: 'daily_dizziness',
    question: 'Any dizziness or weakness today?',
    icon: '💫',
    type: 'yesno',
    options: [
      { id: 'yes', label: 'Yes', emoji: '😵', score: 3 },
      { id: 'no',  label: 'No',  emoji: '✅', score: 0 },
    ],
  },
];

// ─── Helper: get age group ───────────────────────────────────────────────────
export const getAgeGroup = (age) => {
  const n = parseInt(age);
  if (n >= 15 && n <= 24) return '15-24';
  if (n >= 25 && n <= 40) return '25-40';
  if (n >= 41 && n <= 60) return '41-60';
  if (n > 60)             return '60+';
  return '25-40'; // default
};

// ─── Build personalised question set ────────────────────────────────────────
export const buildQuestionSet = (age, gender, dietType = 'omnivore') => {
  const ageGroup  = getAgeGroup(age);
  const ageQs     = AGE_QUESTIONS[ageGroup]    || [];
  const genderQs  = GENDER_QUESTIONS[gender]   || [];

  const dietKey   = (dietType || 'omnivore').toLowerCase();
  const dietFoodQ = DIET_B12_QUESTIONS[dietKey] || DIET_B12_QUESTIONS.omnivore;

  const customizedCommon = COMMON_QUESTIONS.map((q) => {
    if (q.id === 'b12_food_intake') {
      return dietFoodQ;
    }
    return q;
  });

  return [...customizedCommon, ...ageQs, ...genderQs];
};
