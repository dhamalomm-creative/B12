'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getRecommendedFoods, calculateBMI, getBMICategory, BMI_INFO } from '@/data/b12Foods';
import { usersAPI } from '@/services/api';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

const TIER_COLORS = {
  high:     { bg:'rgba(251,191,36,0.12)',  border:'rgba(251,191,36,0.30)',  text:'#FBBF24' },
  moderate: { bg:'rgba(129,140,248,0.10)', border:'rgba(129,140,248,0.28)', text:'#818CF8' },
  low:      { bg:'rgba(0,201,167,0.10)',   border:'rgba(0,201,167,0.28)',   text:'#00C9A7' },
};
const TIER_LABELS = { high:'🔥 High Cal', moderate:'⚡ Moderate', low:'🌿 Light' };
const DIET_LABELS = { vegan:'🌿 Vegan', vegetarian:'🥗 Vegetarian', pescatarian:'🐟 Pescatarian', omnivore:'🍽️ Omnivore' };

export default function FoodsPage() {
  const { state, dispatch } = useApp();
  const { isAuthenticated }  = useAuth();

  const dietType = state.user?.dietType || 'omnivore';
  const bmiData  = state.bmiData;

  const [showModal,  setShowModal]  = useState(false);
  const [height,     setHeight]     = useState('');
  const [weight,     setWeight]     = useState('');
  const [saving,     setSaving]     = useState(false);
  const [previewBmi, setPreviewBmi] = useState(null);

  useEffect(() => {
    const h = parseFloat(height), w = parseFloat(weight);
    if (h > 50 && h < 300 && w > 10 && w < 500) setPreviewBmi(calculateBMI(h, w));
    else setPreviewBmi(null);
  }, [height, weight]);

  const handleSave = async () => {
    const h = parseFloat(height), w = parseFloat(weight);
    if (!h || !w || h < 50 || h > 300 || w < 10 || w > 500) { alert('Please enter valid height (50–300 cm) and weight (10–500 kg).'); return; }
    setSaving(true);
    const bmi = calculateBMI(h, w), cat = getBMICategory(bmi);
    try { await usersAPI.saveBMI({ heightCm: h, weightKg: w }); } catch {}
    dispatch({ type: 'SET_BMI_DATA', payload: { bmi, bmiCategory: cat, heightCm: h, weightKg: w, measuredAt: new Date().toISOString().split('T')[0] } });
    setSaving(false);
    setShowModal(false);
  };

  const foods   = getRecommendedFoods(dietType, bmiData?.bmiCategory);
  const bmiInfo = bmiData ? BMI_INFO[bmiData.bmiCategory] : null;

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.topLabel}>NUTRIENT OPTIMIZATION LIBRARY</p>
            <h1 className={styles.title}>B12 Rich Foods</h1>
          </div>
          {isAuthenticated && <button className={styles.updateBtn} onClick={() => setShowModal(true)}>📏 Update BMI</button>}
        </div>

        <div className={styles.scroll}>
          {bmiData && bmiInfo ? (
            <div className={styles.bmiBanner} style={{ borderColor: bmiInfo.color+'55', background: bmiInfo.color+'12' }}>
              <div className={styles.bmiRow}>
                <span className={styles.bmiIcon}>{bmiInfo.icon}</span>
                <div>
                  <p className={styles.bmiTitle} style={{ color: bmiInfo.color }}>BMI {bmiData.bmi} · {bmiInfo.label}</p>
                  <p className={styles.bmiTip}>{bmiInfo.tip}</p>
                </div>
              </div>
              <div className={styles.tagRow}>
                <span className={styles.dietTag}>{DIET_LABELS[dietType]||dietType}</span>
                <span className={styles.preferTag}>⭐ {bmiInfo.preferLabel}</span>
              </div>
            </div>
          ) : (
            <div className={styles.noBmi}>
              <span>📏</span>
              <div>
                <p className={styles.noBmiTitle}>{isAuthenticated ? 'Add your measurements' : 'Log in for personalised suggestions'}</p>
                <p className={styles.noBmiSub}>{isAuthenticated ? "We'll recommend foods based on your BMI and diet." : 'Showing general B12 foods.'}</p>
              </div>
              {isAuthenticated && <button className={styles.addBtn} onClick={() => setShowModal(true)}>Add</button>}
            </div>
          )}

          <p className={styles.sectionLabel}>{foods.length} foods · filtered for {DIET_LABELS[dietType]||dietType}</p>

          <div className={styles.foodGrid}>
          {foods.map((food, i) => {
            const tc = TIER_COLORS[food.calorieTier]||TIER_COLORS.moderate;
            return (
              <div key={i} className={styles.card}>
                <div className={styles.emojiWrap}><span className={styles.emoji}>{food.emoji}</span></div>
                <div className={styles.cardContent}>
                  <div className={styles.cardHead}>
                    <span className={styles.foodName}>{food.name}</span>
                    <span className={styles.foodB12}>{food.b12mcg} mcg</span>
                  </div>
                  <div className={styles.tagLine}>
                    <span className={styles.foodType}>{food.type}</span>
                    <span className={styles.tier} style={{ background: tc.bg, border:`1px solid ${tc.border}`, color: tc.text }}>{TIER_LABELS[food.calorieTier]}</span>
                    <span className={styles.cal}>{food.calories} kcal</span>
                  </div>
                  <p className={styles.foodDesc}>{food.desc}</p>
                </div>
              </div>
            );
          })}
          </div>
          <p className={styles.disclaimer}>⚕️ B12 values are per 100g (raw). Consult a dietitian for personal advice.</p>
        </div>

        {/* BMI Modal */}
        {showModal && (
          <div className={styles.overlay} onClick={() => setShowModal(false)}>
            <div className={styles.sheet} onClick={e => e.stopPropagation()}>
              <div className={styles.handle} />
              <h2 className={styles.modalTitle}>Your Measurements</h2>
              <p className={styles.modalSub}>{bmiData ? "It's been a while — update measurements to keep recommendations accurate." : "Enter your details so we can suggest the best B12 foods for your goals."}</p>
              <label className="input-label">Height (cm)</label>
              <input className="input" type="number" placeholder="e.g. 170" value={height} onChange={e => setHeight(e.target.value)} />
              <label className="input-label">Weight (kg)</label>
              <input className="input" type="number" placeholder="e.g. 65" value={weight} onChange={e => setWeight(e.target.value)} />
              {previewBmi && (() => { const cat=getBMICategory(previewBmi); const info=BMI_INFO[cat]; return (
                <div className={styles.bmiPreview} style={{ background: info.color+'15', border:`1px solid ${info.color}40` }}>
                  <span style={{ fontSize:'var(--fs-lg)', fontWeight:800, color:info.color }}>{info.icon} BMI {previewBmi}</span>
                  <span style={{ fontSize:'var(--fs-sm)', fontWeight:600, color:info.color }}>{info.label}</span>
                </div>
              ); })()}
              <button className="btn-primary" style={{ marginTop:20 }} onClick={handleSave} disabled={saving}>{saving ? '…' : 'Save & Get Recommendations →'}</button>
              {bmiData && <button className={styles.skip} onClick={() => setShowModal(false)}>Skip for now</button>}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
