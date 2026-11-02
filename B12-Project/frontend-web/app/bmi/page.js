'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { toast } from '@/components/UI';
import { usersAPI } from '@/services/api';
import { calculateBMI, getBMICategory } from '@/data/b12Foods';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';
import styles from './page.module.css';

export default function BMIPage() {
  const { dispatch } = useApp();
  const { isAuthenticated } = useAuth();

  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('65');
  const [bmi, setBmi] = useState(22.5);
  const [category, setCategory] = useState('Normal');
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');

  const h = parseFloat(height);
  const w = parseFloat(weight);
  const inputsValid = h >= 50 && h <= 250 && w >= 10 && w <= 400;

  useEffect(() => {
    if (inputsValid) {
      const calculated = calculateBMI(h, w);
      setBmi(calculated);
      setCategory(getBMICategory(calculated));
    }
  }, [h, w, inputsValid]);

  useEffect(() => {
    if (!isAuthenticated) return;
    usersAPI.getBMIHistory(5)
      .then(d => {
        if (d?.history && d.history.length > 0) {
          const latest = d.history[0];
          if (latest?.height_cm) setHeight(String(latest.height_cm));
          if (latest?.weight_kg) setWeight(String(latest.weight_kg));
          const list = d.history.map(item => ({
            date: new Date(item.measured_at || item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            bmi: String(item.bmi),
            category: (item.bmi_category ? item.bmi_category.charAt(0).toUpperCase() + item.bmi_category.slice(1) : 'Normal'),
          }));
          setHistory(list);
        } else {
          setHistory([]);
        }
      })
      .catch(() => {
        setHistory([]);
      })
      .finally(() => {
        setLoadingHistory(false);
      });
  }, [isAuthenticated]);

  const handleSave = async () => {
    setError('');
    if (!inputsValid) {
      setError('Enter a height between 50–250 cm and a weight between 10–400 kg.');
      return;
    }
    setSaving(true);
    const calculated = calculateBMI(h, w);
    const cat = getBMICategory(calculated);

    try {
      if (isAuthenticated) await usersAPI.saveBMI({ heightCm: h, weightKg: w });
      dispatch({
        type: 'SET_BMI_DATA',
        payload: { bmi: calculated, bmiCategory: cat, heightCm: h, weightKg: w, measuredAt: new Date().toISOString().split('T')[0] },
      });
      setHistory((prev) => [
        {
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          bmi: String(calculated),
          category: cat.charAt(0).toUpperCase() + cat.slice(1),
        },
        ...prev.slice(0, 4),
      ]);
      toast('Measurement saved', 'success');
    } catch (err) {
      setError(err.message || 'Could not save your measurement.');
    } finally {
      setSaving(false);
    }
  };

  const catLower = (category || 'Normal').toLowerCase();

  return (
    <AuthGuard>
      <AppShell>
        <div className={styles.bmiPage}>
          {/* Header */}
          <header className={styles.header}>
            <h1 className={styles.title}>BMI calculator</h1>
            <p className={styles.subtitle}>Used to tailor your food suggestions and metabolic health.</p>
          </header>

          {/* 2-Column Grid */}
          <div className={styles.grid}>
            {/* Left Column — Measurement Inputs */}
            <div className={styles.leftCol}>
              <div className={styles.inputCard}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Height (cm)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={50}
                    max={250}
                    className={styles.numInput}
                    placeholder="170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Weight (kg)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={10}
                    max={400}
                    className={styles.numInput}
                    placeholder="65"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>

                {error && <p className={styles.error} role="alert">{error}</p>}
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save measurement'}
                </button>
              </div>
            </div>

            {/* Right Column — Results & History */}
            <div className={styles.rightCol}>
              {/* Top BMI Gauge Card */}
              <div className={styles.resultCard}>
                <p className={styles.resultKicker}>Your BMI</p>
                <h2 className={styles.resultValue}>{bmi}</h2>
                <p className={styles.resultCategory}>{category.charAt(0).toUpperCase() + category.slice(1)}</p>

                {/* Segmented scale bar */}
                <div className={styles.scaleBar}>
                  <div className={`${styles.scaleSegment} ${catLower.includes('under') ? styles.segmentHighlight : ''}`}>
                    Under
                  </div>
                  <div className={`${styles.scaleSegment} ${catLower.includes('normal') ? styles.segmentHighlight : ''}`}>
                    Normal
                  </div>
                  <div className={`${styles.scaleSegment} ${catLower.includes('over') ? styles.segmentHighlight : ''}`}>
                    Over
                  </div>
                  <div className={`${styles.scaleSegment} ${catLower.includes('obese') ? styles.segmentHighlight : ''}`}>
                    Obese
                  </div>
                </div>

                <p className={styles.resultTip}>
                  {catLower.includes('normal')
                    ? 'A healthy range. Keep a balanced diet with regular B12 sources.'
                    : catLower.includes('under')
                      ? 'Below the healthy range. Energy-dense B12 foods like dairy, eggs and fish can help — and consider speaking to a doctor.'
                      : 'Above the healthy range. Lean, low-calorie B12 sources such as fish, yogurt and fortified cereals fit well.'}{' '}
                  <Link href="/foods">See foods for you →</Link>
                </p>
                <p className={styles.bmiNote}>
                  BMI is a rough screening measure — it doesn&apos;t account for muscle, age or ethnicity. Some Asian health
                  bodies use a lower healthy cut-off (23).
                </p>
              </div>

              {/* Bottom History Card */}
              <div className={styles.historyCard}>
                <h3 className={styles.historyTitle}>History</h3>
                <div className={styles.historyList}>
                  {history.length > 0 ? (
                    history.map((item, idx) => (
                      <div key={idx} className={styles.historyRow}>
                        <span className={styles.historyDate}>{item.date}</span>
                        <span className={styles.historyVal}>{item.bmi} ({item.category})</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '12px 0' }}>
                      {loadingHistory ? 'Loading history…' : 'No measurements recorded yet.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
