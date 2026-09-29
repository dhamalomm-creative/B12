'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, addDailyLog, setStreak } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { DAILY_CHECKIN } from '@/data/questions';
import { calculateStreak } from '@/utils/riskCalculator';
import { checkinAPI } from '@/services/api';
import { ProgressBar, PrimaryButton } from '@/components/UI';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

export default function CheckInPage() {
  const { state, dispatch } = useApp();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [answers,      setAnswers]      = useState({});
  const [done,         setDone]         = useState(false);
  const [serverStreak, setServerStreak] = useState(null);
  const [animKey,      setAnimKey]      = useState(0);

  const q      = DAILY_CHECKIN[currentIdx];
  const isLast = currentIdx === DAILY_CHECKIN.length - 1;

  const mapToServer = (all) => ({
    energyScore:  all.daily_energy  ? 4 - all.daily_energy.score  : 2,
    fatigueScore: all.daily_fatigue ? 4 - all.daily_fatigue.score : 2,
    moodScore:    all.daily_mood    ? 4 - all.daily_mood.score    : 2,
    sleepScore:   all.daily_sleep   ? 4 - all.daily_sleep.score   : 2,
    focusScore:   all.daily_dizziness ? (all.daily_dizziness.score === 3 ? 0 : 4) : 2,
  });

  const selectOption = async (opt) => {
    const updated = { ...answers, [q.id]: opt };
    setAnswers(updated);

    if (isLast) {
      const log = { date: new Date().toISOString(), answers: updated, score: Object.values(updated).reduce((s, a) => s + a.score, 0) };
      dispatch(addDailyLog(log));
      dispatch(setStreak(calculateStreak([...state.dailyLogs, log])));
      try {
        const data = await checkinAPI.submitDaily(mapToServer(updated));
        if (data?.streak) {
          setServerStreak(data.streak);
          dispatch(setStreak(data.streak.current_streak));
          dispatch({ type: 'SET_SERVER_STREAK', payload: data.streak });
        }
      } catch {}
      setDone(true);
    } else {
      setAnimKey(k => k + 1);
      setTimeout(() => setCurrentIdx(i => i + 1), 50);
    }
  };

  if (done) {
    const streak = serverStreak?.current_streak || state.streak + 1;
    const msgs = [
      { range: [1,3],   emoji: '🌱', msg: "Great start! Keep the habit going!" },
      { range: [4,7],   emoji: '🔥', msg: "One week strong! You're building a healthy habit!" },
      { range: [8,14],  emoji: '⭐', msg: "Two weeks in — you're on a roll!" },
      { range: [15,999],emoji: '🏆', msg: "Incredible consistency! You're a health champion!" },
    ];
    const cfg = msgs.find(m => streak >= m.range[0] && streak <= m.range[1]) || msgs[0];
    return (
      <AppShell>
        <div className={styles.completionPage}>
          <span className={styles.compEmoji}>{cfg.emoji}</span>
          <h1 className={styles.compTitle}>Check-in Complete!</h1>
          <p className={styles.compMsg}>{cfg.msg}</p>
          <div className={styles.streakBox}>
            <span style={{ fontSize: 40 }}>🔥</span>
            <span className={styles.streakNum}>{streak}</span>
            <span className={styles.streakLabel}>Day Streak</span>
          </div>
          <p className={styles.compNote}>Your responses have been saved. Come back tomorrow!</p>
          <PrimaryButton label="View My Progress →" onClick={() => router.push('/progress')} className={styles.compBtn} />
          <button className={styles.homeLink} onClick={() => router.push('/dashboard')}>Back to Home</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={() => router.back()}>✕</button>
          <span className={styles.headerTitle}>Daily check-in</span>
          <div style={{ width: 36 }} />
        </div>
        <div className={styles.progressWrap}>
          <ProgressBar progress={currentIdx + 1} total={DAILY_CHECKIN.length} color="var(--accent)" />
        </div>
        <div className={styles.body}>
          <div key={animKey} className={styles.qAnim}>
            <div className={styles.iconRing}><span className={styles.qIcon}>{q.icon}</span></div>
            <p className={styles.stepLabel}>Step {currentIdx + 1} of {DAILY_CHECKIN.length}</p>
            <h2 className={styles.qText}>{q.question}</h2>
            <div className={styles.options}>
              {q.options.map(opt => (
                <button key={opt.id} className={`${styles.optCard} ${answers[q.id]?.id === opt.id ? styles.optSelected : ''}`} onClick={() => selectOption(opt)}>
                  {opt.emoji && <div className={styles.optEmoji}><span>{opt.emoji}</span></div>}
                  <span className={styles.optLabel}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
