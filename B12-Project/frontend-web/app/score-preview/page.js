'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { RiskGauge } from '@/components/UI';
import { CountUp, EASE } from '@/components/motion';
import styles from './page.module.css';

// Same reveal timeline as the full results page, trimmed to what guests see
const T = { score: 0.15, count: 0.8, level: 0.75, next: 1.0 };

const DEFAULT_SUGGESTIONS = [
  'Include B12 sources such as eggs, dairy, or fortified foods daily.',
  'Repeat this assessment every few weeks to monitor changes.',
  'Consult a doctor if fatigue or tingling sensations persist.',
];

export default function ScorePreviewPage() {
  const { state } = useApp();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { riskResult } = state;
  const reduce = useReducedMotionConfig();

  // Signed-in users get the full report
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/results');
  }, [isLoading, isAuthenticated, router]);

  if (!state.hydrated) return null;

  const hasAssessment = !!riskResult;
  const percentage = riskResult?.percentage ?? 0;
  const level = riskResult?.level
    ? (riskResult.level.toLowerCase() === 'low' ? 'Low risk' : riskResult.level.toLowerCase() === 'medium' ? 'Moderate risk' : 'High risk')
    : 'Not assessed';

  const ease = (delay, duration = 0.34) => (reduce ? { duration: 0 } : { duration, delay, ease: EASE });
  const enter = (delay, y = 12) => ({
    initial: reduce ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: ease(delay),
  });

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
              <motion.div className={styles.riskCard} {...enter(0)}>
                <p className={styles.cardKicker}>Your estimated B12 risk</p>
                <h2 className={styles.scoreValue}>
                  <CountUp value={percentage} suffix="%" duration={T.count} delay={T.score} srOnlyClassName={styles.srOnly} />
                </h2>
                {/* Plain fade for every level — calm and serious, never celebratory */}
                <motion.p
                  className={styles.riskLevel}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={ease(T.level, 0.4)}
                >
                  {level}
                </motion.p>
                <RiskGauge percentage={percentage} animateIn="mount" delay={T.score - 0.15} duration={T.count} />
                <p className={styles.riskDesc}>
                  Based on your responses regarding diet, fatigue, neurological signals, and lifestyle.
                </p>
              </motion.div>

              {/* Top Suggestions Card */}
              <motion.div className={styles.suggestionsCard} {...enter(T.next)}>
                <h3 className={styles.suggestionsHeading}>Top suggestions</h3>
                <div className={styles.suggestionsList}>
                  {suggestions.map((item, idx) => (
                    <motion.div
                      key={idx}
                      className={styles.suggestionRow}
                      initial={reduce ? false : { opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={ease(T.next + 0.1 + idx * 0.07)}
                    >
                      <span className={styles.suggNumBadge}>{idx + 1}</span>
                      <p className={styles.suggText}>{item}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className={styles.rightCol}>
              {/* Dark Green CTA Card */}
              <motion.div className={styles.ctaDarkCard} {...enter(T.next + 0.15)}>
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
                  <span className={styles.featurePill}>🔒 Doctor-ready summary</span>
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
              </motion.div>

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
              onClick={() => router.push('/onboarding')}
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
