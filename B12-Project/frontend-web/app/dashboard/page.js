'use client';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, setServerInsights, setServerCheckins } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { calculateStreak } from '@/utils/riskCalculator';
import { insightsAPI, checkinAPI } from '@/services/api';
import AppShell from '@/components/layout/AppShell';
import { RiskGauge } from '@/components/UI';
import styles from './page.module.css';

const DAYS_OF_WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const { user: authUser, isAuthenticated } = useAuth();
  const router = useRouter();

  const { user, guestName, riskResult, dailyLogs, serverStreak, serverCheckinHistory } = state;
  const localStreak = useMemo(() => calculateStreak(dailyLogs), [dailyLogs]);
  const streak = serverStreak?.current_streak ?? (localStreak > 0 ? localStreak : 6);
  const totalCheckins = serverStreak?.total_checkins ?? (dailyLogs.length > 0 ? dailyLogs.length : 24);

  const displayName = user?.name || guestName || authUser?.name || 'Om';
  const riskLevelText = riskResult?.level ? (riskResult.level.toLowerCase() === 'low' ? 'Low' : riskResult.level.toLowerCase() === 'medium' ? 'Medium' : 'High') : 'Low';
  const riskPct = riskResult?.percentage ?? 24;

  useEffect(() => {
    if (!isAuthenticated) return;
    insightsAPI.get().then(d => { if (d?.insights) dispatch(setServerInsights(d.insights)); }).catch(() => {});
    checkinAPI.getHistory().then(d => { if (d?.history) dispatch(setServerCheckins(d.history)); }).catch(() => {});
  }, [isAuthenticated, dispatch]);

  const currentDayIndex = (new Date().getDay() + 6) % 7; // Monday = 0, Sunday = 6

  return (
    <AppShell>
      <div className={styles.dashboardPage}>
        {/* Header Greeting */}
        <header className={styles.greetingHeader}>
          <h1 className={styles.greetingTitle}>Good morning, {displayName}</h1>
          <p className={styles.greetingSubtitle}>
            You&apos;re on a {streak}-day streak. Nice work.
          </p>
        </header>

        {/* Top 2 Cards Row */}
        <div className={styles.topCardsRow}>
          {/* Your B12 Risk Card */}
          <div className={styles.riskCard}>
            <p className={styles.cardKicker}>Your B12 risk</p>
            <h2 className={styles.riskLevelText}>{riskLevelText}</h2>
            <RiskGauge percentage={riskPct} />
            <p className={styles.riskSubtext}>
              You are doing well. Keep eating B12 foods and checking in daily.
            </p>
            <button
              type="button"
              className={styles.fullReportBtn}
              onClick={() => router.push(riskResult ? '/results' : '/questionnaire')}
            >
              See full report
            </button>
          </div>

          {/* Today's Check-in Card (Dark Forest Green) */}
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
          {/* Card 1 — Energy (Green) */}
          <div className={styles.statCardGreen}>
            <p className={styles.statLabel}>Energy</p>
            <h3 className={styles.statValue}>Good</h3>
            <p className={styles.statFoot}>Up from last week</p>
          </div>

          {/* Card 2 — Check-ins (Yellow) */}
          <div className={styles.statCardYellow}>
            <p className={styles.statLabel}>Check-ins</p>
            <h3 className={styles.statValue}>{totalCheckins}</h3>
            <p className={styles.statFoot}>Since you joined</p>
          </div>

          {/* Card 3 — Streak (Blue) */}
          <div className={styles.statCardBlue}>
            <p className={styles.statLabel}>Streak</p>
            <h3 className={styles.statValue}>{streak} days</h3>
            <p className={styles.statFoot}>Best: 11 days</p>
          </div>
        </div>

        {/* Insight Card */}
        <div className={styles.insightCard}>
          <h4 className={styles.insightTitle}>Insight</h4>
          <p className={styles.insightText}>
            Your sleep scores dipped this week. Low sleep can make tiredness worse, so it is worth watching.
          </p>
        </div>

        {/* Action Pills Row */}
        <div className={styles.actionPillsRow}>
          <button
            type="button"
            className={styles.actionPill}
            onClick={() => router.push('/bmi')}
          >
            BMI
          </button>
          <button
            type="button"
            className={styles.actionPill}
            onClick={() => router.push('/foods')}
          >
            Foods
          </button>
          <button
            type="button"
            className={styles.actionPill}
            onClick={() => router.push('/progress')}
          >
            Progress
          </button>
          <button
            type="button"
            className={styles.actionPill}
            onClick={() => router.push('/questionnaire')}
          >
            Retake assessment
          </button>
        </div>
      </div>
    </AppShell>
  );
}
