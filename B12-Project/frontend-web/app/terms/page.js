'use client';
import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const SECTIONS = [
  {
    id: 'educational-use',
    num: 1,
    title: 'Educational use',
    paragraphs: [
      'B12 Health Tracker is designed for education, awareness and wellness tracking. It does not provide medical diagnoses.',
      'Always consult a qualified doctor for clinical evaluation and blood tests.',
    ],
  },
  {
    id: 'scope-of-tool',
    num: 2,
    title: 'Scope of the tool',
    paragraphs: [
      'The risk score is based on your answers and general guidelines. It estimates risk, not your actual B12 level. It does not replace professional advice.',
    ],
  },
  {
    id: 'security-account',
    num: 3,
    title: 'Security and your account',
    paragraphs: [
      'Keep your password private and use a strong one. You are responsible for activity on your account. We may lock an account after repeated failed sign-ins to protect it.',
    ],
  },
];

export default function TermsPage() {
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
        <h1 className={styles.title}>Terms of Service</h1>
        <p className={styles.subtitle}>
          Last updated: October 2026. Please read before using B12 Health Tracker.
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

            {/* Bottom Disclaimer */}
            <div className={styles.disclaimerBanner}>
              This platform is designed strictly for health education and nutritional awareness. It is not an alternative to licensed clinical evaluation or blood diagnostic tests.
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
