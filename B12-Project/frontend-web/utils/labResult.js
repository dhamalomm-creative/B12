// Serum vitamin B12 blood test — units and plain-language interpretation.
// Mirrors backend/node-service/src/utils/labB12.js (the server stores pmol/L and the status).

export const PG_ML_TO_PMOL_L = 0.738;
export const UNITS = ['pg/mL', 'pmol/L'];

export const toPgMl = (pmol) => Math.round(pmol / PG_ML_TO_PMOL_L);

export const LAB_STATUS = {
  deficient: {
    label: 'Low',
    tone: 'high',
    range: 'below 200 pg/mL (148 pmol/L)',
    message: 'Your result is in the range usually treated as B12 deficiency. Follow your doctor’s advice — deficiency is very treatable with tablets or injections.',
  },
  borderline: {
    label: 'Borderline',
    tone: 'medium',
    range: '200–300 pg/mL (148–221 pmol/L)',
    message: 'Your result is in the grey zone. Doctors often check MMA or homocysteine to confirm, or retest after 2–3 months — especially if you have symptoms.',
  },
  normal: {
    label: 'Normal',
    tone: 'low',
    range: 'above 300 pg/mL (221 pmol/L)',
    message: 'Your result is in the normal range. If tiredness or other symptoms continue, talk to your doctor about other possible causes.',
  },
};

// How the blood test compares with what the questionnaire predicted.
export const compareWithRisk = (status, riskLevel) => {
  const predictedHigh = riskLevel === 'HIGH' || riskLevel === 'MEDIUM';
  if (status === 'normal' && predictedHigh) {
    return 'Your questionnaire showed several warning signs, but your blood test is normal — good news. Keep tracking how you feel.';
  }
  if (status === 'deficient' && riskLevel === 'LOW') {
    return 'Your questionnaire suggested low risk, but your blood test is low. Trust the blood test, and please follow up with your doctor.';
  }
  if (status === 'deficient') return 'Your blood test confirms what your answers suggested.';
  if (status === 'normal') return 'Your blood test matches your low-risk result.';
  return 'Your result is borderline, so talk to your doctor about whether more tests are needed.';
};
