'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { RiskBadge, DisclaimerStrip } from '@/components/UI';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

export default function ResultsPage() {
  const { state } = useApp();
  const router    = useRouter();
  const { riskResult } = state;

  useEffect(() => {
    if (!riskResult) {
      router.replace('/dashboard');
    }
  }, [riskResult, router]);

  if (!riskResult) return null;

  const { level, percentage, breakdown = {}, suggestions = [] } = riskResult;
  const color = level === 'HIGH' ? 'var(--risk-high)' : level === 'MEDIUM' ? 'var(--risk-medium)' : 'var(--risk-low)';

  return (
    <AppShell>
      <div className={styles.page}>

        {/* Header */}
        <header className={styles.header}>
          <div>
            <p className={styles.topLabel}>CLINICAL RESULTS PROFILE</p>
            <h1 className={styles.title}>B12 Assessment Report</h1>
          </div>
          <button className={styles.backBtn} onClick={() => router.push('/dashboard')}>← Dashboard</button>
        </header>

        {/* Main Grid */}
        <div className={styles.mainGrid}>

          {/* Left — Score Hero */}
          <div className={styles.scoreCol}>
            {/* Big Ring */}
            <div className={styles.scoreHero}>
              <p className={styles.heroLabel}>RISK ASSESSMENT SCORE</p>
              <div className={styles.ringWrap} style={{ borderColor: color, boxShadow: `0 0 60px ${color}25` }}>
                <span className={styles.ringPct} style={{ color }}>{percentage}%</span>
                <span className={styles.ringUnit}>SCORE</span>
              </div>
              <RiskBadge level={level} />
              <p className={styles.scoreDesc}>
                {level === 'LOW'
                  ? 'Your responses suggest a lower likelihood of B12 concerns at this time.'
                  : level === 'MEDIUM'
                  ? 'Some factors suggest moderate attention to B12 may be beneficial.'
                  : 'Several factors suggest discussing B12 with a healthcare professional is advisable.'}
              </p>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className={styles.suggestBlock}>
                <p className={styles.blockLabel}>CLINICAL RECOMMENDATIONS</p>
                {suggestions.map((s, i) => (
                  <div key={i} className={styles.suggRow}>
                    <div className={styles.suggNum}>{i + 1}</div>
                    <p className={styles.suggText}>{s}</p>
                  </div>
                ))}
              </div>
            )}

            <DisclaimerStrip />

            <button className={styles.retakeBtn} onClick={() => router.push('/questionnaire')}>
              RETAKE ASSESSMENT →
            </button>
          </div>

          {/* Right — Breakdown */}
          <div className={styles.breakCol}>
            <p className={styles.blockLabel}>SCORE BREAKDOWN · BY CATEGORY</p>
            {Object.keys(breakdown).length > 0 ? (
              Object.entries(breakdown).map(([cat, val]) => {
                const pctVal = typeof val === 'number' ? Math.round(val) : 0;
                return (
                  <div key={cat} className={styles.breakItem}>
                    <div className={styles.breakTop}>
                      <span className={styles.breakCat}>{cat.replace(/_/g, ' ')}</span>
                      <span className={styles.breakPct} style={{ color }}>{pctVal}%</span>
                    </div>
                    <div className={styles.breakTrack}>
                      <div className={styles.breakFill}
                        style={{ width: `${pctVal}%`, background: color, boxShadow: `0 0 8px ${color}50` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>No breakdown available.</p>
            )}

            {/* Level Signal */}
            <div className={styles.levelCard} style={{ borderColor: color + '40', background: color + '08' }}>
              <p className={styles.levelCardLabel}>ASSESSMENT SIGNAL</p>
              <p className={styles.levelCardLevel} style={{ color }}>{level} RISK</p>
              <p className={styles.levelCardDesc}>
                {level === 'LOW'
                  ? 'Minimal clinical flags detected in your symptom profile.'
                  : level === 'MEDIUM'
                  ? 'Moderate biological markers detected. Consider dietary adjustments.'
                  : 'Multiple high-priority signals. Consult a clinician.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
