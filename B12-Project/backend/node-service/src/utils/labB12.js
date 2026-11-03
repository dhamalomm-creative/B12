/**
 * Serum vitamin B12 lab results — unit conversion and interpretation.
 *
 * Values are stored in pmol/L (assessments.lab_b12_value_pmol). Many labs (most in
 * India and the US) report pg/mL instead: 1 pg/mL = 0.738 pmol/L.
 *
 * Interpretation uses widely used cut-offs (e.g. NIH ODS, BMJ 2014 review):
 *   < 148 pmol/L (< 200 pg/mL)          → 'deficient'
 *   148–221 pmol/L (200–300 pg/mL)       → 'borderline'
 *   > 221 pmol/L (> 300 pg/mL)           → 'normal'
 * Labs set their own reference ranges, so the app always tells users to follow
 * the range printed on their report. The label is also stored as ml_label
 * (ground truth for future model training).
 *
 * Keep in sync with frontend-web/utils/labResult.js.
 */

const PG_ML_TO_PMOL_L = 0.738;
const DEFICIENT_BELOW_PMOL = 148;
const NORMAL_ABOVE_PMOL = 221;

// Plausible measured range (≈ 27–6,800 pg/mL). Anything outside is almost certainly a typo.
const MIN_PMOL = 20;
const MAX_PMOL = 5000;

const UNITS = ['pg/mL', 'pmol/L'];

const toPmol = (value, unit) => (unit === 'pg/mL' ? value * PG_ML_TO_PMOL_L : value);

const classify = (pmol) => {
  if (pmol < DEFICIENT_BELOW_PMOL) return 'deficient';
  if (pmol <= NORMAL_ABOVE_PMOL) return 'borderline';
  return 'normal';
};

module.exports = {
  PG_ML_TO_PMOL_L,
  DEFICIENT_BELOW_PMOL,
  NORMAL_ABOVE_PMOL,
  MIN_PMOL,
  MAX_PMOL,
  UNITS,
  toPmol,
  classify,
};
