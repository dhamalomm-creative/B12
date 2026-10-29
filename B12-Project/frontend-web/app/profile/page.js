'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const { user: authUser, logout } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(state.user?.name || 'Om');
  const [editAge, setEditAge] = useState(state.user?.age || '18 to 24');
  const [editDiet, setEditDiet] = useState(state.user?.dietType || 'Vegetarian');

  const { user, guestName, riskResult, serverStreak, dailyLogs } = state;
  const displayName = user?.name || guestName || authUser?.name || 'Om';
  const email = authUser?.email || 'name@email.com';
  const streak = serverStreak?.current_streak ?? (state.streak || 6);
  const totalCheckins = serverStreak?.total_checkins ?? (dailyLogs.length || 24);
  const riskPct = riskResult?.percentage ?? 24;

  const handleSignOut = async () => {
    if (logout) {
      await logout();
    }
    dispatch({ type: 'RESET' });
    router.replace('/auth');
  };

  const handleSaveProfile = () => {
    dispatch({
      type: 'SET_USER',
      payload: {
        ...state.user,
        name: editName,
        age: editAge,
        dietType: editDiet,
      },
    });
    setIsEditing(false);
  };

  const formatAge = (a) => {
    if (a === '18-24' || a === '18 to 24') return '18 to 24';
    if (a === 'under18' || a === '<18') return 'Under 18';
    if (a === '25-40') return '25 to 40';
    if (a === '41-60') return '41 to 60';
    return a || '18 to 24';
  };

  const formatDiet = (d) => {
    if (!d) return 'Vegetarian';
    return d.charAt(0).toUpperCase() + d.slice(1);
  };

  const initialLetter = (displayName || 'O').trim().charAt(0).toUpperCase();

  return (
    <AppShell>
      <div className={styles.profilePage}>
        {/* User Identity Header */}
        <div className={styles.userHeader}>
          <div className={styles.avatarCircle}>
            <span>{initialLetter}</span>
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>{displayName}</h1>
            <p className={styles.userEmail}>{email}</p>
          </div>
        </div>

        {/* 3 Top Stat Cards */}
        <div className={styles.statCardsRow}>
          {/* Streak */}
          <div className={styles.statCardGreen}>
            <p className={styles.statLabel}>Streak</p>
            <h3 className={styles.statValue}>{streak} days</h3>
          </div>

          {/* Check-ins */}
          <div className={styles.statCardYellow}>
            <p className={styles.statLabel}>Check-ins</p>
            <h3 className={styles.statValue}>{totalCheckins}</h3>
          </div>

          {/* B12 score */}
          <div className={styles.statCardBlue}>
            <p className={styles.statLabel}>B12 score</p>
            <h3 className={styles.statValue}>{riskPct}%</h3>
            <p className={styles.statFoot}>Low risk</p>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className={styles.detailsCard}>
          <h3 className={styles.detailsTitle}>Profile details</h3>

          {isEditing ? (
            <div className={styles.editForm}>
              <div className={styles.editRow}>
                <label className={styles.editLabel}>Name</label>
                <input
                  type="text"
                  className={styles.editInput}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>

              <div className={styles.editRow}>
                <label className={styles.editLabel}>Age range</label>
                <input
                  type="text"
                  className={styles.editInput}
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                />
              </div>

              <div className={styles.editRow}>
                <label className={styles.editLabel}>Diet</label>
                <input
                  type="text"
                  className={styles.editInput}
                  value={editDiet}
                  onChange={(e) => setEditDiet(e.target.value)}
                />
              </div>

              <div className={styles.editActions}>
                <button
                  type="button"
                  className={styles.saveProfileBtn}
                  onClick={handleSaveProfile}
                >
                  Save changes
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Name</span>
                <span className={styles.detailValue}>{displayName}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Email</span>
                <span className={styles.detailValue}>{email}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Age range</span>
                <span className={styles.detailValue}>{formatAge(user?.age)}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Diet</span>
                <span className={styles.detailValue}>{formatDiet(user?.dietType)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons Row */}
        {!isEditing && (
          <div className={styles.actionButtonsRow}>
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => setIsEditing(true)}
            >
              Edit profile
            </button>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={() => alert('Password reset link sent to ' + email)}
            >
              Change password
            </button>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
