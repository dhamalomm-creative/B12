'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import AppShell from '@/components/layout/AppShell';
import { RiskGauge } from '@/components/UI';
import styles from './page.module.css';

const DEFAULT_CATEGORIES = [
  { name: 'Diet', defaultVal: 20 },
  { name: 'Neurological', defaultVal: 15 },
  { name: 'Energy', defaultVal: 30 },
  { name: 'Digestive', defaultVal: 10 },
  { name: 'Psychological', defaultVal: 18 },
  { name: 'Lifestyle', defaultVal: 22 },
];

export default function ResultsPage() {
  const { state } = useApp();
  const router = useRouter();
  const { riskResult } = state;

  const percentage = riskResult?.percentage ?? 24;
  const level = riskResult?.level ? (riskResult.level.toLowerCase() === 'low' ? 'Low risk' : riskResult.level.toLowerCase() === 'medium' ? 'Moderate risk' : 'High risk') : 'Low risk';

  const riskMessage =
    percentage < 35
      ? 'Your answers suggest a low chance of B12 deficiency right now.'
      : percentage < 65
      ? 'Your answers suggest a moderate risk. Adding fortified foods or supplements may help.'
      : 'Your answers indicate high potential signs of B12 deficiency. Consider discussing with a doctor.';

  const suggestions = riskResult?.suggestions?.length
    ? riskResult.suggestions.slice(0, 3)
    : [
        'Include B12 sources such as eggs, dairy or fortified foods daily.',
        'Repeat this assessment in a few weeks.',
        'Talk to a doctor if symptoms persist.',
      ];

  const breakdown = riskResult?.breakdown || {};

  return (
    <AppShell>
      <div className={styles.resultsPage}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Your results</h1>
          <p className={styles.subtitle}>
            Assessment completed {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}. Sample data.
          </p>
        </header>

        {/* 2-Column Grid */}
        <div className={styles.grid}>
          {/* Left Column */}
          <div className={styles.leftCol}>
            {/* Risk Card */}
            <div className={styles.riskCard}>
              <p className={styles.riskLabel}>Overall B12 risk</p>
              <h2 className={styles.riskPercent}>{percentage}%</h2>
              <p className={styles.riskLevel}>{level}</p>

              <RiskGauge percentage={percentage} />

              <p className={styles.riskDesc}>{riskMessage}</p>
            </div>

            {/* What to do next Card */}
            <div className={styles.nextStepsCard}>
              <h3 className={styles.cardHeading}>What to do next</h3>
              <ul className={styles.bulletList}>
                {suggestions.map((s, idx) => (
                  <li key={idx} className={styles.bulletItem}>
                    <span className={styles.bulletDot}>•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column — Breakdown by Category */}
          <div className={styles.rightCol}>
            <div className={styles.breakdownCard}>
              <h3 className={styles.cardHeading}>Breakdown by category</h3>
              <div className={styles.categoriesList}>
                {DEFAULT_CATEGORIES.map((cat) => {
                  const val = breakdown[cat.name.toLowerCase()] ?? breakdown[cat.name] ?? cat.defaultVal;
                  const pct = Math.round(val);
                  return (
                    <div key={cat.name} className={styles.catRow}>
                      <div className={styles.catHeader}>
                        <span className={styles.catName}>{cat.name}</span>
                        <span className={styles.catPct}>{pct}%</span>
                      </div>
                      <div className={styles.track}>
                        <div
                          className={styles.fill}
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className={styles.bottomBanner}>
          This tool is for education and awareness. It does not provide a diagnosis. Please see a doctor for blood tests.
        </div>
      </div>
    </AppShell>
  );
}
