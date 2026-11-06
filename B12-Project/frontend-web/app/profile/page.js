'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp, setStreak, setRiskResult } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/LanguageProvider';
import { usersAPI, checkinAPI, questionnaireAPI, setToken } from '@/services/api';
import { normalizeServerResult } from '@/utils/riskCalculator';
import AppShell from '@/components/layout/AppShell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AuthGuard from '@/components/auth/AuthGuard';
import { toast } from '@/components/UI';
import styles from './page.module.css';

const DIETS = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'omnivore', label: 'Non-vegetarian' },
];
const GENDERS = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'other', label: 'Prefer not to say' },
];
const labelOf = (list, id) => list.find((x) => x.id === id)?.label || 'Not set';

const passwordProblems = (pw) => {
  if (pw.length < 8) return 'New password must be at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'New password needs at least one uppercase letter.';
  if (!/[0-9]/.test(pw)) return 'New password needs at least one number.';
  return '';
};

export default function ProfilePage() {
  const { t, rich, formatDate } = useI18n();
  const { state, dispatch } = useApp();
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', age: '', gender: '', dietType: '' });
  const [formError, setFormError] = useState('');

  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      age: user.age ? String(user.age) : '',
      gender: user.gender || '',
      dietType: user.dietType || '',
    });
  }, [user]);

  // Make sure stats are fresh even when this is the first page opened
  useEffect(() => {
    checkinAPI.getHistory(1).then((d) => { if (d?.streak) dispatch(setStreak(d.streak)); }).catch(() => {});
    questionnaireAPI.getLatest().then((d) => {
      if (d?.assessment) dispatch(setRiskResult(normalizeServerResult(d.assessment)));
    }).catch(() => {});
  }, [dispatch]);

  const displayName = user?.name || user?.email?.split('@')[0] || t('Your profile');
  const streak = state.serverStreak?.current_streak ?? 0;
  const risk = state.riskResult;

  const saveProfile = async (e) => {
    e.preventDefault();
    setFormError('');
    const ageNum = form.age ? parseInt(form.age, 10) : null;
    if (form.age && (Number.isNaN(ageNum) || ageNum < 1 || ageNum > 120)) {
      setFormError('Please enter an age between 1 and 120.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: form.name.trim(),
        ...(ageNum ? { age: ageNum } : {}),
        ...(form.gender ? { gender: form.gender } : {}),
        ...(form.dietType ? { dietType: form.dietType } : {}),
      });
      toast(t('Profile updated'), 'success');
      setEditing(false);
    } catch (err) {
      setFormError(err.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    const problem = passwordProblems(pw.next);
    if (!pw.current) { setPwMsg({ type: 'error', text: 'Enter your current password.' }); return; }
    if (problem) { setPwMsg({ type: 'error', text: problem }); return; }
    if (pw.next !== pw.confirm) { setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    setPwSaving(true);
    try {
      await usersAPI.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '', confirm: '' });
      setPwOpen(false);
      toast(t('Password updated'), 'success');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Could not update password.' });
    } finally {
      setPwSaving(false);
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');
    if (deleteConfirm.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Type DELETE to confirm.');
      return;
    }
    setDeleting(true);
    try {
      await usersAPI.deleteAccount(deletePw);
      // Wipe everything stored on this device, then hard-navigate (a full reload
      // guarantees no in-memory health data survives).
      setToken(null);
      try {
        localStorage.removeItem('b12_app_state');
        localStorage.removeItem('b12_questionnaire_progress');
      } catch { /* ignore */ }
      window.location.replace('/?deleted=1');
    } catch (err) {
      setDeleteError(err.message || 'Could not delete your account.');
      setDeleting(false);
    }
  };

  const signOut = async () => {
    await logout();
    router.replace('/auth?mode=login');
  };

  return (
    <AuthGuard>
      <AppShell>
        <div className={styles.page}>
          <header className={styles.identity}>
            <div className={styles.avatar} aria-hidden="true">{displayName.charAt(0).toUpperCase()}</div>
            <div>
              <h1 className={styles.name}>{displayName}</h1>
              <p className={styles.email}>{user?.email}</p>
            </div>
          </header>

          <div className={styles.stats}>
            <div className={`${styles.stat} ${styles.statGreen}`}>
              <p className={styles.statLabel}>{t('Streak')}</p>
              <p className={styles.statValue}>{t(streak === 1 ? '{n} day' : '{n} days', { n: streak })}</p>
            </div>
            <div className={`${styles.stat} ${styles.statBlue}`}>
              <p className={styles.statLabel}>{t('Latest B12 risk')}</p>
              <p className={styles.statValue}>{risk ? `${risk.percentage}%` : '—'}</p>
            </div>
            <div className={`${styles.stat} ${styles.statYellow}`}>
              <p className={styles.statLabel}>{t('Member since')}</p>
              <p className={styles.statValue}>
                {user?.createdAt ? formatDate(user.createdAt, { month: 'short', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>

          {/* Profile details */}
          <section className={styles.card} aria-labelledby="details-h">
            <div className={styles.cardHead}>
              <h2 id="details-h" className={styles.cardTitle}>{t('Profile details')}</h2>
              {!editing && (
                <button type="button" className={styles.linkBtn} onClick={() => setEditing(true)}>{t('Edit')}</button>
              )}
            </div>
            <p className={styles.cardSub}>{t('Used to personalise your questions and food suggestions.')}</p>

            {editing ? (
              <form className={styles.form} onSubmit={saveProfile}>
                <label className={styles.field}>
                  <span>{t('Name')}</span>
                  <input value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </label>
                <label className={styles.field}>
                  <span>{t('Age')}</span>
                  <input type="number" inputMode="numeric" min={1} max={120} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                </label>
                <label className={styles.field}>
                  <span>{t('Gender')}</span>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                    <option value="">{t('Select…')}</option>
                    {GENDERS.map((g) => <option key={g.id} value={g.id}>{t(g.label)}</option>)}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>{t('Diet')}</span>
                  <select value={form.dietType} onChange={(e) => setForm({ ...form, dietType: e.target.value })}>
                    <option value="">{t('Select…')}</option>
                    {DIETS.map((d) => <option key={d.id} value={d.id}>{t(d.label)}</option>)}
                  </select>
                </label>
                {formError && <p className={styles.error} role="alert">{t(formError)}</p>}
                <div className={styles.formActions}>
                  <button type="submit" className={styles.primaryBtn} disabled={saving}>{t(saving ? 'Saving…' : 'Save changes')}</button>
                  <button type="button" className={styles.ghostBtn} onClick={() => setEditing(false)} disabled={saving}>{t('Cancel')}</button>
                </div>
                <p className={styles.hint}>{t('Changing age, gender or diet updates the questions in your next assessment.')}</p>
              </form>
            ) : (
              <dl className={styles.details}>
                <div><dt>{t('Name')}</dt><dd>{user?.name || t('Not set')}</dd></div>
                <div><dt>{t('Email')}</dt><dd>{user?.email}</dd></div>
                <div><dt>{t('Age')}</dt><dd>{user?.age || t('Not set')}</dd></div>
                <div><dt>{t('Gender')}</dt><dd>{t(labelOf(GENDERS, user?.gender))}</dd></div>
                <div><dt>{t('Diet')}</dt><dd>{t(labelOf(DIETS, user?.dietType))}</dd></div>
              </dl>
            )}
          </section>

          {/* Language */}
          <section className={styles.card} aria-labelledby="language-h">
            <div className={styles.cardHead}>
              <h2 id="language-h" className={styles.cardTitle}>{t('Language')}</h2>
              <LanguageSwitcher />
            </div>
            <p className={styles.cardSub}>{t('Choose the language for this app. It is saved on this device.')}</p>
          </section>

          {/* Security */}
          <section className={styles.card} aria-labelledby="security-h">
            <div className={styles.cardHead}>
              <h2 id="security-h" className={styles.cardTitle}>{t('Password & security')}</h2>
              {!pwOpen && (
                <button type="button" className={styles.linkBtn} onClick={() => setPwOpen(true)}>{t('Change password')}</button>
              )}
            </div>
            {pwOpen && (
              <form className={styles.form} onSubmit={changePassword}>
                <label className={styles.field}>
                  <span>{t('Current password')}</span>
                  <input type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
                </label>
                <label className={styles.field}>
                  <span>{t('New password')}</span>
                  <input type="password" autoComplete="new-password" maxLength={128} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
                  <small>{t('8+ characters with an uppercase letter and a number.')}</small>
                </label>
                <label className={styles.field}>
                  <span>{t('Confirm new password')}</span>
                  <input type="password" autoComplete="new-password" maxLength={128} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
                </label>
                {pwMsg.text && <p className={pwMsg.type === 'error' ? styles.error : styles.success} role="alert">{t(pwMsg.text)}</p>}
                <div className={styles.formActions}>
                  <button type="submit" className={styles.primaryBtn} disabled={pwSaving}>{t(pwSaving ? 'Updating…' : 'Update password')}</button>
                  <button type="button" className={styles.ghostBtn} onClick={() => { setPwOpen(false); setPwMsg({ type: '', text: '' }); }}>{t('Cancel')}</button>
                </div>
              </form>
            )}
            <button type="button" className={styles.signOut} onClick={signOut}>{t('Sign out')}</button>
          </section>

          {/* Privacy */}
          <section className={styles.card} aria-labelledby="privacy-h">
            <h2 id="privacy-h" className={styles.cardTitle}>{t('Your data & privacy')}</h2>
            <p className={styles.cardSub}>
              {rich('Your health answers are private to your account and never sold. Read our {privacy} and {terms}.', {
                privacy: <Link href="/privacy">{t('Privacy Policy')}</Link>,
                terms: <Link href="/terms">{t('Terms')}</Link>,
              })}
            </p>
            {!deleteOpen ? (
              <button type="button" className={styles.dangerLink} onClick={() => setDeleteOpen(true)}>
                {t('Delete my account and data')}
              </button>
            ) : (
              <form className={styles.dangerZone} onSubmit={deleteAccount}>
                <p>
                  {t("This permanently deletes your account, assessments, check-ins and BMI history. This can't be undone.")}
                </p>
                <label className={styles.field}>
                  <span>{t('Your password')}</span>
                  <input type="password" autoComplete="current-password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} required />
                </label>
                <label className={styles.field}>
                  <span>{t('Type DELETE to confirm')}</span>
                  <input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} autoComplete="off" />
                </label>
                {deleteError && <p className={styles.error} role="alert">{t(deleteError)}</p>}
                <div className={styles.formActions}>
                  <button type="submit" className={styles.dangerBtn} disabled={deleting}>{t(deleting ? 'Deleting…' : 'Permanently delete')}</button>
                  <button type="button" className={styles.ghostBtn} onClick={() => { setDeleteOpen(false); setDeleteError(''); }}>{t('Cancel')}</button>
                </div>
              </form>
            )}
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
