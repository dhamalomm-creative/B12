'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import styles from './page.module.css';

function AuthForm() {
  const { register, login, isLoading, isAuthenticated, error, clearError } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { state } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [localError, setLocalError] = useState('');
  const [dupEmail, setDupEmail] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !submitting) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, submitting, router]);

  const hasPendingResult = !!(state.pendingAnswers?.length && state.riskResult);
  const pwChecks = [
    { ok: password.length >= 8, label: '8+ characters' },
    { ok: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { ok: /[0-9]/.test(password), label: 'One number' },
  ];

  useEffect(() => {
    const requestedMode = searchParams.get('mode');
    if (requestedMode === 'login') {
      setMode('login');
    } else if (requestedMode === 'register') {
      setMode('register');
    }
  }, [searchParams]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setLocalError('');
    setDupEmail(false);
    clearError();
  };

  const validate = () => {
    if (!email.trim()) return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email address.';
    if (mode === 'register') {
      if (password.length < 8) return 'Password must be at least 8 characters.';
      if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter (A–Z).';
      if (!/[0-9]/.test(password)) return 'Password must contain at least one number (0–9).';
      if (!agreedToTerms) return 'Please agree to the Terms and Privacy Policy to continue.';
    } else {
      if (!password) return 'Password is required.';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setDupEmail(false);
    clearError();

    const validationMsg = validate();
    if (validationMsg) {
      setLocalError(validationMsg);
      return;
    }

    let result;
    setSubmitting(true);
    if (mode === 'register') {
      const extraProfile = {
        name: state.user?.name || state.guestName || undefined,
        age: state.user?.age ? parseInt(state.user.age, 10) : undefined,
        gender: state.user?.gender || undefined,
        dietType: state.user?.dietType || undefined,
      };
      result = await register(email.trim().toLowerCase(), password, extraProfile);
      if (!result?.success) {
        setSubmitting(false);
        const msg = (result?.error || '').toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          setDupEmail(true);
          setLocalError('This email is already registered.');
        } else {
          setLocalError(result?.error || 'Registration failed. Please try again.');
        }
        return;
      }
    } else {
      result = await login(email.trim().toLowerCase(), password);
      if (!result?.success) {
        setSubmitting(false);
        setLocalError(result?.error || 'Invalid email or password.');
        return;
      }
    }

    if (result?.success) {
      const u = result.user || {};
      if (result.syncedAssessment) {
        router.replace('/results?new=1');
      } else if (!u.age || !u.gender || !u.dietType) {
        router.replace('/onboarding?next=dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  };

  const displayError = localError || error;

  return (
    <div className={styles.splitPage}>
      {/* ── Left Half (Dark Green) ── */}
      <div className={styles.leftHalf}>
        <div className={styles.leftHeader}>
          <Link href="/" className={styles.leftBrand}>B12 Health Tracker</Link>
        </div>

        <div className={styles.leftContent}>
          <h1 className={styles.leftHeading}>
            Know your B12, before it slows you down.
          </h1>

          <ul className={styles.checkList}>
            <li className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>Free and private</span>
            </li>
            <li className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>Takes about 5 minutes</span>
            </li>
            <li className={styles.checkItem}>
              <span className={styles.checkIcon}>✓</span>
              <span>For education, not diagnosis</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Right Half (Warm Cream) ── */}
      <div className={styles.rightHalf}>
        {/* Top Right Toggle */}
        <div className={styles.topToggleWrap}>
          <div className={styles.togglePillContainer}>
            <button
              type="button"
              className={`${styles.togglePill} ${mode === 'login' ? styles.togglePillActive : ''}`}
              onClick={() => switchMode('login')}
            >
              Log in
            </button>
            <button
              type="button"
              className={`${styles.togglePill} ${mode === 'register' ? styles.togglePillActive : ''}`}
              onClick={() => switchMode('register')}
            >
              Create account
            </button>
          </div>
        </div>

        {/* Auth Form Container */}
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>
            {mode === 'register' ? 'Create your account' : 'Log in to your account'}
          </h2>

          {hasPendingResult && mode === 'register' && (
            <div className={styles.infoBox}>
              Your {state.riskResult.percentage}% risk score will be saved to your new account.
            </div>
          )}

          {displayError && (
            <div className={styles.errorBox} role="alert">
              <p>{displayError}</p>
              {dupEmail && (
                <button
                  type="button"
                  className={styles.errorSwitchBtn}
                  onClick={() => switchMode('login')}
                >
                  Log in to existing account →
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={styles.inputField}
                placeholder="name@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="password">Password</label>
              <div className={styles.passwordWrap}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={styles.inputField}
                  placeholder={mode === 'register' ? 'Create a password' : 'Your password'}
                  value={password}
                  maxLength={128}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  className={styles.showPwBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {mode === 'register' && (
                <ul className={styles.pwChecks} aria-label="Password requirements">
                  {pwChecks.map((c) => (
                    <li key={c.label} className={c.ok ? styles.pwOk : ''}>
                      <span aria-hidden="true">{c.ok ? '✓' : '○'}</span> {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {mode === 'register' && (
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkboxInput}
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span className={styles.checkboxText}>
                  I agree to the <Link href="/terms" className={styles.legalLink}>Terms</Link> and <Link href="/privacy" className={styles.legalLink}>Privacy Policy</Link>
                </span>
              </label>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting
                ? (mode === 'register' ? 'Creating account…' : 'Logging in…')
                : mode === 'register'
                ? 'Create account'
                : 'Log in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className={styles.loadingWrap}>Loading…</div>}>
      <AuthForm />
    </Suspense>
  );
}
