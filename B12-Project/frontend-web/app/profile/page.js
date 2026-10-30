'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { usersAPI } from '@/services/api';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';
import styles from './page.module.css';

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const { user: authUser, logout, updateUser } = useAuth();
  const router = useRouter();

  const { user, guestName, riskResult, serverStreak, dailyLogs } = state;
  const displayName = authUser?.name || user?.name || guestName || authUser?.email?.split('@')[0] || 'Friend';
  const email = authUser?.email || '—';
  const streak = serverStreak?.current_streak ?? state.streak ?? 0;
  const totalCheckins = serverStreak?.total_checkins ?? dailyLogs.length ?? 0;
  const hasAssessment = !!riskResult;
  const riskPct = hasAssessment ? (riskResult.percentage ?? 0) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editAge, setEditAge] = useState(user?.age || authUser?.age || '');
  const [editDiet, setEditDiet] = useState(user?.dietType || authUser?.dietType || 'vegetarian');

  // Change password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setEditName(authUser?.name || user?.name || '');
    setEditAge(authUser?.age || user?.age || '');
    setEditDiet(authUser?.dietType || user?.dietType || 'vegetarian');
  }, [authUser, user]);

  const handleSignOut = async () => {
    await logout();
    dispatch({ type: 'RESET' });
    router.replace('/auth?mode=login');
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    const parsedAge = parseInt(editAge);
    const validAge = !isNaN(parsedAge) && parsedAge > 0 && parsedAge <= 120 ? parsedAge : undefined;
    const cleanDiet = (editDiet || 'vegetarian').trim().toLowerCase();

    const profilePayload = {
      name: editName.trim(),
      ...(validAge ? { age: validAge } : {}),
      ...(cleanDiet ? { dietType: cleanDiet } : {}),
    };

    try {
      await usersAPI.updateProfile(profilePayload);
    } catch (e) {
      console.warn('Backend profile update note:', e.message);
    }

    dispatch({
      type: 'SET_USER',
      payload: {
        ...state.user,
        name: editName.trim(),
        age: editAge,
        dietType: cleanDiet,
      },
    });

    if (updateUser) {
      updateUser({
        name: editName.trim(),
        age: editAge,
        dietType: cleanDiet,
      });
    }

    setIsSaving(false);
    setIsEditing(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Current password is required.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      await usersAPI.changePassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Password successfully updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordMsg({ type: '', text: '' });
      }, 1800);
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const formatAge = (a) => {
    if (!a) return 'Not set';
    if (a === '18-24' || a === '18 to 24') return '18 to 24';
    if (a === 'under18' || a === '<18') return 'Under 18';
    if (a === '25-40') return '25 to 40';
    if (a === '41-60') return '41 to 60';
    if (a === '60+') return '60+';
    return String(a);
  };

  const formatDiet = (d) => {
    if (!d) return 'Not set';
    return d.charAt(0).toUpperCase() + d.slice(1);
  };

  const initialLetter = (displayName || 'U').trim().charAt(0).toUpperCase();

  return (
    <AuthGuard>
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
              <h3 className={styles.statValue}>{streak} {streak === 1 ? 'day' : 'days'}</h3>
              <p className={styles.statFoot}>{streak > 0 ? 'Active streak' : 'No streak yet'}</p>
            </div>

            {/* Check-ins */}
            <div className={styles.statCardYellow}>
              <p className={styles.statLabel}>Check-ins</p>
              <h3 className={styles.statValue}>{totalCheckins}</h3>
              <p className={styles.statFoot}>Total recorded</p>
            </div>

            {/* B12 score */}
            <div className={styles.statCardBlue}>
              <p className={styles.statLabel}>B12 score</p>
              <h3 className={styles.statValue}>
                {riskPct !== null ? `${riskPct}%` : 'N/A'}
              </h3>
              <p className={styles.statFoot}>
                {hasAssessment ? `${riskResult.level || 'Low'} risk` : 'Assessment pending'}
              </p>
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
                    placeholder="Your name"
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className={styles.editRow}>
                  <label className={styles.editLabel}>Age range or numeric age</label>
                  <input
                    type="text"
                    className={styles.editInput}
                    value={editAge}
                    placeholder="e.g. 24 or 18-24"
                    onChange={(e) => setEditAge(e.target.value)}
                  />
                </div>

                <div className={styles.editRow}>
                  <label className={styles.editLabel}>Diet</label>
                  <select
                    className={styles.editInput}
                    value={editDiet}
                    onChange={(e) => setEditDiet(e.target.value)}
                  >
                    <option value="vegan">Vegan</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="pescatarian">Pescatarian</option>
                    <option value="omnivore">Omnivore</option>
                  </select>
                </div>

                <div className={styles.editActions}>
                  <button
                    type="button"
                    className={styles.saveProfileBtn}
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
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
                  <span className={styles.detailLabel}>Age</span>
                  <span className={styles.detailValue}>{formatAge(authUser?.age || user?.age)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Diet</span>
                  <span className={styles.detailValue}>{formatDiet(authUser?.dietType || user?.dietType)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Box (when active) */}
          {showPasswordModal && (
            <div className={styles.detailsCard} style={{ borderLeft: '4px solid var(--primary)' }}>
              <h3 className={styles.detailsTitle}>Change password</h3>
              {passwordMsg.text && (
                <p style={{
                  fontSize: '13.5px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: passwordMsg.type === 'error' ? '#FCECE3' : '#E5EFE7',
                  color: passwordMsg.type === 'error' ? '#D95338' : '#2E7D4E',
                  fontWeight: 500,
                }}>
                  {passwordMsg.text}
                </p>
              )}
              <form onSubmit={handleChangePassword} className={styles.editForm}>
                <div className={styles.editRow}>
                  <label className={styles.editLabel}>Current password</label>
                  <input
                    type="password"
                    className={styles.editInput}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.editRow}>
                  <label className={styles.editLabel}>New password</label>
                  <input
                    type="password"
                    className={styles.editInput}
                    value={newPassword}
                    placeholder="At least 8 characters"
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.editRow}>
                  <label className={styles.editLabel}>Confirm new password</label>
                  <input
                    type="password"
                    className={styles.editInput}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.editActions}>
                  <button
                    type="submit"
                    className={styles.saveProfileBtn}
                    disabled={savingPassword}
                  >
                    {savingPassword ? 'Updating…' : 'Update password'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordMsg({ type: '', text: '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

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
                onClick={() => setShowPasswordModal(prev => !prev)}
              >
                {showPasswordModal ? 'Close password form' : 'Change password'}
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
    </AuthGuard>
  );
}
