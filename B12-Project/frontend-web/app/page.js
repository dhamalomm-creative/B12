'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/LanguageProvider';
import { LoadingScreen, RiskGauge } from '@/components/UI';
import { EASE, Reveal, fadeUp } from '@/components/motion';
import AmbientBackground from '@/components/AmbientBackground';
import CursorGlow from '@/components/CursorGlow';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ProductPreview from '@/components/landing/ProductPreview';
import styles from './page.module.css';

const NIH_SOURCE = 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/';

const heroStagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };
const STEP_CARDS = [
  { className: 'stepCardGreen', title: 'Answer a few questions', desc: 'About 20 questions picked for your age, gender and diet — each one explains why it matters. No account needed to see your score.' },
  { className: 'stepCardYellow', title: 'Check in daily', desc: 'Rate energy, mood, sleep and more in 30 seconds. Build a streak and watch your trend.' },
  { className: 'stepCardBlue', title: 'Eat and act on it', desc: 'Get B12 food ideas that fit your diet and body, and know when to talk to a doctor.' },
];

// Each promise here is true of the product today; none of these are marketing numbers.
const TRUST_POINTS = [
  'Sources: NIH and USDA',
  'You can delete your data anytime',
  'We never sell your data',
  'No account needed to see your score',
];

// Every figure below comes from the NIH Office of Dietary Supplements B12 fact sheet.
const B12_FACTS = [
  { value: '2.4 mcg', label: 'of vitamin B12 is what most adults need each day.' },
  { value: 'Animal foods', label: 'are the natural source of B12. It is generally not present in plant foods unless fortified.' },
  { value: 'Over 50', label: 'adults are advised to get most of their B12 from fortified foods or supplements.' },
  { value: 'Medicines', label: 'such as metformin and acid reducers can lower how much B12 you absorb.' },
];

const FAQS = [
  { q: 'Is this a medical test?', a: "No. It's an educational screening based on well-known B12 risk factors and symptoms. It can tell you whether it's worth asking your doctor for a blood test — only a blood test can confirm a deficiency." },
  { q: 'Who is most at risk of low B12?', a: "Vegans and many vegetarians, adults over 50, people taking metformin or acid-reducing medicines for a long time, and people with pernicious anaemia, coeliac or Crohn's disease, or stomach / bowel surgery." },
  { q: 'What happens to my answers?', a: "If you don't create an account, your answers stay on your device. If you do, they're stored securely in your account so you can track changes — you can delete everything at any time from your profile. We never sell your data." },
  { q: 'How often should I retake it?', a: 'Every 4–8 weeks, or after changing your diet, starting a supplement or new medicine. Daily check-ins in between help you spot patterns.' },
];

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();
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
          <a href="#how-it-works" className={`${styles.navLink} ${styles.navLinkWide}`}>{t('How it works')}</a>
          <Link href="/foods" className={`${styles.navLink} ${styles.navLinkWide}`}>{t('Foods')}</Link>
          <Link href="/privacy" className={`${styles.navLink} ${styles.navLinkWide}`}>{t('Privacy')}</Link>
          <LanguageSwitcher />
          <Link href="/auth" className={styles.navLink}>{t('Log in')}</Link>
          <Link href="/auth?mode=register" className={styles.startBtn}>
            {t('Start free')}
          </Link>
        </nav>
      </header>

      <main className={styles.main}>
      {deleted && (
        <div className={styles.deletedBanner} role="status">
          {t('Your account and health data have been permanently deleted.')}
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
            {t('Free · Private · About 4 minutes')}
          </motion.div>
          <motion.h1 className={styles.heroHeading} {...item}>
            {t('Tired lately?\nCheck your B12\nbefore it slows\nyou down.')}
          </motion.h1>
          <motion.p className={styles.heroSubtext} {...item}>
            {t('Answer a few questions to see your risk of low vitamin B12, then track how you feel each day and learn which foods help.')}
          </motion.p>
          <motion.div className={styles.ctaRow} {...item}>
            <Link href="/onboarding" className={styles.primaryCta}>
              {t('Take the assessment')}
            </Link>
            <a href="#how-it-works" className={styles.secondaryCta}>
              {t('See how it works')}
            </a>
          </motion.div>
        </motion.div>

        <Reveal on="mount" delay={reduce ? 0 : 0.25} y={20} className={styles.heroRight}>
          <div className={styles.heroCardContainer}>
            {/* Top Sample Result Card */}
            <div className={styles.sampleResultCard}>
              <p className={styles.sampleCardLabel}>{t('Your B12 risk')}</p>
              <p className={styles.sampleCardValue}>{t('Low')}</p>
              <RiskGauge percentage={20} animateIn="view" delay={0.45} />
              <p className={styles.sampleCardFoot}>
                {t('Sample result. Yours is based on your own answers.')}
              </p>
            </div>

            {/* Bottom Dark Checkin Card */}
            <div className={styles.sampleCheckinCard}>
              <div className={styles.checkinCardLeft}>
                <p className={styles.checkinCardTitle}>{t("Today's check-in")}</p>
                <p className={styles.checkinCardSub}>{t('Five quick taps')}</p>
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

      {/* ── Trust points ── */}
      <section className={styles.trustSection} aria-label={t('Why you can trust this app')}>
        <ul className={styles.trustList}>
          {TRUST_POINTS.map((point) => (
            <li key={point} className={styles.trustItem}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t(point)}
            </li>
          ))}
        </ul>
      </section>

      {/* ── 3 Steps Section ── */}
      <section id="how-it-works" className={styles.stepsSection} aria-labelledby="how-heading">
        <h2 id="how-heading" className="visually-hidden">{t('How it works')}</h2>
        {/* Cards rise in order and each step label lights up as it lands: 1 → 2 → 3 */}
        {STEP_CARDS.map((step, i) => (
          <Reveal key={step.title} className={styles[step.className]} delay={reduce ? 0 : i * 0.14}>
            <motion.p
              className={styles.stepNumber}
              variants={{ hidden: { opacity: 0.5, scale: 0.92 }, show: { opacity: 1, scale: 1 } }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, delay: i * 0.14 + 0.12, ease: EASE }}
            >
              {t('Step {n}', { n: i + 1 })}
            </motion.p>
            <h3 className={styles.stepTitle}>{t(step.title)}</h3>
            <p className={styles.stepDesc}>{t(step.desc)}</p>
          </Reveal>
        ))}
      </section>

      {/* ── Product preview ── */}
      <ProductPreview />

      {/* ── B12 facts ── */}
      <section className={styles.factsSection} aria-labelledby="facts-heading">
        <Reveal as="h2" id="facts-heading" className={styles.sectionHeading}>{t('B12 facts worth knowing')}</Reveal>
        <div className={styles.factsGrid}>
          {B12_FACTS.map((fact, i) => (
            <Reveal key={fact.value} className={styles.factItem} delay={reduce ? 0 : i * 0.08}>
              <p className={styles.factValue}>{t(fact.value)}</p>
              <p className={styles.factLabel}>{t(fact.label)}</p>
            </Reveal>
          ))}
        </div>
        <p className={styles.factsSource}>
          {t('Source:')}{' '}
          <a href={NIH_SOURCE} target="_blank" rel="noopener noreferrer">
            {t('NIH Office of Dietary Supplements, Vitamin B12 fact sheet')}
          </a>
        </p>
      </section>

      {/* ── Built for People Callout Card ── */}
      <section className={styles.calloutSection}>
        <Reveal className={styles.calloutCard}>
          <h2 className={styles.calloutTitle}>
            {t('Built for people who are more likely to run low on B12.')}
          </h2>
          <p className={styles.calloutDesc}>
            {t('Vegans and vegetarians, adults over 50, and people taking metformin or acid reducers. This is an educational tool, not a medical diagnosis.')}
          </p>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section className={styles.faqSection} aria-labelledby="faq-heading">
        <Reveal as="h2" id="faq-heading" className={styles.faqTitle}>{t('Common questions')}</Reveal>
        <Reveal className={styles.faqList} delay={reduce ? 0 : 0.08}>
          {FAQS.map((faq) => (
            <details key={faq.q} className={styles.faqItem}>
              <summary>{t(faq.q)}</summary>
              <p>{t(faq.a)}</p>
            </details>
          ))}
        </Reveal>
      </section>
      </main>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <span className={styles.footerBrand}>© {new Date().getFullYear()} B12 Health Tracker · {t('Educational tool, not a medical diagnosis.')}</span>
        <div className={styles.footerLinks}>
          <Link href="/foods" className={styles.footerLink}>{t('Foods')}</Link>
          <Link href="/privacy" className={styles.footerLink}>{t('Privacy')}</Link>
          <Link href="/terms" className={styles.footerLink}>{t('Terms')}</Link>
        </div>
      </footer>
    </div>
  );
}
