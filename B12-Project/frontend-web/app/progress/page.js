'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useApp, setStreak } from '@/context/AppContext';
import { useI18n } from '@/i18n/LanguageProvider';
import { checkinAPI, questionnaireAPI } from '@/services/api';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';
import styles from './page.module.css';

const RANGES = [7, 14, 30];

// For fatigue, lower is better — we chart it as-is but explain it in the card.
const METRICS = [
  { key: 'energy', label: 'Energy', color: '#2E7D4E', fill: '#5AB879', better: 'higher' },
  { key: 'fatigue', label: 'Fatigue', color: '#C04A2D', fill: '#E76F51', better: 'lower' },
  { key: 'mood', label: 'Mood', color: '#3E657D', fill: '#5A8AA8', better: 'higher' },
  { key: 'sleep', label: 'Sleep', color: '#5A4A8A', fill: '#8E7CC3', better: 'higher' },
  { key: 'focus', label: 'Focus', color: '#9A6A0C', fill: '#E8C15A', better: 'higher' },
];

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

const trendOf = (values, better) => {
  if (values.length < 4) return null;
  const mid = Math.floor(values.length / 2);
  const diff = avg(values.slice(mid)) - avg(values.slice(0, mid));
  if (Math.abs(diff) < 0.3) return { label: 'Steady', tone: 'neutral' };
  const improving = better === 'higher' ? diff > 0 : diff < 0;
  return improving ? { label: 'Improving', tone: 'good' } : { label: 'Worsening', tone: 'bad' };
};

export default function ProgressPage() {
  const { t, formatDate } = useI18n();
  const { state, dispatch } = useApp();
  const router = useRouter();
  const [range, setRange] = useState(14);
  const [logs, setLogs] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    checkinAPI.getHistory(range)
      .then((d) => {
        if (cancelled) return;
        setLogs(d?.logs || []);
        if (d?.streak) dispatch(setStreak(d.streak));
      })
      .catch((err) => { if (!cancelled) setError(err.message || 'Could not load your check-ins.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range, dispatch]);

  useEffect(() => {
    questionnaireAPI.getHistory(12).then((d) => setAssessments(d?.assessments || [])).catch(() => {});
  }, []);

  const data = useMemo(() => logs.map((h) => ({
    day: formatDate(`${h.checkin_date}T00:00:00`, { day: 'numeric', month: 'short' }),
    energy: h.energy_score ?? null,
    fatigue: h.fatigue_score ?? null,
    mood: h.mood_score ?? null,
    sleep: h.sleep_score ?? null,
    focus: h.focus_score ?? null,
    notes: h.notes,
  })), [logs, formatDate]);

  const alerts = useMemo(() => {
    if (logs.length < 3) return [];
    const out = [];
    const highFatigue = logs.filter((l) => l.fatigue_score >= 3).length;
    if (highFatigue >= 3) out.push(`High fatigue on ${highFatigue} of ${logs.length} logged days.`);
    const poorSleep = logs.filter((l) => l.sleep_score <= 1).length;
    if (poorSleep >= 3) out.push(`Poor sleep on ${poorSleep} of ${logs.length} logged days.`);
    const lowMood = logs.filter((l) => l.mood_score <= 1).length;
    if (lowMood >= 3) out.push(`Low mood on ${lowMood} of ${logs.length} logged days.`);
    const fog = logs.filter((l) => l.focus_score <= 1).length;
    if (fog >= 3) out.push(`Brain fog on ${fog} of ${logs.length} logged days.`);
    return out;
  }, [logs]);

  const streak = state.serverStreak?.current_streak ?? 0;
  const assessmentData = useMemo(() => [...assessments].reverse().map((a) => ({
    day: formatDate(a.completed_at, { day: 'numeric', month: 'short' }),
    score: Math.round(Number(a.risk_percentage || 0)),
  })), [assessments, formatDate]);

  return (
    <AuthGuard>
      <AppShell>
        <div className={styles.page}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>{t('Your progress')}</h1>
              <p className={styles.subtitle}>{t('Daily check-ins on a 0–4 scale. Patterns over 2+ weeks are the most useful.')}</p>
            </div>
            <div className={styles.rangeToggle} role="tablist" aria-label={t('Date range')}>
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={range === r}
                  className={`${styles.rangeBtn} ${range === r ? styles.rangeActive : ''}`}
                  onClick={() => setRange(r)}
                >
                  {t('{n} days', { n: r })}
                </button>
              ))}
            </div>
          </header>

          <div className={styles.stats}>
            <div className={`${styles.stat} ${styles.statGreen}`}>
              <p className={styles.statLabel}>{t('Streak')}</p>
              <p className={styles.statValue}>{t(streak === 1 ? '{n} day' : '{n} days', { n: streak })}</p>
            </div>
            <div className={`${styles.stat} ${styles.statYellow}`}>
              <p className={styles.statLabel}>{t('Days logged')}</p>
              <p className={styles.statValue}>{Math.min(logs.length, range)} / {range}</p>
            </div>
            <div className={`${styles.stat} ${styles.statBlue}`}>
              <p className={styles.statLabel}>{t('Avg. energy')}</p>
              <p className={styles.statValue}>
                {logs.length ? `${avg(logs.map((l) => l.energy_score)).toFixed(1)} / 4` : '—'}
              </p>
            </div>
          </div>

          {error && <div className={styles.error} role="alert">{t(error)}</div>}

          {alerts.length > 0 && (
            <section className={styles.alert} aria-labelledby="alert-h">
              <h2 id="alert-h">{t('Patterns worth noticing')}</h2>
              <ul>{alerts.map((a) => <li key={a}>{t(a)}</li>)}</ul>
              <p>{t('These are common B12-related symptoms. If they continue, consider discussing a B12 blood test with your doctor.')}</p>
            </section>
          )}

          {!loading && logs.length === 0 ? (
            <div className={styles.empty}>
              <h2>{t('No check-ins in the last {n} days', { n: range })}</h2>
              <p>{t('Log a 30-second daily check-in to start seeing your energy, mood and sleep trends here.')}</p>
              <button type="button" className={styles.primaryBtn} onClick={() => router.push('/checkin')}>
                {t('Start daily check-in')}
              </button>
            </div>
          ) : (
            <div className={styles.chartsGrid}>
              {METRICS.map((m) => {
                const values = logs.map((l) => l[`${m.key}_score`]).filter((v) => v !== null && v !== undefined);
                const trend = trendOf(values, m.better);
                const a = avg(values);
                return (
                  <section key={m.key} className={styles.chartCard} aria-label={t('{metric} trend', { metric: t(m.label) })}>
                    <div className={styles.chartHead}>
                      <div>
                        <h2 className={styles.chartTitle}>{t(m.label)}</h2>
                        <p className={styles.chartSub}>
                          {a === null ? t('No data') : t('Avg {n} / 4', { n: a.toFixed(1) })} · {t(m.better === 'higher' ? 'higher is better' : 'lower is better')}
                        </p>
                      </div>
                      {trend && <span className={`${styles.trend} ${styles[`trend_${trend.tone}`]}`}>{t(trend.label)}</span>}
                    </div>
                    <div className={styles.chartWrap}>
                      {mounted && !loading && (
                        <ResponsiveContainer width="100%" height={150}>
                          <AreaChart data={data} margin={{ top: 8, right: 6, left: -26, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`g-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={m.fill} stopOpacity={0.35} />
                                <stop offset="95%" stopColor={m.fill} stopOpacity={0.03} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#F0EAE0" vertical={false} />
                            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#616C65' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
                            <YAxis domain={[0, 4]} ticks={[0, 2, 4]} tick={{ fontSize: 11, fill: '#616C65' }} tickLine={false} axisLine={false} />
                            <Tooltip
                              contentStyle={{ background: '#fff', border: '1px solid #E8E2D5', borderRadius: 10, fontSize: 12 }}
                              formatter={(v) => [`${v} / 4`, t(m.label)]}
                            />
                            <Area type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2.2} fill={`url(#g-${m.key})`} connectNulls dot={{ r: 2.5, fill: m.color }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </section>
                );
              })}

              <section className={styles.chartCard} aria-label={t('Assessment score history')}>
                <div className={styles.chartHead}>
                  <div>
                    <h2 className={styles.chartTitle}>{t('B12 risk score')}</h2>
                    <p className={styles.chartSub}>{t('Your assessments over time · lower is better')}</p>
                  </div>
                </div>
                <div className={styles.chartWrap}>
                  {assessmentData.length < 2 ? (
                    <p className={styles.chartEmpty}>
                      {assessmentData.length === 1
                        ? t('Latest score: {n}%. Retake in a few weeks to see a trend.', { n: assessmentData[0].score })
                        : t('Take the assessment to start tracking your score.')}
                    </p>
                  ) : mounted && (
                    <ResponsiveContainer width="100%" height={150}>
                      <AreaChart data={assessmentData} margin={{ top: 8, right: 6, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke="#F0EAE0" vertical={false} />
                        <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#616C65' }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} ticks={[0, 35, 65, 100]} tick={{ fontSize: 11, fill: '#616C65' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8E2D5', borderRadius: 10, fontSize: 12 }} formatter={(v) => [`${v}%`, t('Risk')]} />
                        <Area type="monotone" dataKey="score" stroke="#1E3A2B" strokeWidth={2.2} fill="#E5EFE7" dot={{ r: 3, fill: '#1E3A2B' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </section>
            </div>
          )}

          <p className={styles.disclaimer}>
            {t("Symptom tracking can help you spot patterns, but it can't diagnose B12 deficiency. Only a blood test can.")}
          </p>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
