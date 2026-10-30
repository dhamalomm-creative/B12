'use client';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, setServerInsights, setServerCheckins, setRiskResult, setStreak } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { calculateStreak } from '@/utils/riskCalculator';
import { insightsAPI, checkinAPI, questionnaireExtAPI } from '@/services/api';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';
import { RiskGauge } from '@/components/UI';
import styles from './page.module.css';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const { user: authUser, isAuthenticated } = useAuth();
  const router = useRouter();

  const { user, guestName, riskResult, dailyLogs, serverStreak, serverInsights } = state;
  const localStreak = useMemo(() => calculateStreak(dailyLogs), [dailyLogs]);
  const streak = serverStreak?.current_streak ?? localStreak ?? 0;
  const totalCheckins = serverStreak?.total_checkins ?? dailyLogs.length ?? 0;

  const displayName = authUser?.name || user?.name || guestName || authUser?.email?.split('@')[0] || 'Friend';
  const hasAssessment = !!riskResult;
  const riskLevelText = hasAssessment
    ? (riskResult.level ? (riskResult.level.toLowerCase() === 'low' ? 'Low' : riskResult.level.toLowerCase() === 'medium' ? 'Medium' : 'High') : 'Low')
    : 'Not assessed';
  const riskPct = hasAssessment ? (riskResult.percentage ?? 0) : 0;

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load server insights
    insightsAPI.get()
      .then(d => {
        if (d?.insights) dispatch(setServerInsights(d.insights));
      })
      .catch(() => {});

    // Load check-in history and streak
    checkinAPI.getHistory(14)
      .then(d => {
        if (d?.logs) dispatch(setServerCheckins(d.logs));
        if (d?.streak) {
          dispatch({ type: 'SET_SERVER_STREAK', payload: d.streak });
          dispatch(setStreak(d.streak.current_streak));
        }
      })
      .catch(() => {});

    // If assessment not loaded in memory, fetch latest from server
    if (!riskResult) {
      questionnaireExtAPI.getLatest()
        .then(d => {
          if (d?.assessment) {
            dispatch(setRiskResult({
              level: d.assessment.risk_level,
              percentage: Math.round(d.assessment.risk_percentage || 0),
              breakdown: d.assessment.category_breakdown || {},
              suggestions: d.assessment.suggestions || [],
            }));
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, dispatch, riskResult]);

  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6

  // Pick primary insight
  const activeInsight = serverInsights && serverInsights.length > 0
    ? serverInsights[0]
    : {
        title: 'Daily Tip',
        message: 'Check in each day to monitor subtle energy shifts and see your habit streak grow.',
      };

  return (
    <AuthGuard>
      <AppShell>
        <div className={styles.dashboardPage}>
          {/* Header Greeting */}
          <header className={styles.greetingHeader}>
            <h1 className={styles.greetingTitle}>Good day, {displayName}</h1>
            <p className={styles.greetingSubtitle}>
              {streak > 0
                ? `You're on a ${streak}-day streak. Keep it going!`
                : 'Start your daily check-in to begin your streak.'}
            </p>
          </header>

          {/* Top 2 Cards Row */}
          <div className={styles.topCardsRow}>
            {/* Your B12 Risk Card */}
            <div className={styles.riskCard}>
              <p className={styles.cardKicker}>Your B12 risk</p>
              <h2 className={styles.riskLevelText}>{riskLevelText}</h2>
              {hasAssessment && <RiskGauge percentage={riskPct} />}
              <p className={styles.riskSubtext}>
                {hasAssessment
                  ? 'Based on your latest assessment. Eat regular B12 foods and keep logging daily.'
                  : 'Take the 5-minute clinical assessment to estimate your vitamin B12 deficiency risk.'}
              </p>
              <button
                type="button"
                className={styles.fullReportBtn}
                onClick={() => router.push(hasAssessment ? '/results' : '/questionnaire')}
              >
                {hasAssessment ? 'See full report' : 'Take assessment'}
              </button>
            </div>

            {/* Today's Check-in Card */}
            <div className={styles.checkinCard}>
              <div className={styles.checkinTop}>
                <h3 className={styles.checkinTitle}>Today&apos;s check-in</h3>
                <p className={styles.checkinSubtitle}>Five quick taps, about 30 seconds.</p>
              </div>

              {/* Week day dots */}
              <div className={styles.weekDotsRow}>
                {DAYS_OF_WEEK.map((day, idx) => {
                  const isPast = idx < currentDayIndex;
                  const isToday = idx === currentDayIndex;
                  return (
                    <div
                      key={idx}
                      className={`${styles.weekDot} ${isPast ? styles.weekDotCompleted : ''} ${isToday ? styles.weekDotToday : ''}`}
                    >
                      <span>{day}</span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className={styles.startCheckinBtn}
                onClick={() => router.push('/checkin')}
              >
                Start check-in
              </button>
            </div>
          </div>

          {/* Middle 3 Stat Cards Row */}
          <div className={styles.statCardsRow}>
            {/* Card 1 — Energy */}
            <div className={styles.statCardGreen}>
              <p className={styles.statLabel}>Energy</p>
              <h3 className={styles.statValue}>
                {totalCheckins > 0 ? 'Active' : 'Not logged'}
              </h3>
              <p className={styles.statFoot}>Daily tracking</p>
            </div>

            {/* Card 2 — Check-ins */}
            <div className={styles.statCardYellow}>
              <p className={styles.statLabel}>Check-ins</p>
              <h3 className={styles.statValue}>{totalCheckins}</h3>
              <p className={styles.statFoot}>Total logged</p>
            </div>

            {/* Card 3 — Streak */}
            <div className={styles.statCardBlue}>
              <p className={styles.statLabel}>Streak</p>
              <h3 className={styles.statValue}>{streak} {streak === 1 ? 'day' : 'days'}</h3>
              <p className={styles.statFoot}>Consecutive days</p>
            </div>
          </div>

          {/* Insight Card */}
          <div className={styles.insightCard}>
            <h4 className={styles.insightTitle}>{activeInsight.title || 'Insight'}</h4>
            <p className={styles.insightText}>
              {activeInsight.message || activeInsight.text || 'Checking in daily helps identify subtle patterns in energy and fatigue.'}
            </p>
          </div>

          {/* Action Pills Row */}
          <div className={styles.actionPillsRow}>
            <button
              type="button"
              className={styles.actionPill}
              onClick={() => router.push('/bmi')}
            >
              BMI Calculator
            </button>
            <button
              type="button"
              className={styles.actionPill}
              onClick={() => router.push('/foods')}
            >
              B12 Foods
            </button>
            <button
              type="button"
              className={styles.actionPill}
              onClick={() => router.push('/progress')}
            >
              Progress Charts
            </button>
            <button
              type="button"
              className={styles.actionPill}
              onClick={() => router.push('/questionnaire')}
            >
              {hasAssessment ? 'Retake assessment' : 'Take assessment'}
            </button>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
