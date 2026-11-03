'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { LoadingScreen, RiskGauge } from '@/components/UI';
import { EASE, Reveal, fadeUp } from '@/components/motion';
import AmbientBackground from '@/components/AmbientBackground';
import CursorGlow from '@/components/CursorGlow';
import styles from './page.module.css';

const heroStagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const STEP_CARDS = [
  { className: 'stepCardGreen', title: 'Answer a few questions', desc: 'About 20 questions picked for your age, gender and diet — each one explains why it matters. No account needed to see your score.' },
  { className: 'stepCardYellow', title: 'Check in daily', desc: 'Rate energy, mood, sleep and more in 30 seconds. Build a streak and watch your trend.' },
  { className: 'stepCardBlue', title: 'Eat and act on it', desc: 'Get B12 food ideas that fit your diet and body, and know when to talk to a doctor.' },
];

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [deleted, setDeleted] = useState(false);
  const reduce = useReducedMotionConfig();
  const item = { variants: fadeUp(16), transition: reduce ? { duration: 0 } : { duration: 0.4, ease: EASE } };

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
      <AmbientBackground fixed />
      {/* ── Top Navigation ── */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>B12 Health Tracker</Link>
        </div>
        <nav className={styles.navLinks}>
          <a href="#how-it-works" className={`${styles.navLink} ${styles.navLinkWide}`}>How it works</a>
          <Link href="/foods" className={styles.navLink}>Foods</Link>
          <Link href="/privacy" className={`${styles.navLink} ${styles.navLinkWide}`}>Privacy</Link>
          <Link href="/auth" className={styles.navLink}>Log in</Link>
          <Link href="/auth?mode=register" className={styles.startBtn}>
            Start free
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
      {deleted && (
        <div className={styles.deletedBanner} role="status">
          Your account and health data have been permanently deleted.
        </div>
      )}

      {/* ── Hero Section ── */}
      <section className={styles.heroSection}>
        <CursorGlow />
        <motion.div
          className={styles.heroLeft}
          variants={heroStagger}
          initial={reduce ? false : 'hidden'}
          animate="show"
        >
          <motion.div className={styles.kickerBadge} {...item}>
            Free · Private · About 4 minutes
          </motion.div>
          <motion.h1 className={styles.heroHeading} {...item}>
            Tired lately?<br />
            Check your B12<br />
            before it slows<br />
            you down.
          </motion.h1>
          <motion.p className={styles.heroSubtext} {...item}>
            Answer a few questions to see your risk of low vitamin B12, then track how you feel each day and learn which foods help.
          </motion.p>
          <motion.div className={styles.ctaRow} {...item}>
            <Link href="/onboarding" className={styles.primaryCta}>
              Take the assessment
            </Link>
            <a href="#how-it-works" className={styles.secondaryCta}>
              See how it works
            </a>
          </motion.div>
        </motion.div>

        <Reveal on="mount" delay={reduce ? 0 : 0.25} y={20} className={styles.heroRight}>
          <div className={styles.heroCardContainer}>
            {/* Top Sample Result Card */}
            <div className={styles.sampleResultCard}>
              <p className={styles.sampleCardLabel}>Your B12 risk</p>
              <p className={styles.sampleCardValue}>Low</p>
              <RiskGauge percentage={20} animateIn="view" delay={0.45} />
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
        </Reveal>
      </section>

      {/* ── 3 Steps Section ── */}
      <section id="how-it-works" className={styles.stepsSection} aria-labelledby="how-heading">
        <h2 id="how-heading" className="visually-hidden">How it works</h2>
        {/* Cards rise in order and each step label lights up as it lands: 1 → 2 → 3 */}
        {STEP_CARDS.map((step, i) => (
          <Reveal key={step.title} className={styles[step.className]} delay={reduce ? 0 : i * 0.14}>
            <motion.p
              className={styles.stepNumber}
              variants={{ hidden: { opacity: 0.5, scale: 0.92 }, show: { opacity: 1, scale: 1 } }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, delay: i * 0.14 + 0.12, ease: EASE }}
            >
              Step {i + 1}
            </motion.p>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDesc}>{step.desc}</p>
          </Reveal>
        ))}
      </section>

      {/* ── Built for People Callout Card ── */}
      <section className={styles.calloutSection}>
        <Reveal className={styles.calloutCard}>
          <h2 className={styles.calloutTitle}>
            Built for people who are more likely to run low on B12.
          </h2>
          <p className={styles.calloutDesc}>
            Vegans and vegetarians, adults over 60, and people taking metformin or acid reducers. This is an educational tool, not a medical diagnosis.
          </p>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faqSection} aria-labelledby="faq-heading">
        <Reveal as="h2" id="faq-heading" className={styles.faqTitle}>Common questions</Reveal>
        <Reveal className={styles.faqList} delay={reduce ? 0 : 0.08}>
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
        </Reveal>
      </section>
      </main>

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
