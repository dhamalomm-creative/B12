'use client';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const { user: authUser, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const { user, guestName, riskResult, serverStreak, dailyLogs } = state;
  const displayName  = user?.name || guestName || authUser?.name || 'Researcher';
  const email        = authUser?.email || '';
  const streak       = serverStreak?.current_streak ?? state.streak;
  const totalCheckins = serverStreak?.total_checkins ?? dailyLogs.length;

  const handleLogout = async () => {
    await logout();
    dispatch({ type: 'RESET' });
    router.replace('/auth');
  };

  const DIET_LABELS = { vegan: '🌿 Vegan', vegetarian: '🥗 Vegetarian', pescatarian: '🐟 Pescatarian', omnivore: '🍽️ Omnivore' };

  return (
    <AppShell>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <p className={styles.topLabel}>PATIENT PROFILE</p>
            <h1 className={styles.title}>Profile</h1>
          </div>
        </header>

        <div className={styles.mainGrid}>
          {/* Left — Avatar + Stats */}
          <div className={styles.leftCol}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatar}>{(displayName).trim().charAt(0).toUpperCase()}</div>
              <div className={styles.avatarGlow} />
            </div>
            <h2 className={styles.name}>{displayName}</h2>
            {email && <p className={styles.email}>{email}</p>}

            <div className={styles.statsRow}>
              {[
                { emoji: '🔥', num: streak,        lbl: 'Day Streak' },
                { emoji: '📝', num: totalCheckins, lbl: 'Total Check-ins' },
                { emoji: '🎯', num: riskResult ? `${riskResult.percentage}%` : '—', lbl: 'B12 Score' },
              ].map(s => (
                <div key={s.lbl} className={styles.statBox}>
                  <span className={styles.statEmoji}>{s.emoji}</span>
                  <div className={styles.statInfo}>
                    <span className={styles.statNum}>{s.num}</span>
                    <span className={styles.statLbl}>{s.lbl}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Details + Actions */}
          <div className={styles.rightCol}>
            <div className={styles.section}>
              <p className={styles.sectionLabel}>Profile Details</p>
              <div className={styles.card}>
                {[
                  { label: 'Age Range',  val: user?.age    || '—' },
                  { label: 'Gender',     val: user?.gender  ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '—' },
                  { label: 'Diet Type',  val: DIET_LABELS[user?.dietType] || user?.dietType || '—' },
                  { label: 'Risk Level', val: riskResult?.level || '—' },
                ].map(({ label, val }) => (
                  <div key={label} className={styles.row}>
                    <span className={styles.rowLabel}>{label}</span>
                    <span className={styles.rowVal}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <p className={styles.sectionLabel}>Quick Actions</p>
              <div className={styles.card}>
                <button className={styles.actionRow} onClick={() => router.push('/questionnaire')}>
                  <span>📋 Retake Assessment</span><span className={styles.arrow}>→</span>
                </button>
                <div className={styles.divider} />
                <button className={styles.actionRow} onClick={() => router.push('/bmi')}>
                  <span>⚖️ BMI Analysis</span><span className={styles.arrow}>→</span>
                </button>
                <div className={styles.divider} />
                <button className={styles.actionRow} onClick={() => riskResult ? router.push('/results') : router.push('/questionnaire')}>
                  <span>📊 View Full Report</span><span className={styles.arrow}>→</span>
                </button>
                <div className={styles.divider} />
                <button className={styles.actionRow} onClick={() => router.push('/progress')}>
                  <span>📈 Progress Analytics</span><span className={styles.arrow}>→</span>
                </button>
              </div>
            </div>

            {isAuthenticated && (
              <div className={styles.section}>
                <button className={styles.logoutBtn} onClick={handleLogout}>SIGN OUT</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
