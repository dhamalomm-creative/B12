// ─── B12 Rich Foods — tagged by diet type and calorie tier ───────────────────
// calories are per serving (approximate).
// dietTags: which diet types CAN eat this food
//   'vegan', 'vegetarian', 'pescatarian', 'omnivore'
// calorieTier: 'high' | 'moderate' | 'low'
//   Used to match BMI recommendations:
//   Underweight (<18.5)  → prefer 'high'
//   Normal (18.5-24.9)   → show all (sorted by B12 content)
//   Overweight (25-29.9) → prefer 'low'
//   Obese (≥30)          → prefer 'low'

export const DAILY_B12_MCG = 2.4; // adult RDA (NIH ODS); 2.6 in pregnancy, 2.8 when breastfeeding

// Amounts are per typical serving, rounded, from the NIH Office of Dietary Supplements
// and USDA FoodData Central. Fortified foods vary by brand — always check the label.
export const B12_FOODS = [
  {
    name: "Clams",
    image: "/foods/clams.jpg",
    emoji: "🦪",
    b12mcg: 84.1,
    serving: "3 oz (85 g), cooked",
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 126,
    desc: "The richest natural B12 source. Lean and high in iron.",
  },
  {
    name: "Beef / mutton liver",
    image: "/foods/beef-liver.jpg",
    emoji: "🍖",
    b12mcg: 70.7,
    serving: "3 oz (85 g), cooked",
    type: 'Meat',
    dietTags: ['omnivore'],
    calorieTier: 'moderate',
    calories: 149,
    desc: "Extremely B12-dense — a small portion once a week is plenty.",
  },
  {
    name: "Mussels",
    image: "/foods/mussels.jpg",
    emoji: "🐚",
    b12mcg: 20.4,
    serving: "3 oz (85 g), cooked",
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 146,
    desc: "Lean seafood with B12, iron and omega-3s.",
  },
  {
    name: "Chicken liver",
    image: "/foods/chicken-liver.jpg",
    emoji: "🍗",
    b12mcg: 14.2,
    serving: "3 oz (85 g), cooked",
    type: 'Meat',
    dietTags: ['omnivore'],
    calorieTier: 'low',
    calories: 142,
    desc: "Affordable organ meat packed with B12 and folate.",
  },
  {
    name: "Sardines (canned)",
    image: "/foods/sardines.jpg",
    emoji: "🐟",
    b12mcg: 8.2,
    serving: "1 small can (92 g)",
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 191,
    desc: "Budget-friendly, shelf-stable, and rich in calcium too.",
  },
  {
    name: "Rainbow trout",
    image: "/foods/trout.jpg",
    emoji: "🐟",
    b12mcg: 5.4,
    serving: "3 oz (85 g), cooked",
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 143,
    desc: "Mild fish with very high B12 content.",
  },
  {
    name: "Salmon",
    image: "/foods/salmon.jpg",
    emoji: "🐠",
    b12mcg: 2.6,
    serving: "3 oz (85 g), cooked",
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 175,
    desc: "Rich in omega-3 fats as well as B12.",
  },
  {
    name: "Tuna (canned, light)",
    image: "/foods/tuna.jpg",
    emoji: "🥫",
    b12mcg: 2.5,
    serving: "3 oz (85 g)",
    type: 'Seafood',
    dietTags: ['pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 99,
    desc: "Convenient, lean protein with solid B12.",
  },
  {
    name: "Mutton / lamb",
    image: "/foods/lamb.jpg",
    emoji: "🍖",
    b12mcg: 2.7,
    serving: "3 oz (85 g), cooked",
    type: 'Meat',
    dietTags: ['omnivore'],
    calorieTier: 'high',
    calories: 250,
    desc: "Good B12 and zinc; choose lean cuts.",
  },
  {
    name: "Lean ground beef",
    image: "/foods/ground-beef.jpg",
    emoji: "🥩",
    b12mcg: 2.4,
    serving: "3 oz (85 g), cooked",
    type: 'Meat',
    dietTags: ['omnivore'],
    calorieTier: 'moderate',
    calories: 184,
    desc: "One serving covers your full daily need.",
  },
  {
    name: "Chicken breast",
    image: "/foods/chicken-breast.jpg",
    emoji: "🍗",
    b12mcg: 0.3,
    serving: "3 oz (85 g), cooked",
    type: 'Meat',
    dietTags: ['omnivore'],
    calorieTier: 'low',
    calories: 140,
    desc: "Lean protein, but only a little B12 — pair with eggs or dairy.",
  },
  {
    name: "Milk",
    image: "/foods/milk.jpg",
    emoji: "🥛",
    b12mcg: 1.2,
    serving: "1 cup (240 ml)",
    type: 'Dairy',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 103,
    desc: "Two glasses a day provide most of an adult's B12 need.",
  },
  {
    name: "Curd / yogurt (dahi)",
    image: "/foods/yogurt.jpg",
    emoji: "🥣",
    b12mcg: 1.0,
    serving: "1 cup (~170 g)",
    type: 'Dairy',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 100,
    desc: "Easy daily source; also good for gut health.",
  },
  {
    name: "Swiss cheese",
    image: "/foods/swiss-cheese.jpg",
    emoji: "🧀",
    b12mcg: 0.9,
    serving: "1 oz (28 g)",
    type: 'Dairy',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'high',
    calories: 111,
    desc: "One of the higher-B12 cheeses.",
  },
  {
    name: "Paneer",
    image: "/foods/paneer.jpg",
    emoji: "🧀",
    b12mcg: 0.7,
    serving: "100 g (approx.)",
    type: 'Dairy',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'high',
    calories: 265,
    desc: "Popular vegetarian protein with modest B12. Values vary by milk used.",
  },
  {
    name: "Cottage cheese",
    image: "/foods/cottage-cheese.jpg",
    emoji: "🥛",
    b12mcg: 0.9,
    serving: "1 cup (~210 g)",
    type: 'Dairy',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 183,
    desc: "High protein, lower fat dairy option.",
  },
  {
    name: "Eggs",
    image: "/foods/eggs.jpg",
    emoji: "🥚",
    b12mcg: 0.5,
    serving: "1 large egg",
    type: 'Eggs',
    dietTags: ['vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 78,
    desc: "Most of the B12 is in the yolk — eat the whole egg.",
  },
  {
    name: "Nutritional yeast (fortified)",
    image: "/foods/nutritional-yeast.jpg",
    emoji: "🌿",
    b12mcg: 8.3,
    serving: "¼ cup (~15 g)",
    type: 'Fortified',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 60,
    desc: "Top vegan source — only fortified brands contain B12. Check the label.",
  },
  {
    name: "Fortified breakfast cereal",
    image: "/foods/cereal.jpg",
    emoji: "🥣",
    b12mcg: 1.5,
    serving: "1 serving (check label)",
    type: 'Fortified',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 110,
    desc: "Amounts vary a lot by brand (0.6–6 mcg). Look for B12 on the label.",
  },
  {
    name: "Fortified soy milk",
    image: "/foods/soy-milk.jpg",
    emoji: "🥤",
    b12mcg: 2.7,
    serving: "1 cup (240 ml)",
    type: 'Fortified',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 80,
    desc: "One of the best plant milks for B12 — if fortified.",
  },
  {
    name: "Fortified almond / oat milk",
    image: "/foods/oat-milk.jpg",
    emoji: "🥤",
    b12mcg: 1.2,
    serving: "1 cup (240 ml)",
    type: 'Fortified',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 60,
    desc: "Choose versions with added B12; unfortified ones have none.",
  },
  {
    name: "B12 supplement",
    image: "/foods/supplement.jpg",
    emoji: "💊",
    b12mcg: 25,
    serving: "1 tablet (dose varies)",
    type: 'Supplement',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'low',
    calories: 0,
    desc: "The most reliable source for vegans and people over 50. Ask a pharmacist or doctor about dose.",
  },
  {
    name: "Tempeh",
    image: "/foods/tempeh.jpg",
    emoji: "🌱",
    b12mcg: 0.1,
    serving: "100 g",
    type: 'Plant',
    dietTags: ['vegan', 'vegetarian', 'pescatarian', 'omnivore'],
    calorieTier: 'moderate',
    calories: 193,
    desc: "Only trace, unreliable B12 — don't count on it as a source.",
  },
];

// ── BMI calculation helper ────────────────────────────────────────────────────
export const calculateBMI = (heightCm, weightKg) => {
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
};

export const getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25)   return 'normal';
  if (bmi < 30)   return 'overweight';
  return 'obese';
};

// ── Food filtering + sorting ──────────────────────────────────────────────────
export const getRecommendedFoods = (dietType, bmiCategory) => {
  // Step 1: filter by diet type
  const diet = dietType || 'omnivore';
  const dietFiltered = B12_FOODS.filter((f) => f.dietTags.includes(diet));

  // Step 2: determine preferred calorie tier based on BMI
  let preferredTier = null;
  if (bmiCategory === 'underweight') preferredTier = 'high';
  else if (bmiCategory === 'overweight' || bmiCategory === 'obese') preferredTier = 'low';

  // Step 3: sort — preferred tier first, then by B12 content descending
  const tierOrder = { high: 0, moderate: 1, low: 2 };
  if (preferredTier === 'low') tierOrder.low = 0;
  else if (preferredTier === 'high') { tierOrder.high = 0; tierOrder.moderate = 1; tierOrder.low = 2; }

  return [...dietFiltered].sort((a, b) => {
    const tierDiff = (tierOrder[a.calorieTier] ?? 1) - (tierOrder[b.calorieTier] ?? 1);
    if (tierDiff !== 0) return tierDiff;
    return b.b12mcg - a.b12mcg; // higher B12 first within same tier
  });
};

// ── BMI UI helpers ────────────────────────────────────────────────────────────
export const BMI_INFO = {
  underweight: {
    label: 'Underweight',
    icon: '⬆️',
    color: '#60A5FA',
    tip: 'Focus on calorie-dense B12 foods to support healthy weight gain.',
    preferLabel: 'High-Calorie B12 Sources',
  },
  normal: {
    label: 'Normal Weight',
    icon: '✅',
    color: '#00C9A7',
    tip: 'Great! Maintain a balanced mix of B12 sources for optimal health.',
    preferLabel: 'Balanced B12 Sources',
  },
  overweight: {
    label: 'Overweight',
    icon: '⚖️',
    color: '#FBBF24',
    tip: 'Choose low-calorie B12 sources to support your health goals.',
    preferLabel: 'Light & B12-Rich Foods',
  },
  obese: {
    label: 'High BMI',
    icon: '💪',
    color: '#F87171',
    tip: 'Prioritize low-calorie, nutrient-dense B12 foods for your journey.',
    preferLabel: 'Low-Calorie B12 Sources',
  },
};
