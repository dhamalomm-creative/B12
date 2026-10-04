'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { PrimaryButton, RiskBadge, DisclaimerStrip } from '@/components/UI';
import styles from './page.module.css';

export default function ScorePreviewPage() {
  const { state } = useApp();
  const router    = useRouter();
  const { riskResult } = state;

  useEffect(() => {
    if (!riskResult) {
      router.replace('/questionnaire');
    }
  }, [riskResult, router]);

  if (!riskResult) return null;

  const pct = riskResult.percentage;
  const lvl = riskResult.level;
  const color = lvl === 'HIGH' ? 'var(--risk-high)' : lvl === 'MEDIUM' ? 'var(--risk-medium)' : 'var(--risk-low)';

  return (
    <div className={styles.page}>
      <div className={styles.previewGrid}>
        <div className={styles.hero}>
          <span className={styles.kicker}>Your B12 Assessment Result</span>
          <div className={styles.scoreRing} style={{ borderColor: color, boxShadow: `0 0 40px ${color}40` }}>
            <span className={styles.scoreNum} style={{ color }}>{pct}%</span>
            <span className={styles.scoreLabel}>Risk Score</span>
          </div>
          <RiskBadge level={lvl} />
          <p className={styles.desc}>
            {lvl === 'LOW' ? 'Your responses suggest a lower likelihood of B12 concerns at this time.' : lvl === 'MEDIUM' ? 'Some factors in your responses suggest moderate attention to B12 may be beneficial.' : 'Several factors in your responses suggest it may be worth discussing B12 with a healthcare professional.'}
          </p>
        </div>

        <div className={styles.body}>
          <div className={styles.guestCard}>
            <span className={styles.guestEmoji}>🔒</span>
            <h2 className={styles.guestTitle}>Save your results & unlock full tracking</h2>
            <p className={styles.guestSub}>Create a free account to save your B12 score, track daily check-ins, view history, and get AI-powered insights.</p>
            <PrimaryButton label="Create Free Account →" onClick={() => router.push('/auth?mode=register')} />
            <button className={styles.loginBtn} onClick={() => router.push('/auth')}>Already have an account? Log in</button>
          </div>
          {riskResult.suggestions?.length > 0 && (
            <div className={styles.tipsCard}>
              <p className={styles.tipHead}>💡 Key suggestions</p>
              {riskResult.suggestions.slice(0, 3).map((s, i) => (
                <p key={i} className={styles.tip}>• {s}</p>
              ))}
            </div>
          )}
          <DisclaimerStrip />
        </div>
      </div>
    </div>
  );
}
