'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || '';
const contactLine = CONTACT
  ? `Questions or requests: email ${CONTACT}. We aim to respond within 30 days.`
  : 'Questions or requests: contact us using the support details on our website. We aim to respond within 30 days.';

const SECTIONS = [
  {
    id: 'data-privacy',
    num: 1,
    title: 'Our promise',
    paragraphs: [
      'Your health information is yours. We use it only to give you your risk score, symptom tracking and food suggestions.',
      'We do not sell your data, show you third-party ads, or share your answers with employers or insurers.',
    ],
  },
  {
    id: 'what-we-collect',
    num: 2,
    title: 'What we collect',
    paragraphs: [
      'Account: your email address and a securely hashed password.',
      'Profile: name (optional), age, gender and diet type.',
      'Health inputs: assessment answers, daily check-ins (and any notes you add) and BMI measurements.',
      'Security logs: sign-in attempts, IP address and device type, kept to protect your account from misuse.',
    ],
  },
  {
    id: 'guest-mode',
    num: 3,
    title: 'Using it without an account',
    paragraphs: [
      'If you take the assessment without signing up, your answers and score are stored only in your browser on this device. They are sent to our servers only if you create an account or log in.',
    ],
  },
  {
    id: 'security',
    num: 4,
    title: 'How we protect it',
    paragraphs: [
      'Data travels over encrypted (HTTPS) connections. Passwords are hashed with bcrypt and never stored in plain text. Sessions can be revoked when you log out, and repeated failed sign-ins are temporarily blocked.',
      'Data is stored with our hosting and database providers, who process it only on our behalf.',
    ],
  },
  {
    id: 'your-rights',
    num: 5,
    title: 'Your choices & rights',
    paragraphs: [
      'You can view and update your profile at any time.',
      'You can permanently delete your account and all associated health data from Profile → Your data & privacy. Deletion is immediate and cannot be undone.',
      contactLine,
    ],
  },
  {
    id: 'educational-purpose',
    num: 6,
    title: 'Educational purpose',
    paragraphs: [
      'Results are for awareness and wellness tracking. They are not a diagnosis or medical record and are not shared with healthcare providers unless you choose to print or share your report.',
      'The service is intended for people aged 18 and over. Younger users should use it with a parent or guardian.',
    ],
  },
];

export default function PrivacyPage() {
  const [activeTab, setActiveTab] = useState(SECTIONS[0].id);

  const scrollToSection = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className={styles.legalPage}>
      {/* ── Top Header ── */}
      <header className={styles.header}>
        <Link href="/" className={styles.brandTitle}>B12 Health Tracker</Link>
        <Link href="/" className={styles.backBtn}>Back to home</Link>
      </header>

      {/* ── Main Content ── */}
      <main className={styles.container}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.subtitle}>
          Last updated: November 2026. Plain-language summary of how your data is handled.
        </p>

        <div className={styles.layoutGrid}>
          {/* Left Table of Contents */}
          <aside className={styles.tocNav}>
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className={`${styles.tocItem} ${activeTab === sec.id ? styles.tocActive : ''}`}
                onClick={() => scrollToSection(sec.id)}
              >
                {sec.title}
              </button>
            ))}
          </aside>

          {/* Right Section Cards */}
          <div className={styles.sectionsList}>
            {SECTIONS.map((sec) => (
              <section key={sec.id} id={sec.id} className={styles.sectionCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.numBadge}>{sec.num}</span>
                  <h2 className={styles.sectionTitle}>{sec.title}</h2>
                </div>
                <div className={styles.cardBody}>
                  {sec.paragraphs.map((p, idx) => (
                    <p key={idx} className={styles.paragraph}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
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
