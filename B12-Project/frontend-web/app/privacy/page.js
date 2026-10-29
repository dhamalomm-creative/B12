'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const SECTIONS = [
  {
    id: 'data-privacy',
    num: 1,
    title: 'Data privacy',
    paragraphs: [
      'Your health information is yours. We use it only to give you your score, tracking and food suggestions.',
      'We do not sell your data. You can deactivate your account at any time from your profile.',
    ],
  },
  {
    id: 'encryption',
    num: 2,
    title: 'Encryption',
    paragraphs: [
      'Passwords are hashed and never stored in plain text. Data travels over encrypted connections, and sign-in sessions can be revoked when you log out.',
    ],
  },
  {
    id: 'what-we-collect',
    num: 3,
    title: 'What we collect',
    paragraphs: [
      'Account: your email address.',
      'Profile: name, age range, gender and diet type.',
      'Health inputs: assessment answers, daily check-ins and BMI measurements.',
    ],
  },
  {
    id: 'educational-purpose',
    num: 4,
    title: 'Educational purpose',
    paragraphs: [
      'Results are for awareness and wellness tracking. They are not medical records and are not shared with healthcare providers unless you choose to.',
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
          Last updated: October 2026. Plain-language summary of how your data is handled.
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
