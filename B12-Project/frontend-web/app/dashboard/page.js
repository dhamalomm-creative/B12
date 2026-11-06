'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp, setServerInsights, setServerCheckins, setRiskResult, setStreak } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/LanguageProvider';
import { insightsAPI, checkinAPI, questionnaireAPI } from '@/services/api';
import { normalizeServerResult, localISODate } from '@/utils/riskCalculator';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';
import { RiskGauge } from '@/components/UI';
import styles from './page.module.css';

const LEVEL_LABEL = { LOW: 'Low risk', MEDIUM: 'Moderate risk', HIGH: 'High risk' };

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const stripEmoji = (s = '') => s.replace(/^[^\p{L}\p{N}]+\s*/u, '');

export default function DashboardPage() {
  const { t, formatDate } = useI18n();
  const { state, dispatch } = useApp();
  const { user: authUser, isAuthenticated, syncPendingAssessment } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const { riskResult, serverStreak, serverInsights, serverCheckinHistory } = state;

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    (async () => {
      if (state.pendingAnswers?.length) await syncPendingAssessment();
      const [ins, hist, latest] = await Promise.allSettled([
        insightsAPI.get(),
        checkinAPI.getHistory(14),
        questionnaireAPI.getLatest(),
      ]);
      if (cancelled) return;
      if (ins.status === 'fulfilled') dispatch(setServerInsights(ins.value?.insights || []));
      if (hist.status === 'fulfilled') {
        dispatch(setServerCheckins(hist.value?.logs || []));
        dispatch(setStreak(hist.value?.streak || null));
      }
      if (latest.status === 'fulfilled') {
        dispatch(setRiskResult(latest.value?.assessment ? normalizeServerResult(latest.value.assessment) : null));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const displayName = authUser?.name || authUser?.email?.split('@')[0] || t('there');
  const today = localISODate();

  const week = useMemo(() => {
    const logged = new Set((serverCheckinHistory || []).map((l) => l.checkin_date));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const iso = localISODate(d);
      return {
        iso,
        label: formatDate(d, { weekday: 'narrow' }),
        done: logged.has(iso),
        isToday: iso === today,
      };
    });
  }, [serverCheckinHistory, today, formatDate]);

  const checkedInToday = week[6]?.done;
  const streak = serverStreak?.current_streak ?? 0;
  const totalCheckins = serverStreak?.total_checkins ?? 0;

  const avgEnergy = useMemo(() => {
    const last7 = (serverCheckinHistory || []).slice(-7);
    if (!last7.length) return null;
    return last7.reduce((s, l) => s + (l.energy_score ?? 0), 0) / last7.length;
  }, [serverCheckinHistory]);

  const levelKey = (riskResult?.level || '').toUpperCase();
  const tone = levelKey === 'HIGH' ? 'high' : levelKey === 'MEDIUM' ? 'medium' : 'low';

  const insights = (serverInsights || []).slice(0, 3);

  return (
    <AuthGuard>
      <AppShell>
        <div className={styles.page}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>{t(greeting())}, {displayName}</h1>
              <p className={styles.subtitle}>
                {streak > 0
                  ? `🔥 ${t('{n}-day check-in streak — keep it going.', { n: streak })}`
                  : t('Log a quick check-in today to start your streak.')}
              </p>
            </div>
          </header>

          <div className={styles.topRow}>
            {/* Risk */}
            <section className={`${styles.card} ${styles.riskCard}`} aria-labelledby="risk-h">
              <p id="risk-h" className={styles.kicker}>{t('Your B12 risk')}</p>
              {loading && !riskResult ? (
                <div className={styles.skeletonLine} />
              ) : riskResult ? (
                <>
                  <div className={styles.riskRow}>
                    <span className={styles.riskValue}>{riskResult.percentage}%</span>
                    <span className={`${styles.badge} ${styles[`badge_${tone}`]}`}>{t(LEVEL_LABEL[levelKey] || 'Low risk')}</span>
                  </div>
                  <RiskGauge percentage={riskResult.percentage} />
                  <p className={styles.muted}>
                    {t('From your assessment on {date}.', { date: formatDate(riskResult.completedAt || Date.now(), { day: 'numeric', month: 'short' }) })}
                  </p>
                  <div className={styles.btnRow}>
                    <button type="button" className={styles.primaryBtn} onClick={() => router.push('/results')}>
                      {t('View full report')}
                    </button>
                    <button type="button" className={styles.ghostBtn} onClick={() => router.push('/questionnaire')}>
                      {t('Retake')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className={styles.emptyTitle}>{t('Not assessed yet')}</h2>
                  <p className={styles.muted}>{t('Answer about 20 quick questions to estimate your B12 deficiency risk.')}</p>
                  <button type="button" className={styles.primaryBtn} onClick={() => router.push('/questionnaire')}>
                    {t('Take the assessment')}
                  </button>
                </>
              )}
            </section>

            {/* Check-in */}
            <section className={`${styles.card} ${styles.checkinCard}`} aria-labelledby="checkin-h">
              <div>
                <h2 id="checkin-h" className={styles.checkinTitle}>
                  {t(checkedInToday ? 'Checked in today ✓' : "Today's check-in")}
                </h2>
                <p className={styles.checkinSub}>
                  {t(checkedInToday ? 'Done for today — your next check-in opens tomorrow.' : 'Five quick taps, about 30 seconds.')}
                </p>
              </div>
              <ol className={styles.week} aria-label={t('Check-ins over the last 7 days')}>
                {week.map((d) => (
                  <li
                    key={d.iso}
                    className={`${styles.day} ${d.done ? styles.dayDone : ''} ${d.isToday ? styles.dayToday : ''}`}
                    aria-label={`${d.iso}: ${t(d.done ? 'checked in' : 'no check-in')}`}
                  >
                    <span>{d.done ? '✓' : d.label}</span>
                  </li>
                ))}
              </ol>
              <button type="button" className={styles.checkinBtn} onClick={() => router.push('/checkin')}>
                {t(checkedInToday ? "View or edit today's" : 'Start check-in')}
              </button>
            </section>
          </div>

          <div className={styles.stats}>
            <div className={`${styles.stat} ${styles.statGreen}`}>
              <p className={styles.statLabel}>{t('Current streak')}</p>
              <p className={styles.statValue}>{t(streak === 1 ? '{n} day' : '{n} days', { n: streak })}</p>
              <p className={styles.statFoot}>{t('Best: {n} days', { n: serverStreak?.longest_streak ?? 0 })}</p>
            </div>
            <div className={`${styles.stat} ${styles.statYellow}`}>
              <p className={styles.statLabel}>{t('Avg. energy (7 days)')}</p>
              <p className={styles.statValue}>{avgEnergy === null ? '—' : `${avgEnergy.toFixed(1)} / 4`}</p>
              <p className={styles.statFoot}>{t(avgEnergy === null ? 'No check-ins yet' : avgEnergy >= 2.5 ? 'Looking steady' : 'Lower than ideal')}</p>
            </div>
            <div className={`${styles.stat} ${styles.statBlue}`}>
              <p className={styles.statLabel}>{t('Total check-ins')}</p>
              <p className={styles.statValue}>{totalCheckins}</p>
              <p className={styles.statFoot}>{t('All time')}</p>
            </div>
          </div>

          <section aria-labelledby="ins-h">
            <h2 id="ins-h" className={styles.sectionTitle}>{t('Insights for you')}</h2>
            <div className={styles.insights}>
              {insights.length === 0 && (
                <div className={`${styles.insight} ${styles.insight_low}`}>
                  <h3>{t('Daily tip')}</h3>
                  <p>{t('Checking in daily helps reveal subtle patterns in energy and fatigue that are easy to miss.')}</p>
                </div>
              )}
              {insights.map((ins) => (
                <div key={`${ins.type}-${ins.title}`} className={`${styles.insight} ${styles[`insight_${ins.priority || 'low'}`]}`}>
                  <h3>{t(stripEmoji(ins.title))}</h3>
                  <p>{t(ins.message)}</p>
                </div>
              ))}
            </div>
          </section>

          <nav className={styles.quick} aria-label={t('Quick links')}>
            <Link href="/foods" className={styles.quickLink}><span aria-hidden="true">🥚</span> {t('B12 foods')}</Link>
            <Link href="/progress" className={styles.quickLink}><span aria-hidden="true">📈</span> {t('Progress')}</Link>
            <Link href="/bmi" className={styles.quickLink}><span aria-hidden="true">⚖️</span> {t('BMI')}</Link>
            <Link href="/profile" className={styles.quickLink}><span aria-hidden="true">👤</span> {t('Profile')}</Link>
          </nav>

          <p className={styles.disclaimer}>
            {t('Educational tool, not a medical diagnosis. Talk to a doctor about any symptoms that worry you.')}
          </p>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
