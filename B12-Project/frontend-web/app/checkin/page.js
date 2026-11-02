'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, setStreak } from '@/context/AppContext';
import { checkinAPI } from '@/services/api';
import { localISODate } from '@/utils/riskCalculator';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';
import styles from './page.module.css';

// Values sent to the API (shared with the Android app):
//   energy / mood / sleep / focus: 0 = very poor … 4 = excellent
//   fatigue:                       0 = none      … 4 = severe
const CHECKIN_QUESTIONS = [
  {
    id: 'energyScore',
    title: 'How is your energy today?',
    icon: '⚡',
    options: [
      { value: 0, label: 'Very low', emoji: '🪫' },
      { value: 1, label: 'Low', emoji: '😔' },
      { value: 2, label: 'Okay', emoji: '😐' },
      { value: 3, label: 'Good', emoji: '🙂' },
      { value: 4, label: 'Great', emoji: '🔋' },
    ],
  },
  {
    id: 'fatigueScore',
    title: 'How tired or fatigued do you feel?',
    icon: '😴',
    options: [
      { value: 4, label: 'Exhausted', emoji: '😫' },
      { value: 3, label: 'Very tired', emoji: '🥱' },
      { value: 2, label: 'Somewhat', emoji: '😐' },
      { value: 1, label: 'A little', emoji: '🙂' },
      { value: 0, label: 'Not at all', emoji: '😄' },
    ],
  },
  {
    id: 'moodScore',
    title: 'How is your mood today?',
    icon: '🧠',
    options: [
      { value: 0, label: 'Very low', emoji: '😢' },
      { value: 1, label: 'Low', emoji: '😔' },
      { value: 2, label: 'Balanced', emoji: '😐' },
      { value: 3, label: 'Positive', emoji: '🙂' },
      { value: 4, label: 'Great', emoji: '😄' },
    ],
  },
  {
    id: 'sleepScore',
    title: 'How well did you sleep last night?',
    icon: '🌙',
    options: [
      { value: 0, label: 'Terrible', emoji: '😫' },
      { value: 1, label: 'Restless', emoji: '😔' },
      { value: 2, label: 'Fair', emoji: '😐' },
      { value: 3, label: 'Good', emoji: '🙂' },
      { value: 4, label: 'Excellent', emoji: '😴' },
    ],
  },
  {
    id: 'focusScore',
    title: 'How clear and focused is your mind?',
    icon: '🎯',
    options: [
      { value: 0, label: 'Foggy', emoji: '🌫️' },
      { value: 1, label: 'Low', emoji: '😔' },
      { value: 2, label: 'Moderate', emoji: '😐' },
      { value: 3, label: 'Sharp', emoji: '🙂' },
      { value: 4, label: 'Very sharp', emoji: '🎯' },
    ],
  },
];

const tipFor = (a) => {
  if ((a.fatigueScore ?? 0) >= 3 || (a.energyScore ?? 4) <= 1) {
    return 'Low energy today. If tiredness lasts more than two weeks, mention it to your doctor and ask about a B12 test.';
  }
  if ((a.sleepScore ?? 4) <= 1) {
    return 'Rough night. A consistent bedtime and less screen time in the last hour can help — poor sleep makes fatigue feel worse.';
  }
  if ((a.focusScore ?? 4) <= 1) {
    return 'Brain fog can have many causes, including low B12. Logging daily helps you spot whether it keeps coming back.';
  }
  return 'Nice work. Small daily logs add up — after a week you’ll start to see your own patterns on the Progress page.';
};

// API row (snake_case) → form answers (camelCase)
const answersFromRow = (row) => ({
  energyScore: row.energy_score,
  fatigueScore: row.fatigue_score,
  moodScore: row.mood_score,
  sleepScore: row.sleep_score,
  focusScore: row.focus_score,
});

export default function CheckInPage() {
  const { dispatch } = useApp();
  const router = useRouter();

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState('');
  // loading → asking → review → saving → done
  // Once today's check-in exists the page is locked on the 'done' summary; the only
  // way back into the questions is "Edit today's check-in" (mode 'edit' → PUT).
  const [phase, setPhase] = useState('loading');
  const [mode, setMode] = useState('new'); // new | edit
  const [headline, setHeadline] = useState('');
  const [error, setError] = useState('');
  const [streak, setStreakState] = useState(null);
  const [saved, setSaved] = useState(null); // today's saved entry, restored on "Cancel"
  const startedAt = useRef(Date.now());
  const advanceTimer = useRef(null);

  const lockOnEntry = (row, title) => {
    const a = answersFromRow(row);
    setAnswers(a);
    setNotes(row.notes || '');
    setSaved({ answers: a, notes: row.notes || '' });
    setHeadline(title);
    setMode('new');
    setPhase('done');
  };

  // Has the user already checked in today? If so, lock the page on today's entry.
  useEffect(() => {
    checkinAPI.getHistory(2)
      .then((d) => {
        if (d?.streak) setStreakState(d.streak);
        const todays = (d?.logs || []).find((l) => l.checkin_date === localISODate());
        if (todays) lockOnEntry(todays, "You've checked in today");
        else setPhase('asking');
      })
      // Can't tell — show the form; the server still refuses a second check-in.
      .catch(() => setPhase('asking'));
    return () => clearTimeout(advanceTimer.current);
  }, []);

  const startEdit = () => {
    setError('');
    setMode('edit');
    setIdx(0);
    setPhase('review'); // start on the review list so one answer can be changed quickly
  };

  const cancelEdit = () => {
    if (saved) { setAnswers(saved.answers); setNotes(saved.notes); }
    setMode('new');
    setError('');
    setPhase('done');
  };

  const q = CHECKIN_QUESTIONS[idx];
  const total = CHECKIN_QUESTIONS.length;

  const select = (opt) => {
    if (phase !== 'asking') return;
    setAnswers((prev) => ({ ...prev, [q.id]: opt.value }));
    clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      // While editing, each changed answer goes straight back to the review list.
      if (mode === 'edit') setPhase('review');
      else if (idx < total - 1) setIdx((i) => i + 1);
      else setPhase('review');
    }, 260);
  };

  const back = () => {
    clearTimeout(advanceTimer.current);
    if (phase === 'review') { setPhase('asking'); setIdx(total - 1); return; }
    if (idx > 0) setIdx((i) => i - 1);
  };

  const save = async () => {
    setError('');
    setPhase('saving');
    const payload = {
      ...answers,
      notes: notes.trim() || null,
      durationSeconds: Math.min(3600, Math.round((Date.now() - startedAt.current) / 1000)),
      localDate: localISODate(),
    };
    try {
      const data = mode === 'edit'
        ? await checkinAPI.updateDaily(payload)
        : await checkinAPI.submitDaily(payload);
      if (data?.streak) {
        setStreakState(data.streak);
        dispatch(setStreak(data.streak));
      }
      lockOnEntry(data.checkin, mode === 'edit' ? 'Check-in updated' : 'Check-in saved');
    } catch (err) {
      // Checked in from another tab/device meanwhile — show that entry instead.
      if (err?.data?.code === 'ALREADY_CHECKED_IN' && err.data.checkin) {
        lockOnEntry(err.data.checkin, "You've already checked in today");
        return;
      }
      setError(err.message || 'Could not save your check-in. Please try again.');
      setPhase('review');
    }
  };

  if (phase === 'loading') {
    return (
      <AuthGuard>
        <AppShell>
          <div className={styles.checkinPage} aria-busy="true">
            <p className={styles.subtitle}>Loading today&apos;s check-in…</p>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  if (phase === 'done') {
    const current = streak?.current_streak || 1;
    return (
      <AuthGuard>
        <AppShell>
          <div className={styles.checkinPage}>
            <div className={styles.completionCard}>
              <div className={styles.doneIcon} aria-hidden="true">✓</div>
              <h1 className={styles.compTitle}>{headline}</h1>
              <p className={styles.lockedNote}>Your next check-in opens tomorrow.</p>
              <div className={styles.streakPill}>
                <span aria-hidden="true">🔥</span>
                <span>{current}-day streak</span>
              </div>
              <div className={styles.summaryRow}>
                {CHECKIN_QUESTIONS.map((cq) => {
                  const opt = cq.options.find((o) => o.value === answers[cq.id]);
                  return (
                    <div key={cq.id} className={styles.summaryItem}>
                      <span aria-hidden="true">{opt?.emoji}</span>
                      <small>{cq.icon} {opt?.label}</small>
                    </div>
                  );
                })}
              </div>
              {notes && <p className={styles.savedNotes}>📝 {notes}</p>}
              <p className={styles.tip}>{tipFor(answers)}</p>
              <div className={styles.compActions}>
                <button type="button" className={styles.backDashBtn} onClick={startEdit}>
                  ✏️ Edit today&apos;s check-in
                </button>
                <button type="button" className={styles.viewProgressBtn} onClick={() => router.push('/progress')}>
                  View my trends
                </button>
                <button type="button" className={styles.backDashBtn} onClick={() => router.push('/dashboard')}>
                  Back to dashboard
                </button>
              </div>
            </div>
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  const isReview = phase === 'review' || phase === 'saving';

  return (
    <AuthGuard>
      <AppShell>
        <div className={styles.checkinPage}>
          <header className={styles.header}>
            <h1 className={styles.title}>{mode === 'edit' ? "Edit today's check-in" : 'Daily check-in'}</h1>
            <p className={styles.subtitle}>
              {mode === 'edit'
                ? 'Change any answer, then save. Your streak stays the same.'
                : 'Five taps, about 30 seconds. Answer for how you feel today.'}
            </p>
          </header>

          <div className={styles.progressWrap}>
            <p className={styles.counterText}>
              {isReview ? 'Review' : `Question ${idx + 1} of ${total}`}
            </p>
            <div className={styles.segmentedTrack}>
              {CHECKIN_QUESTIONS.map((item, i) => (
                <span
                  key={item.id}
                  className={`${styles.segmentDash} ${(isReview || i <= idx) ? styles.dashActive : ''}`}
                />
              ))}
            </div>
          </div>

          {!isReview ? (
            <div className={styles.card}>
              <h2 className={styles.questionText}>
                <span aria-hidden="true">{q.icon}</span> {q.title}
              </h2>
              <div className={styles.ratingRow} role="radiogroup" aria-label={q.title}>
                {q.options.map((opt) => {
                  const isSel = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={isSel}
                      className={`${styles.ratingButton} ${isSel ? styles.ratingActive : ''}`}
                      onClick={() => select(opt)}
                    >
                      <span className={styles.ratingEmoji} aria-hidden="true">{opt.emoji}</span>
                      <span className={styles.ratingLabel}>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className={styles.cardFooter}>
                <button type="button" className={styles.textBtn} onClick={back} disabled={idx === 0}>
                  ← Back
                </button>
                <span className={styles.nextHint}>Tap an answer to continue</span>
              </div>
            </div>
          ) : (
            <div className={styles.card}>
              <h2 className={styles.questionText}>{mode === 'edit' ? 'Tap an answer to change it' : 'Anything else today?'}</h2>
              <ul className={styles.reviewList}>
                {CHECKIN_QUESTIONS.map((cq, i) => {
                  const opt = cq.options.find((o) => o.value === answers[cq.id]);
                  return (
                    <li key={cq.id}>
                      <span>{cq.icon} {cq.title}</span>
                      <button type="button" className={styles.reviewAnswer} onClick={() => { setPhase('asking'); setIdx(i); }}>
                        {opt?.emoji} {opt?.label} <small>Edit</small>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <label htmlFor="notes" className={styles.notesLabel}>
                Notes <span>(optional — e.g. headache, skipped meals, started a supplement)</span>
              </label>
              <textarea
                id="notes"
                className={styles.notes}
                rows={3}
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="How was your day?"
              />
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.cardFooter}>
                {mode === 'edit'
                  ? <button type="button" className={styles.textBtn} onClick={cancelEdit} disabled={phase === 'saving'}>Cancel</button>
                  : <button type="button" className={styles.textBtn} onClick={back}>← Back</button>}
                <button type="button" className={styles.viewProgressBtn} onClick={save} disabled={phase === 'saving'}>
                  {phase === 'saving' ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save check-in'}
                </button>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}
