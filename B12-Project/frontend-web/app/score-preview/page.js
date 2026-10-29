'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { RiskGauge } from '@/components/UI';
import styles from './page.module.css';

const DEFAULT_SUGGESTIONS = [
  'Include B12 sources such as eggs, dairy or fortified foods daily.',
  'Repeat this assessment in a few weeks.',
  'Talk to a doctor if symptoms persist.',
];

export default function ScorePreviewPage() {
  const { state } = useApp();
  const router = useRouter();
  const { riskResult } = state;

  const percentage = riskResult?.percentage ?? 24;
  const level = riskResult?.level
    ? (riskResult.level.toLowerCase() === 'low' ? 'Low risk' : riskResult.level.toLowerCase() === 'medium' ? 'Moderate risk' : 'High risk')
    : 'Low risk';

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
        <h1 className={styles.title}>Here is your score</h1>
        <p className={styles.subtitle}>
          You finished the assessment. Save it before you leave.
        </p>

        <div className={styles.grid}>
          {/* Left Column */}
          <div className={styles.leftCol}>
            {/* Risk Gauge Card */}
            <div className={styles.riskCard}>
              <p className={styles.cardKicker}>Your B12 risk</p>
              <h2 className={styles.scoreValue}>{percentage}%</h2>
              <p className={styles.riskLevel}>{level}</p>
              <RiskGauge percentage={percentage} />
              <p className={styles.riskDesc}>
                Your answers suggest a low chance of B12 deficiency right now. Sample result.
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
                Create a free account to keep this score, see the full breakdown and watch your trends over time.
              </p>

              <div className={styles.featurePillsWrap}>
                <span className={styles.featurePill}>🔒 Category breakdown</span>
                <span className={styles.featurePill}>🔒 Daily tracking</span>
                <span className={styles.featurePill}>🔒 Progress trends</span>
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

            {/* Bottom Yellow Disclaimer */}
            <div className={styles.disclaimerBanner}>
              This tool is for education and awareness. It does not provide a diagnosis. Please see a doctor for blood tests.
            </div>
          </div>
        </div>
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
