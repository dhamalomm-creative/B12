'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { RiskGauge } from '@/components/UI';
import styles from './page.module.css';

const DEFAULT_SUGGESTIONS = [
  'Include B12 sources such as eggs, dairy, or fortified foods daily.',
  'Repeat this assessment every few weeks to monitor changes.',
  'Consult a doctor if fatigue or tingling sensations persist.',
];

export default function ScorePreviewPage() {
  const { state } = useApp();
  const router = useRouter();
  const { riskResult } = state;

  const hasAssessment = !!riskResult;
  const percentage = riskResult?.percentage ?? 0;
  const level = riskResult?.level
    ? (riskResult.level.toLowerCase() === 'low' ? 'Low risk' : riskResult.level.toLowerCase() === 'medium' ? 'Moderate risk' : 'High risk')
    : 'Not assessed';

  const suggestions = riskResult?.suggestions?.length
    ? riskResult.suggestions.slice(0, 3)
    : DEFAULT_SUGGESTIONS;

  return (
    <div className={styles.scorePage}>
      {/* ── Top Header ── */}
      <header className={styles.header}>
        <Link href="/" className={styles.brandTitle}>B12 Health Tracker</Link>
        <Link href="/auth?mode=login" className={styles.loginBtn}>
          Log in
        </Link>
      </header>

      {/* ── Main Content ── */}
      <main className={styles.container}>
        <h1 className={styles.title}>Here is your score preview</h1>
        <p className={styles.subtitle}>
          {hasAssessment
            ? 'You finished the assessment. Create an account to save your score and unlock full tracking.'
            : 'No assessment answers found yet. Complete the questions to see your personalized score.'}
        </p>

        {hasAssessment ? (
          <div className={styles.grid}>
            {/* Left Column */}
            <div className={styles.leftCol}>
              {/* Risk Gauge Card */}
              <div className={styles.riskCard}>
                <p className={styles.cardKicker}>Your estimated B12 risk</p>
                <h2 className={styles.scoreValue}>{percentage}%</h2>
                <p className={styles.riskLevel}>{level}</p>
                <RiskGauge percentage={percentage} />
                <p className={styles.riskDesc}>
                  Based on your responses regarding diet, fatigue, neurological signals, and lifestyle.
                </p>
              </div>

              {/* Top Suggestions Card */}
              <div className={styles.suggestionsCard}>
                <h3 className={styles.suggestionsHeading}>Top suggestions</h3>
                <div className={styles.suggestionsList}>
                  {suggestions.map((item, idx) => (
                    <div key={idx} className={styles.suggestionRow}>
                      <span className={styles.suggNumBadge}>{idx + 1}</span>
                      <p className={styles.suggText}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className={styles.rightCol}>
              {/* Dark Green CTA Card */}
              <div className={styles.ctaDarkCard}>
                <h2 className={styles.ctaTitle}>
                  Save your results and<br />
                  keep tracking
                </h2>
                <p className={styles.ctaSubtitle}>
                  Create a free account to save this score permanently, access the category-level breakdown, and monitor daily progress trends.
                </p>

                <div className={styles.featurePillsWrap}>
                  <span className={styles.featurePill}>🔒 Category breakdown</span>
                  <span className={styles.featurePill}>🔒 Daily check-in tracking</span>
                  <span className={styles.featurePill}>🔒 14-day progress trends</span>
                </div>

                <button
                  type="button"
                  className={styles.createAccountBtn}
                  onClick={() => router.push('/auth?mode=register')}
                >
                  Create free account
                </button>

                <Link href="/auth?mode=login" className={styles.alreadyLink}>
                  I already have an account
                </Link>
              </div>

              {/* Bottom Disclaimer */}
              <div className={styles.disclaimerBanner}>
                This tool is for education and awareness. It does not provide a diagnosis. Please see a doctor for medical blood testing.
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: '22px',
            padding: '48px 24px',
            textAlign: 'center',
            maxWidth: '520px',
            margin: '40px auto',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              No assessment taken yet
            </h3>
            <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
              Answer 20–25 quick questions to calculate your personalized vitamin B12 risk score.
            </p>
            <button
              type="button"
              className={styles.createAccountBtn}
              onClick={() => router.push('/questionnaire')}
            >
              Start assessment
            </button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>
          B12 Health Tracker. Educational tool, not a medical diagnosis.
        </span>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>Privacy</Link>
          <Link href="/terms" className={styles.footerLink}>Terms</Link>
        </div>
      </footer>
    </div>
  );
}
