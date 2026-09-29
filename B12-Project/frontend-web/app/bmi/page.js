'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usersAPI } from '@/services/api';
import { calculateBMI, getBMICategory, BMI_INFO } from '@/data/b12Foods';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

export default function BMIPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [height,  setHeight]  = useState('');
  const [weight,  setWeight]  = useState('');
  const [bmi,     setBmi]     = useState(null);
  const [category,setCategory]= useState(null);
  const [history, setHistory] = useState([]);
  const [saving,  setSaving]  = useState(false);

  // Live BMI preview
  useEffect(() => {
    const h = parseFloat(height), w = parseFloat(weight);
    if (h > 50 && h < 300 && w > 10 && w < 500) { setBmi(calculateBMI(h,w)); setCategory(getBMICategory(calculateBMI(h,w))); }
    else { setBmi(null); setCategory(null); }
  }, [height, weight]);

  useEffect(() => {
    if (!isAuthenticated) return;
    usersAPI.getBMIHistory(8).then(d => { if (d?.history) setHistory(d.history.slice(-8)); }).catch(() => {});
  }, [isAuthenticated]);

  const handleSave = async () => {
    if (!bmi) return;
    setSaving(true);
    try { await usersAPI.saveBMI({ heightCm: parseFloat(height), weightKg: parseFloat(weight) }); const d = await usersAPI.getBMIHistory(8); if (d?.history) setHistory(d.history.slice(-8)); }
    catch {}
    setSaving(false);
  };

  const info = category ? BMI_INFO[category] : null;

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.back} onClick={() => router.push('/dashboard')}>←</button>
          <h1 className={styles.title}>BMI Calculator</h1>
          <div style={{ width: 32 }} />
        </div>

        <div className={styles.body}>
          {/* Inputs */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Your Measurements</h2>
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className="input-label">Height (cm)</label>
                <input className="input" type="number" placeholder="170" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <label className="input-label">Weight (kg)</label>
                <input className="input" type="number" placeholder="65" value={weight} onChange={e => setWeight(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Result */}
          {bmi && info && (
            <div className={styles.resultCard} style={{ borderColor: info.color+'60', background: info.color+'10' }}>
              <div className={styles.resultRing} style={{ borderColor: info.color, boxShadow: `0 0 30px ${info.color}30` }}>
                <span className={styles.resultEmoji}>{info.icon}</span>
                <span className={styles.resultBmi} style={{ color: info.color }}>{bmi}</span>
                <span className={styles.resultLabel}>BMI</span>
              </div>
              <div className={styles.resultInfo}>
                <p className={styles.resultCat} style={{ color: info.color }}>{info.label}</p>
                <p className={styles.resultTip}>{info.tip}</p>
                <p className={styles.resultPrefer}>✨ Best foods: {info.preferLabel}</p>
              </div>
            </div>
          )}

          {bmi && isAuthenticated && (
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save to Profile'}</button>
          )}

          {/* Scale reference */}
          <div className={styles.card} style={{ marginTop: 16 }}>
            <p className={styles.scaleTitle}>BMI Scale</p>
            {[
              { range:'< 18.5',     label:'Underweight', color:'var(--cyan)' },
              { range:'18.5 – 24.9',label:'Normal',      color:'var(--risk-low)' },
              { range:'25 – 29.9',  label:'Overweight',  color:'var(--amber)' },
              { range:'≥ 30',       label:'Obese',       color:'var(--risk-high)' },
            ].map(r => (
              <div key={r.label} className={styles.scaleRow}>
                <div className={styles.scaleDot} style={{ background: r.color }} />
                <span className={styles.scaleRange}>{r.range}</span>
                <span className={styles.scaleLbl} style={{ color: r.color }}>{r.label}</span>
              </div>
            ))}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className={styles.card} style={{ marginTop: 16 }}>
              <p className={styles.scaleTitle}>History</p>
              {history.map((h, i) => {
                const cat = getBMICategory(h.bmi_value||h.bmi||0);
                const hi  = BMI_INFO[cat] || {};
                return (
                  <div key={i} className={styles.histRow}>
                    <span className={styles.histDate}>{(h.measured_at||h.date||'').slice(0,10)}</span>
                    <span className={styles.histBmi} style={{ color: hi.color||'var(--primary)' }}>{h.bmi_value||h.bmi}</span>
                    <span className={styles.histCat} style={{ color: hi.color }}>{hi.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <p className={styles.disclaimer}>⚕️ BMI is a general indicator only. Consult a healthcare professional for personalised advice.</p>
        </div>
      </div>
    </AppShell>
  );
}
