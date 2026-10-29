'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { RiskGauge } from '@/components/UI';
import styles from './page.module.css';

export default function ScorePreviewPage() {
  const { state } = useApp();
  const router = useRouter();
  const { riskResult } = state;

  useEffect(() => {
    if (!riskResult) {
      router.replace('/questionnaire');
    }
  }, [riskResult, router]);

  if (!riskResult) return null;

  const pct = riskResult.percentage || 24;
  const lvl = riskResult.level ? (riskResult.level.toLowerCase() === 'low' ? 'Low risk' : riskResult.level.toLowerCase() === 'medium' ? 'Moderate risk' : 'High risk') : 'Low risk';

  return (
    <div className={styles.scorePreviewPage}>
      <header className={styles.header}>
        <Link href="/" className={styles.brandTitle}>B12 Health Tracker</Link>
      </header>

      <main className={styles.container}>
        {/* Results Hero Card */}
        <div className={styles.heroCard}>
          <p className={styles.heroKicker}>Your B12 risk score</p>
          <h1 className={styles.scoreNumber}>{pct}%</h1>
          <p className={styles.riskLevel}>{lvl}</p>
          <RiskGauge percentage={pct} />
          <p className={styles.desc}>
            {pct < 35
              ? 'Your answers suggest a low chance of B12 deficiency right now.'
              : pct < 65
              ? 'Your answers suggest a moderate risk. Adding fortified foods or supplements may help.'
              : 'Your answers indicate high potential signs of B12 deficiency. Consider discussing with a doctor.'}
          </p>
        </div>

        {/* Create Account Callout Card */}
        <div className={styles.accountCard}>
          <h2 className={styles.accountTitle}>Save your results & unlock full tracking</h2>
          <p className={styles.accountSub}>
            Create a free account to save your score, track daily check-ins, view trend charts, and get personalized B12 food suggestions.
          </p>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.createAccountBtn}
              onClick={() => router.push('/auth?mode=register')}
            >
              Create free account
            </button>
            <button
              type="button"
              className={styles.loginBtn}
              onClick={() => router.push('/auth?mode=login')}
            >
              Log in to existing account
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          This tool is for education and awareness. It does not provide a diagnosis. Please see a doctor for blood tests.
        </div>
      </main>
    </div>
  );
}
