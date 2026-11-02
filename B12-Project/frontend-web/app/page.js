'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen, RiskGauge } from '@/components/UI';
import styles from './page.module.css';

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('deleted')) setDeleted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.landingPage}>
      {/* ── Top Navigation ── */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>B12 Health Tracker</Link>
        </div>
        <nav className={styles.navLinks}>
          <a href="#how-it-works" className={styles.navLink}>How it works</a>
          <Link href="/foods" className={styles.navLink}>Foods</Link>
          <Link href="/privacy" className={styles.navLink}>Privacy</Link>
          <Link href="/auth" className={styles.navLink}>Log in</Link>
          <Link href="/auth?mode=register" className={styles.startBtn}>
            Start free
          </Link>
        </nav>
      </header>

      {deleted && (
        <div className={styles.deletedBanner} role="status">
          Your account and health data have been permanently deleted.
        </div>
      )}

      {/* ── Hero Section ── */}
      <section className={styles.heroSection}>
        <div className={styles.heroLeft}>
          <div className={styles.kickerBadge}>
            Free · Private · About 4 minutes
          </div>
          <h1 className={styles.heroHeading}>
            Tired lately?<br />
            Check your B12<br />
            before it slows<br />
            you down.
          </h1>
          <p className={styles.heroSubtext}>
            Answer a few questions to see your risk of low vitamin B12, then track how you feel each day and learn which foods help.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/onboarding" className={styles.primaryCta}>
              Take the assessment
            </Link>
            <a href="#how-it-works" className={styles.secondaryCta}>
              See how it works
            </a>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.heroCardContainer}>
            {/* Top Sample Result Card */}
            <div className={styles.sampleResultCard}>
              <p className={styles.sampleCardLabel}>Your B12 risk</p>
              <h3 className={styles.sampleCardValue}>Low</h3>
              <RiskGauge percentage={20} />
              <p className={styles.sampleCardFoot}>
                Sample result. Yours is based on your own answers.
              </p>
            </div>

            {/* Bottom Dark Checkin Card */}
            <div className={styles.sampleCheckinCard}>
              <div className={styles.checkinCardLeft}>
                <p className={styles.checkinCardTitle}>Today&apos;s check-in</p>
                <p className={styles.checkinCardSub}>Five quick taps</p>
              </div>
              <div className={styles.dotRow}>
                <span className={styles.checkDot} style={{ background: '#7AD4A5' }} />
                <span className={styles.checkDot} style={{ background: '#59B687' }} />
                <span className={styles.checkDot} style={{ background: '#459E72' }} />
                <span className={styles.checkDot} style={{ background: '#357C5A' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 Steps Section ── */}
      <section id="how-it-works" className={styles.stepsSection}>
        <div className={styles.stepCardGreen}>
          <p className={styles.stepNumber}>Step 1</p>
          <h3 className={styles.stepTitle}>Answer a few questions</h3>
          <p className={styles.stepDesc}>
            About 20 questions picked for your age, gender and diet — each one explains why it matters. No account needed to see your score.
          </p>
        </div>

        <div className={styles.stepCardYellow}>
          <p className={styles.stepNumber}>Step 2</p>
          <h3 className={styles.stepTitle}>Check in daily</h3>
          <p className={styles.stepDesc}>
            Rate energy, mood, sleep and more in 30 seconds. Build a streak and watch your trend.
          </p>
        </div>

        <div className={styles.stepCardBlue}>
          <p className={styles.stepNumber}>Step 3</p>
          <h3 className={styles.stepTitle}>Eat and act on it</h3>
          <p className={styles.stepDesc}>
            Get B12 food ideas that fit your diet and body, and know when to talk to a doctor.
          </p>
        </div>
      </section>

      {/* ── Built for People Callout Card ── */}
      <section className={styles.calloutSection}>
        <div className={styles.calloutCard}>
          <h3 className={styles.calloutTitle}>
            Built for people who are more likely to run low on B12.
          </h3>
          <p className={styles.calloutDesc}>
            Vegans and vegetarians, adults over 60, and people taking metformin or acid reducers. This is an educational tool, not a medical diagnosis.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faqSection} aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={styles.faqTitle}>Common questions</h2>
        <div className={styles.faqList}>
          <details className={styles.faqItem}>
            <summary>Is this a medical test?</summary>
            <p>No. It&apos;s an educational screening based on well-known B12 risk factors and symptoms. It can tell you whether it&apos;s worth asking your doctor for a blood test — only a blood test can confirm a deficiency.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>Who is most at risk of low B12?</summary>
            <p>Vegans and many vegetarians, adults over 50, people taking metformin or acid-reducing medicines for a long time, and people with pernicious anaemia, coeliac or Crohn&apos;s disease, or stomach / bowel surgery.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>What happens to my answers?</summary>
            <p>If you don&apos;t create an account, your answers stay on your device. If you do, they&apos;re stored securely in your account so you can track changes — you can delete everything at any time from your profile. We never sell your data.</p>
          </details>
          <details className={styles.faqItem}>
            <summary>How often should I retake it?</summary>
            <p>Every 4–8 weeks, or after changing your diet, starting a supplement or new medicine. Daily check-ins in between help you spot patterns.</p>
          </details>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>© {new Date().getFullYear()} B12 Health Tracker · Educational tool, not a medical diagnosis.</span>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>Privacy</Link>
          <Link href="/terms" className={styles.footerLink}>Terms</Link>
        </div>
      </footer>
    </div>
  );
}
