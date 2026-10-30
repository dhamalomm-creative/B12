'use client';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';
import { RiskGauge } from '@/components/UI';
import styles from './page.module.css';

const DEFAULT_CATEGORIES = [
  { name: 'Diet', defaultVal: 0 },
  { name: 'Neurological', defaultVal: 0 },
  { name: 'Energy', defaultVal: 0 },
  { name: 'Digestive', defaultVal: 0 },
  { name: 'Psychological', defaultVal: 0 },
  { name: 'Lifestyle', defaultVal: 0 },
];

export default function ResultsPage() {
  const { state } = useApp();
  const router = useRouter();
  const { riskResult } = state;

  const hasAssessment = !!riskResult;
  const percentage = riskResult?.percentage ?? 0;
  const level = riskResult?.level
    ? (riskResult.level.toLowerCase() === 'low'
        ? 'Low risk'
        : riskResult.level.toLowerCase() === 'medium'
        ? 'Moderate risk'
        : 'High risk')
    : 'Not assessed';

  const riskMessage = !hasAssessment
    ? 'Complete the clinical questionnaire to calculate your personalized risk assessment.'
    : percentage < 35
    ? 'Your answers suggest a low chance of B12 deficiency right now. Continue eating regular B12 food sources.'
    : percentage < 65
    ? 'Your answers suggest a moderate risk. Adding fortified foods or supplements may help address early symptoms.'
    : 'Your answers indicate strong markers of potential B12 deficiency. We recommend consulting a healthcare provider.';

  const suggestions = riskResult?.suggestions?.length
    ? riskResult.suggestions.slice(0, 4)
    : [
        'Include B12-rich foods such as dairy, eggs, or fortified cereals daily.',
        'Log your symptoms each morning with the 30-second daily check-in.',
        'Consult a healthcare provider for a serum B12 or methylmalonic acid (MMA) blood test if symptoms persist.',
      ];

  const breakdown = riskResult?.breakdown || {};

  return (
    <AuthGuard>
      <AppShell>
        <div className={styles.resultsPage}>
          {/* Header */}
          <header className={styles.header}>
            <h1 className={styles.title}>Your assessment results</h1>
            <p className={styles.subtitle}>
              {hasAssessment
                ? `Evaluation calculated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                : 'No assessment completed yet'}
            </p>
          </header>

          {/* 2-Column Grid */}
          <div className={styles.grid}>
            {/* Left Column */}
            <div className={styles.leftCol}>
              {/* Risk Card */}
              <div className={styles.riskCard}>
                <p className={styles.riskLabel}>Overall B12 risk</p>
                <h2 className={styles.riskPercent}>{hasAssessment ? `${percentage}%` : 'N/A'}</h2>
                <p className={styles.riskLevel}>{level}</p>

                {hasAssessment && <RiskGauge percentage={percentage} />}

                <p className={styles.riskDesc}>{riskMessage}</p>
              </div>

              {/* What to do next Card */}
              <div className={styles.nextStepsCard}>
                <h3 className={styles.cardHeading}>Personalized suggestions</h3>
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

          {/* Action buttons row */}
          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => router.push('/dashboard')}
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => router.push('/checkin')}
            >
              Log Daily Check-in
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => router.push('/foods')}
            >
              Explore B12 Foods
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => router.push('/questionnaire')}
            >
              {hasAssessment ? 'Retake Assessment' : 'Take Assessment'}
            </button>
          </div>

          {/* Bottom Banner */}
          <div className={styles.bottomBanner}>
            This tool is for education and wellness awareness. It does not provide a clinical diagnosis. Please consult a licensed physician for blood testing and medical decisions.
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
