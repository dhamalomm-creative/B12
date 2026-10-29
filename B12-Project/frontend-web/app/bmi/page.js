'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { usersAPI } from '@/services/api';
import { calculateBMI, getBMICategory } from '@/data/b12Foods';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

const DEFAULT_HISTORY = [
  { date: '12 Oct', bmi: '22.4', category: 'Normal' },
  { date: '14 Sep', bmi: '22.9', category: 'Normal' },
  { date: '10 Aug', bmi: '23.1', category: 'Normal' },
];

export default function BMIPage() {
  const { state, dispatch } = useApp();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('65');
  const [bmi, setBmi] = useState(22.4);
  const [category, setCategory] = useState('Normal');
  const [history, setHistory] = useState(DEFAULT_HISTORY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (h > 50 && h < 300 && w > 10 && w < 500) {
      const calculated = calculateBMI(h, w);
      setBmi(calculated);
      setCategory(getBMICategory(calculated));
    }
  }, [height, weight]);

  useEffect(() => {
    if (!isAuthenticated) return;
    usersAPI.getBMIHistory(5)
      .then(d => {
        if (d?.history && d.history.length > 0) {
          const list = d.history.map(item => ({
            date: new Date(item.measured_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
            bmi: String(item.bmi),
            category: item.bmi_category || 'Normal',
          }));
          setHistory(list);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleSave = async () => {
    setSaving(true);
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const calculated = calculateBMI(h, w);
    const cat = getBMICategory(calculated);

    dispatch({
      type: 'SET_BMI_DATA',
      payload: {
        bmi: calculated,
        bmiCategory: cat,
        heightCm: h,
        weightKg: w,
        measuredAt: new Date().toISOString().split('T')[0],
      },
    });

    if (isAuthenticated) {
      try {
        await usersAPI.saveBMI({ heightCm: h, weightKg: w });
      } catch {}
    }

    setHistory(prev => [
      {
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        bmi: String(calculated),
        category: cat.charAt(0).toUpperCase() + cat.slice(1),
      },
      ...prev.slice(0, 2),
    ]);

    setSaving(false);
  };

  const catLower = (category || 'Normal').toLowerCase();

  return (
    <AppShell>
      <div className={styles.bmiPage}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>BMI calculator</h1>
          <p className={styles.subtitle}>Used to tailor your food suggestions.</p>
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
                  className={styles.numInput}
                  placeholder="65"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>

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
              <p className={styles.resultCategory}>Normal</p>

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
                A healthy range. Keep a balanced diet with regular B12 sources.
              </p>
            </div>

            {/* Bottom History Card */}
            <div className={styles.historyCard}>
              <h3 className={styles.historyTitle}>History</h3>
              <div className={styles.historyList}>
                {history.map((item, idx) => (
                  <div key={idx} className={styles.historyRow}>
                    <span className={styles.historyDate}>{item.date}</span>
                    <span className={styles.historyVal}>{item.bmi} {item.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
