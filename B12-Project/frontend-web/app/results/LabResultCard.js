'use client';
import { useState } from 'react';
import { questionnaireAPI } from '@/services/api';
import { LAB_STATUS, UNITS, toPgMl, compareWithRisk } from '@/utils/labResult';
import page from './page.module.css';
import styles from './LabResultCard.module.css';

/**
 * Lets the user attach their serum B12 blood test to an assessment and shows how it
 * compares with the questionnaire. The server stores the value (pmol/L) and its
 * interpretation, which becomes real-world data for improving the score later.
 */
export default function LabResultCard({ assessmentId, riskLevel, labPmol, labStatus, onChange }) {
  const hasLab = labPmol != null && LAB_STATUS[labStatus];
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('pg/mL');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setValue(hasLab ? String(unit === 'pg/mL' ? toPgMl(labPmol) : labPmol) : '');
    setError('');
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const num = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(num) || num <= 0) {
      setError('Enter the B12 number from your lab report.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await questionnaireAPI.saveLab(assessmentId, { value: num, unit });
      onChange({ labPmol: data.lab?.value_pmol_l ?? null, labStatus: data.lab?.status ?? null });
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Could not save your result. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError('');
    try {
      await questionnaireAPI.deleteLab(assessmentId);
      onChange({ labPmol: null, labStatus: null });
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Could not remove your result. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const info = hasLab ? LAB_STATUS[labStatus] : null;

  return (
    <section className={`${page.card} ${styles.card}`} aria-labelledby="lab-heading">
      <h2 id="lab-heading" className={page.cardHeading}>Your blood test</h2>

      {!editing && hasLab && (
        <>
          <div className={styles.resultRow}>
            <span className={styles.value}>
              {toPgMl(labPmol)} <small>pg/mL</small>
            </span>
            <span className={styles.alt}>= {Math.round(labPmol)} pmol/L</span>
            <span className={`${page.levelBadge} ${page[`badge_${info.tone}`]}`}>{info.label}</span>
          </div>
          <p className={styles.message}>{info.message}</p>
          <p className={styles.compare}>{compareWithRisk(labStatus, riskLevel)}</p>
          <p className={styles.note}>
            Ranges used: low {LAB_STATUS.deficient.range}, borderline {LAB_STATUS.borderline.range}. Labs differ —
            the range printed on your report and your doctor’s advice come first.
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.linkBtn} onClick={startEdit} disabled={saving}>Edit</button>
            <button type="button" className={styles.linkBtn} onClick={remove} disabled={saving}>Remove</button>
          </div>
        </>
      )}

      {!editing && !hasLab && (
        <>
          <p className={page.cardSub}>
            Had a vitamin B12 blood test? Add the result to see how it compares with your questionnaire — and keep it with
            your report for your doctor.
          </p>
          <button type="button" className={page.secondaryBtn} onClick={startEdit}>Add my blood test result</button>
        </>
      )}

      {editing && (
        <form className={styles.form} onSubmit={save} noValidate>
          <label htmlFor="lab-value" className={styles.label}>Serum vitamin B12 (look for “B12” or “Cobalamin” on your report)</label>
          <div className={styles.inputRow}>
            <input
              id="lab-value"
              className={styles.input}
              type="number"
              inputMode="decimal"
              min="1"
              step="any"
              placeholder={unit === 'pg/mL' ? 'e.g. 350' : 'e.g. 260'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-describedby={error ? 'lab-error' : undefined}
              aria-invalid={error ? 'true' : undefined}
              autoFocus
            />
            <fieldset className={styles.units}>
              <legend className="visually-hidden">Unit</legend>
              {UNITS.map((u) => (
                <label key={u} className={`${styles.unit} ${unit === u ? styles.unitActive : ''}`}>
                  <input type="radio" name="lab-unit" value={u} checked={unit === u} onChange={() => setUnit(u)} />
                  {u}
                </label>
              ))}
            </fieldset>
          </div>
          {error && <p id="lab-error" className={styles.error} role="alert">{error}</p>}
          <div className={styles.actions}>
            <button type="submit" className={page.primaryBtn} disabled={saving}>{saving ? 'Saving…' : 'Save result'}</button>
            <button type="button" className={styles.linkBtn} onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
          </div>
          <p className={styles.note}>Your result is private and stored with this assessment. You can remove it any time.</p>
        </form>
      )}
    </section>
  );
}
