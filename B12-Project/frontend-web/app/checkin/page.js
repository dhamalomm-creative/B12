'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, addDailyLog, setStreak } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { calculateStreak } from '@/utils/riskCalculator';
import { checkinAPI } from '@/services/api';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';
import styles from './page.module.css';

const CHECKIN_QUESTIONS = [
  {
    id: 'daily_energy',
    title: 'How is your energy today?',
    nextText: 'Next: Fatigue, Mood, Sleep, Focus',
    options: [
      { value: 0, label: 'Very low' },
      { value: 1, label: 'Low' },
      { value: 2, label: 'Okay' },
      { value: 3, label: 'Good' },
      { value: 4, label: 'Great' },
    ],
  },
  {
    id: 'daily_fatigue',
    title: 'How is your fatigue level today?',
    nextText: 'Next: Mood, Sleep, Focus',
    options: [
      { value: 0, label: 'Severe' },
      { value: 1, label: 'High' },
      { value: 2, label: 'Moderate' },
      { value: 3, label: 'Low' },
      { value: 4, label: 'None' },
    ],
  },
  {
    id: 'daily_mood',
    title: 'How is your mood today?',
    nextText: 'Next: Sleep, Focus',
    options: [
      { value: 0, label: 'Very low' },
      { value: 1, label: 'Low' },
      { value: 2, label: 'Balanced' },
      { value: 3, label: 'Positive' },
      { value: 4, label: 'Great' },
    ],
  },
  {
    id: 'daily_sleep',
    title: 'How was your sleep quality last night?',
    nextText: 'Next: Focus',
    options: [
      { value: 0, label: 'Poor' },
      { value: 1, label: 'Restless' },
      { value: 2, label: 'Fair' },
      { value: 3, label: 'Good' },
      { value: 4, label: 'Excellent' },
    ],
  },
  {
    id: 'daily_focus',
    title: 'How was your mental clarity & focus today?',
    nextText: 'Almost done!',
    options: [
      { value: 0, label: 'Foggy' },
      { value: 1, label: 'Low' },
      { value: 2, label: 'Moderate' },
      { value: 3, label: 'Sharp' },
      { value: 4, label: 'Laser sharp' },
    ],
  },
];

export default function CheckInPage() {
  const { state, dispatch } = useApp();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedVal, setSelectedVal] = useState(null);
  const [done, setDone] = useState(false);
  const [serverStreak, setServerStreak] = useState(null);

  const q = CHECKIN_QUESTIONS[currentIdx];
  const total = CHECKIN_QUESTIONS.length;
  const isLast = currentIdx === total - 1;

  const selectOption = async (opt) => {
    setSelectedVal(opt.value);
    const updated = { ...answers, [q.id]: opt };
    setAnswers(updated);

    // Auto move on after slight feedback delay
    setTimeout(async () => {
      if (isLast) {
        const log = {
          date: new Date().toISOString(),
          answers: updated,
          score: Object.values(updated).reduce((s, a) => s + (a?.value || 0), 0),
        };
        dispatch(addDailyLog(log));
        const newLocalStreak = calculateStreak([...state.dailyLogs, log]);
        dispatch(setStreak(newLocalStreak));

        if (isAuthenticated) {
          try {
            const data = await checkinAPI.submitDaily({
              energyScore: updated.daily_energy?.value ?? 3,
              fatigueScore: updated.daily_fatigue?.value ?? 3,
              moodScore: updated.daily_mood?.value ?? 3,
              sleepScore: updated.daily_sleep?.value ?? 3,
              focusScore: updated.daily_focus?.value ?? 3,
            });
            if (data?.streak) {
              setServerStreak(data.streak);
              dispatch(setStreak(data.streak.current_streak));
              dispatch({ type: 'SET_SERVER_STREAK', payload: data.streak });
            }
          } catch (e) {
            console.warn('Checkin sync error:', e);
          }
        }

        setDone(true);
      } else {
        setCurrentIdx(i => i + 1);
        setSelectedVal(null);
      }
    }, 280);
  };

  if (done) {
    const finalStreak = serverStreak?.current_streak || (state.streak > 0 ? state.streak : 1);
    return (
      <AuthGuard>
        <AppShell>
          <div className={styles.checkinPage}>
            <div className={styles.completionCard}>
              <h1 className={styles.compTitle}>Check-in Complete!</h1>
              <p className={styles.compSubtitle}>
                You&apos;re now on a {finalStreak}-day streak. Keep it going!
              </p>
              <div className={styles.streakPill}>
                <span>🔥</span>
                <span className={styles.streakNum}>{finalStreak} {finalStreak === 1 ? 'day' : 'days'}</span>
              </div>
              <div className={styles.compActions}>
                <button
                  type="button"
                  className={styles.viewProgressBtn}
                  onClick={() => router.push('/progress')}
                >
                  View progress
                </button>
                <button
                  type="button"
                  className={styles.backDashBtn}
                  onClick={() => router.push('/dashboard')}
                >
                  Back to dashboard
                </button>
              </div>
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppShell>
        <div className={styles.checkinPage}>
          <header className={styles.header}>
            <h1 className={styles.title}>Daily check-in</h1>
            <p className={styles.subtitle}>One tap per question. It moves on by itself.</p>
          </header>

          <div className={styles.progressWrap}>
            <p className={styles.counterText}>
              Question {currentIdx + 1} of {total}
            </p>
            <div className={styles.segmentedTrack}>
              {CHECKIN_QUESTIONS.map((item, idx) => (
                <span
                  key={item.id}
                  className={`${styles.segmentDash} ${idx <= currentIdx ? styles.dashActive : ''}`}
                />
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.questionText}>{q.title}</h2>

            <div className={styles.ratingRow}>
              {q.options.map((opt) => {
                const isSelected = selectedVal === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.ratingButton} ${isSelected ? styles.ratingActive : ''}`}
                    onClick={() => selectOption(opt)}
                  >
                    <span className={styles.ratingNumber}>{opt.value}</span>
                    <span className={styles.ratingLabel}>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <p className={styles.nextHint}>{q.nextText}</p>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
