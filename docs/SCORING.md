# Risk Scoring

The B12 risk score is a **rule-based, weighted questionnaire score**, not a diagnosis. It estimates how many known risk factors and symptoms of B12 deficiency a person reports.

There are two versions. Each saved assessment records which one produced it in `assessments.scoring_version`.

| | v1 | v2 |
|---|---|---|
| Client | Android app | Web app |
| Answer key | `questionId` (integer 1–25) | `questionKey` (e.g. `fatigue_frequency`) |
| Question source | `questions` table (`seeds/questions_seed.sql`) | `frontend-web/data/questions.js` → `questionBankV2.json` |
| Server code | `src/services/scoringEngine.js` | `src/services/scoringEngineV2.js` |
| Client code | Android app | `frontend-web/utils/riskCalculator.js` |
| Diet penalty in score | No (affects suggestions only) | Yes |
| Rounding | 2 decimals | Whole numbers |

## v2 (web)

### Question set

The web app builds a personalised set with `buildQuestionSet(age, gender, dietType)` in `frontend-web/data/questions.js`:

1. **Common questions** — energy, neurological, mood, sleep and other symptoms. The generic food question is replaced by a **diet-specific B12 food question** plus a **supplement question**.
2. **Clinical questions** — absorption conditions / stomach surgery, metformin and acid reducers, sore tongue, breathlessness / paleness, alcohol.
3. **Age-group questions** — one set for `15-24`, `25-40`, `41-60` or `60+`.
4. **Gender questions** — `female` (a periods screening question, then periods and pregnancy, see [Branching](#branching)) or `male`.

The food question depends on the diet. **Vegetarian means dairy and fortified foods:** Indian vegetarian diets commonly exclude eggs, so the vegetarian path does not mention eggs. There is no separate egg-eating vegetarian diet. `scripts/check-scoring-parity.mjs` fails if a question in a diet's set mentions food that diet doesn't include.

In the UI the questions are grouped into six sections: Energy, Brain & mood, Diet, Body signs, Health history, Just for you (`data/questionnaireSections.js`).

### Branching

A question with `showIf: { question, anyOf }` is hidden once the controlling question has an answer outside `anyOf`. Until then it counts as visible, so the question total can only go down when an answer rules questions out. The controlling question must come earlier in the set.

`period_status` ("Do you currently have periods?") is asked first in the female set:

| Answer | Period questions (4) | Pregnancy question |
|---|---|---|
| `yes` | Asked | Asked |
| `menopause` | Skipped | Skipped |
| `other` | Skipped | Asked |

- `period_status` is never hidden by age. The pregnancy question is left out at `60+` whatever the answer.
- `period_status` scores 0 on every option, so it has no effect on the score, and groups with nothing to score are left out of the breakdown.
- When an answer changes, `dropHiddenAnswers()` removes answers to questions it hides, so they are not saved, scored or submitted.
- The server has no branching of its own: it scores the answers it receives, and an assessment without `period_status` stays valid.
- Skipping questions shrinks `max`, so a woman past menopause is scored on fewer questions than the full set. The formula and option scores are unchanged, so `SCORING_VERSION` stays `2.0`.

### Formula

For each answered question *i*, with answer score *sᵢ*, highest possible option score *mᵢ* and weight *wᵢ*:

```
raw  = dietPenalty    + Σ sᵢ · wᵢ
max  = 12             + Σ mᵢ · wᵢ
percentage = min(100, round(raw / max × 100))
```

| Diet | Penalty (out of 12) |
|---|---|
| vegan | 12 |
| vegetarian | 8 |
| pescatarian | 4 |
| omnivore (default) | 0 |

### Risk levels

| Level | Percentage |
|---|---|
| Low | < 35 |
| Medium | 35 – 64 |
| High | ≥ 65 |

### Category breakdown

Each question category maps to a group; each group gets its own 0–100 score using the same formula restricted to that group. The diet penalty counts toward `diet`.

| Question category | Group |
|---|---|
| Energy & Fatigue, Energy, Fatigue | `energy` |
| Neurological | `neurological` |
| Mood | `psychological` |
| Diet, Diet Habits | `diet` |
| Digestive Health | `digestive` |
| Medical | `medical` |
| Lifestyle, Sleep, Work Lifestyle | `lifestyle` |
| Physical | `physical` |
| Female Health | `female_health` |
| anything else | `lifestyle` |

### Suggestions

Up to six, de-duplicated, chosen by rules such as:

- High → see a doctor and ask for a serum B12 test. Medium → consider a test at the next check-up.
- `neurological` ≥ 50 → get nerve symptoms checked soon.
- Absorption condition → discuss injections / high-dose tablets.
- Metformin or acid reducers → ask about yearly B12 checks (do not stop them).
- Vegan without regular supplement → daily supplement or fortified foods.
- `diet` ≥ 40 → add B12-rich foods. Regular alcohol → cut back. `energy` ≥ 50 → keep logging check-ins.
- Low → keep it up and recheck in 3–6 months.

### Keeping web and server in sync

A guest's score is calculated in the browser, and the same answers are scored again on the server after sign-up. The two must match.

If you change questions, options, weights, categories or the formula:

1. Edit `frontend-web/data/questions.js` and/or `frontend-web/utils/riskCalculator.js`.
2. Update `backend/node-service/src/services/questionBankV2.json` and `scoringEngineV2.js` to match.
3. If the change alters scores, bump `SCORING_VERSION` in **both** files so old and new assessments can be told apart.
4. From `B12-Project`, run:

   ```bash
   node scripts/check-scoring-parity.mjs
   ```

   It checks the two question banks match (the shared `b12_food_intake` entry has neutral wording), that both engines give the same result for 2,000 random assessments that follow the branching, and the branching and diet wording rules.

## v1 (Android)

- Each of the 25 seeded questions has a fixed weight (1.1 – 2.5) and category in `scoringEngine.js`.
- `percentage = raw / max × 100`, where `max` only counts the questions that were answered.
- Levels: Low < 35, Medium 35 – 65, High > 65.
- Up to five suggestions, based on the level, the category breakdown and profile flags (diet, metformin, pernicious anaemia, Crohn's / coeliac).
- Unknown answer values score 0.

Do not change v1 weights or answer scores without coordinating with the Android app.

## Limitations

- The weights are expert-chosen, not learned from data. The schema stores everything needed (`assessment_answers`, `ml_label`, `lab_b12_value_pmol`) to train and validate a model later.
- The score has not been clinically validated. The app's copy, results page and Terms all say it is not a diagnosis.
