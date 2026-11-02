'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp, setRiskResult } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { questionnaireAPI } from '@/services/api';
import { GROUP_INFO, normalizeServerResult, THRESHOLD_LOW, THRESHOLD_HIGH } from '@/utils/riskCalculator';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';
import { RiskGauge } from '@/components/UI';
import styles from './page.module.css';

const LEVEL_COPY = {
  LOW: {
    label: 'Low risk',
    tone: 'low',
    message: 'Your answers suggest a low chance of B12 deficiency right now. Keep including B12 sources in your diet and recheck every few months.',
  },
  MEDIUM: {
    label: 'Moderate risk',
    tone: 'medium',
    message: 'Some of your answers are linked to low B12. Small changes — fortified foods or a supplement — can help, and a blood test can confirm where you stand.',
  },
  HIGH: {
    label: 'High risk',
    tone: 'high',
    message: 'Several strong signals of possible B12 deficiency showed up. Please book an appointment with a doctor and ask for a B12 blood test.',
  },
};

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

const barTone = (pct) => (pct >= THRESHOLD_HIGH ? 'high' : pct >= THRESHOLD_LOW ? 'medium' : 'low');

export default function ResultsPage() {
  const { state, dispatch } = useApp();
  const { isAuthenticated, syncPendingAssessment } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [loadError, setLoadError] = useState('');

  const result = state.riskResult;

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;

    (async () => {
      try {
        if (state.pendingAnswers?.length) await syncPendingAssessment();
        const [latest, hist] = await Promise.all([
          questionnaireAPI.getLatest(),
          questionnaireAPI.getHistory(10).catch(() => ({ assessments: [] })),
        ]);
        if (cancelled) return;
        if (latest?.assessment) dispatch(setRiskResult(normalizeServerResult(latest.assessment)));
        setHistory(hist?.assessments || []);
      } catch (err) {
        if (!cancelled) setLoadError(err.message || 'Could not load your latest report.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const levelKey = (result?.level || '').toUpperCase();
  const copy = LEVEL_COPY[levelKey] || LEVEL_COPY.LOW;
  const pct = result?.percentage ?? 0;

  const categories = useMemo(() => {
    const b = result?.breakdown || {};
    return Object.entries(b)
      .filter(([key, v]) => GROUP_INFO[key] && typeof v === 'number')
      .map(([key, v]) => ({ key, pct: Math.max(0, Math.min(100, Math.round(v))), ...GROUP_INFO[key] }))
      .sort((a, b2) => b2.pct - a.pct);
  }, [result]);

  const showDoctorAlert = levelKey === 'HIGH' || (result?.breakdown?.neurological ?? 0) >= 50;
  const previous = history.length > 1 ? history[1] : null;
  const delta = previous ? Math.round(pct - Number(previous.risk_percentage || 0)) : null;

  return (
    <AuthGuard>
      <AppShell>
        <div className={styles.page}>
          <header className={styles.header}>
            <div>
              <p className={styles.kicker}>B12 risk report</p>
              <h1 className={styles.title}>Your assessment results</h1>
              {result?.completedAt && (
                <p className={styles.subtitle}>Completed {formatDate(result.completedAt)}</p>
              )}
            </div>
            {result && (
              <button type="button" className={styles.printBtn} onClick={() => window.print()}>
                Print / save for your doctor
              </button>
            )}
          </header>

          {loadError && !result && (
            <div className={styles.errorBanner} role="alert">{loadError}</div>
          )}

          {!result && loading && <div className={styles.skeleton} aria-busy="true" />}

          {!result && !loading && (
            <div className={styles.emptyCard}>
              <h2>No assessment yet</h2>
              <p>Answer about 20 quick questions to estimate your vitamin B12 deficiency risk.</p>
              <button type="button" className={styles.primaryBtn} onClick={() => router.push('/questionnaire')}>
                Take the assessment
              </button>
            </div>
          )}

          {result && (
            <>
              <div className={styles.grid}>
                <div className={styles.leftCol}>
                {/* ── Score ── */}
                <section className={`${styles.scoreCard} ${styles[`tone_${copy.tone}`]}`} aria-labelledby="score-heading">
                  <p id="score-heading" className={styles.cardKicker}>Overall B12 risk</p>
                  <div className={styles.scoreRow}>
                    <span className={styles.scoreValue}>{pct}%</span>
                    <span className={`${styles.levelBadge} ${styles[`badge_${copy.tone}`]}`}>{copy.label}</span>
                  </div>
                  <RiskGauge percentage={pct} />
                  <div className={styles.scaleLegend} aria-hidden="true">
                    <span>Low &lt;{THRESHOLD_LOW}</span>
                    <span>Moderate {THRESHOLD_LOW}–{THRESHOLD_HIGH - 1}</span>
                    <span>High {THRESHOLD_HIGH}+</span>
                  </div>
                  <p className={styles.scoreMessage}>{copy.message}</p>
                  {delta !== null && (
                    <p className={styles.delta}>
                      {delta === 0
                        ? 'Same as your previous assessment.'
                        : delta < 0
                          ? `▼ ${Math.abs(delta)} points lower than last time (${formatDate(previous.completed_at)}).`
                          : `▲ ${delta} points higher than last time (${formatDate(previous.completed_at)}).`}
                    </p>
                  )}
                </section>
                <section className={styles.card} aria-labelledby="next-heading">
                  <h2 id="next-heading" className={styles.cardHeading}>Your next steps</h2>
                  <ol className={styles.steps}>
                    {(result.suggestions || []).map((s, i) => (
                      <li key={s}>
                        <span className={styles.stepNum}>{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </section>
                </div>

                {/* ── Breakdown ── */}
                <section className={styles.card} aria-labelledby="breakdown-heading">
                  <h2 id="breakdown-heading" className={styles.cardHeading}>What&apos;s driving your score</h2>
                  <p className={styles.cardSub}>Higher bars mean more B12-related signals in that area.</p>
                  <ul className={styles.catList}>
                    {categories.map((c) => (
                      <li key={c.key} className={styles.catRow}>
                        <div className={styles.catHeader}>
                          <span className={styles.catName}>{c.label}</span>
                          <span className={styles.catPct}>{c.pct}%</span>
                        </div>
                        <div className={styles.track}>
                          <div className={`${styles.fill} ${styles[`fill_${barTone(c.pct)}`]}`} style={{ width: `${Math.max(c.pct, 2)}%` }} />
                        </div>
                        <p className={styles.catDesc}>{c.desc}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {showDoctorAlert && (
                <section className={styles.doctorAlert} aria-labelledby="doctor-heading">
                  <h2 id="doctor-heading">When to see a doctor</h2>
                  <p>
                    Book an appointment and ask for a <strong>vitamin B12 blood test</strong> (your doctor may also check a full
                    blood count, MMA or homocysteine). B12 deficiency is very treatable — and nerve symptoms respond best when
                    treated early.
                  </p>
                  <p>
                    <strong>Get urgent care</strong> if you have new difficulty walking, severe weakness, confusion, chest pain
                    or fainting.
                  </p>
                </section>
              )}

              <div>
                <section className={styles.card} aria-labelledby="track-heading">
                  <h2 id="track-heading" className={styles.cardHeading}>Keep tracking</h2>
                  <div className={styles.linkCards}>
                    <Link href="/checkin" className={styles.linkCard}>
                      <span className={styles.linkIcon} aria-hidden="true">✅</span>
                      <span>
                        <strong>Daily check-in</strong>
                        <small>30 seconds to log energy, mood, sleep and focus.</small>
                      </span>
                    </Link>
                    <Link href="/foods" className={styles.linkCard}>
                      <span className={styles.linkIcon} aria-hidden="true">🥚</span>
                      <span>
                        <strong>B12 foods for your diet</strong>
                        <small>See what to add to your plate.</small>
                      </span>
                    </Link>
                    <Link href="/progress" className={styles.linkCard}>
                      <span className={styles.linkIcon} aria-hidden="true">📈</span>
                      <span>
                        <strong>Progress & history</strong>
                        <small>Trends from your check-ins and past assessments.</small>
                      </span>
                    </Link>
                  </div>
                  <button type="button" className={styles.secondaryBtn} onClick={() => router.push('/questionnaire')}>
                    Retake assessment
                  </button>
                  <p className={styles.retakeHint}>We suggest retaking every 4–8 weeks, or after changing diet or supplements.</p>
                </section>
              </div>

              {history.length > 1 && (
                <section className={styles.card} aria-labelledby="history-heading">
                  <h2 id="history-heading" className={styles.cardHeading}>Assessment history</h2>
                  <ul className={styles.historyList}>
                    {history.slice(0, 6).map((h) => {
                      const tone = String(h.risk_level || '').toLowerCase();
                      return (
                        <li key={h.id} className={styles.historyRow}>
                          <span>{formatDate(h.completed_at)}</span>
                          <span className={`${styles.levelBadge} ${styles[`badge_${tone === 'medium' ? 'medium' : tone === 'high' ? 'high' : 'low'}`]}`}>
                            {Math.round(Number(h.risk_percentage || 0))}% · {tone === 'medium' ? 'Moderate' : tone === 'high' ? 'High' : 'Low'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </>
          )}

          <p className={styles.disclaimer}>
            This report is for education and awareness. It is not a diagnosis and does not replace advice from a qualified
            healthcare professional. Only a blood test can confirm B12 deficiency.
          </p>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
