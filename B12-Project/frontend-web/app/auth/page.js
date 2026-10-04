'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PrimaryButton } from '@/components/UI';
import styles from './page.module.css';

export default function AuthPage() {
  const { register, login, isLoading, error, clearError } = useAuth();
  const router = useRouter();

  const [mode,       setMode]       = useState('login');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [localError, setLocalError] = useState('');
  const [dupEmail,   setDupEmail]   = useState(false);
  const [noAccount,  setNoAccount]  = useState(false);

  const toggle = () => { setMode(m => m==='login'?'register':'login'); setLocalError(''); setDupEmail(false); setNoAccount(false); clearError(); };

  const hasMinLen = password.length >= 8;
  const hasUpper  = /[A-Z]/.test(password);
  const hasLower  = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasMatch  = Boolean(confirmPw && password === confirmPw);
  const criteriaScore = [hasMinLen, hasUpper, hasLower, hasNumber].filter(Boolean).length;

  const validate = () => {
    if (!email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email';
    if (mode === 'register') {
      if (password.length < 8) return 'Password must be at least 8 characters';
      if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter (A-Z)';
      if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter (a-z)';
      if (!/[0-9]/.test(password)) return 'Password must contain at least one number (0-9)';
      if (password !== confirmPw) return 'Passwords do not match';
    } else {
      if (!password) return 'Password is required';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(''); setDupEmail(false); setNoAccount(false); clearError();
    const ve = validate();
    if (ve) { setLocalError(ve); return; }

    let result;
    if (mode === 'register') {
      result = await register(email.trim().toLowerCase(), password);
      if (!result?.success) {
        const msg = (result?.error||'').toLowerCase();
        if (msg.includes('already')||msg.includes('registered')||msg.includes('exists')) { setDupEmail(true); setLocalError('This email is already registered.'); }
        else setLocalError(result?.error||'Registration failed. Please try again.');
        return;
      }
    } else {
      result = await login(email.trim().toLowerCase(), password);
      if (!result?.success) {
        const msg = (result?.error||'').toLowerCase();
        if (msg.includes('not found')||msg.includes('no account')||msg.includes("doesn't exist")||msg.includes('does not exist')) { setNoAccount(true); setLocalError("This account doesn't exist."); }
        else if (msg.includes('password')||msg.includes('incorrect')||msg.includes('invalid')) setLocalError('Your password is incorrect.');
        else setLocalError(result?.error||'Login failed. Please check your details.');
        return;
      }
    }
    if (result?.success) router.replace('/dashboard');
  };

  const displayError = localError || error;

  return (
    <div className={styles.page}>
      {/* ── Left Panel — Brand + DNA Visual ── */}
      <div className={styles.leftPanel}>
        <div className={styles.leftContent}>
          {/* Logo */}
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className={styles.logoName}>Clinical Luminary</span>
          </div>

          {/* Main hero text */}
          <div className={styles.heroText}>
            <p className={styles.heroKicker}>PRECISION MEDICINE DEFINED BY DATA</p>
            <h1 className={styles.heroTitle}>
              Access the global<br />
              <span className={styles.heroAccent}>B12 Research Node</span>
            </h1>
            <p className={styles.heroDesc}>
              Secure verification required for genomic data sequencing and patient analytics.
            </p>
          </div>

          {/* DNA Visualization */}
          <div className={styles.dnaViz}>
            <svg className={styles.dnaSvg} viewBox="0 0 320 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* DNA helix strands */}
              {[0,1,2,3,4,5,6,7,8].map(i => {
                const y = 40 + i * 40;
                const offset = Math.sin(i * 0.8) * 80;
                return (
                  <g key={i}>
                    <line x1={160 + offset} y1={y} x2={160 - offset} y2={y}
                      stroke={i % 2 === 0 ? '#58F5D1' : '#3ADFFA'}
                      strokeWidth="1.5" strokeOpacity="0.6" />
                    <circle cx={160 + offset} cy={y} r="5" fill={i % 2 === 0 ? '#58F5D1' : '#3ADFFA'} opacity="0.8" />
                    <circle cx={160 - offset} cy={y} r="5" fill={i % 2 === 0 ? '#1CD0AD' : '#1AD0EB'} opacity="0.8" />
                  </g>
                );
              })}
              {/* Helix curves */}
              <path d="M160 40 Q240 80 160 120 Q80 160 160 200 Q240 240 160 280 Q80 320 160 360"
                stroke="#58F5D1" strokeWidth="2" strokeOpacity="0.35" fill="none" />
              <path d="M160 40 Q80 80 160 120 Q240 160 160 200 Q80 240 160 280 Q240 320 160 360"
                stroke="#3ADFFA" strokeWidth="2" strokeOpacity="0.35" fill="none" />
              {/* Glow circles */}
              <circle cx="160" cy="200" r="60" fill="rgba(88,245,209,0.06)" />
              <circle cx="160" cy="200" r="100" fill="rgba(88,245,209,0.03)" />
            </svg>
          </div>

          {/* Stats row */}
          <div className={styles.statStrip}>
            {[
              { val: '99.8%', label: 'DATA ACCURACY' },
              { val: '47K+', label: 'PATIENTS' },
              { val: '24/7', label: 'MONITORING' },
            ].map(s => (
              <div key={s.label} className={styles.stripStat}>
                <span className={styles.stripVal}>{s.val}</span>
                <span className={styles.stripLbl}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel — Auth Form ── */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrap}>
          <p className={styles.portalLabel}>PORTAL ACCESS</p>
          <h2 className={styles.formTitle}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className={styles.formSubtitle}>
            {mode === 'login'
              ? 'Please authenticate your clinical credentials.'
              : 'Begin your B12 health monitoring journey.'}
          </p>

          {displayError && (
            <div className="error-banner">
              <p>⚠️ {displayError}</p>
              {dupEmail  && <button type="button" className={styles.errorAction} onClick={() => { setMode('login'); setLocalError(''); setDupEmail(false); clearError(); }}>👉 Log in to existing account</button>}
              {noAccount && <button type="button" className={styles.errorAction} onClick={() => { setMode('register'); setLocalError(''); setNoAccount(false); clearError(); }}>✨ Create a new account instead</button>}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>EMAIL ADDRESS</label>
              <input
                id="auth-email"
                className={styles.fieldInput}
                type="email"
                placeholder="clinician@research.io"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>ACCESS KEY</label>
              <input
                id="auth-password"
                className={styles.fieldInput}
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode==='login'?'current-password':'new-password'}
              />
            </div>

            {mode === 'register' && (
              <div className={styles.criteriaBox}>
                <div className={styles.criteriaHeaderRow}>
                  <span className={styles.criteriaTitle}>ACCESS KEY CRITERIA</span>
                  <span className={`${styles.criteriaStrengthLabel} ${criteriaScore >= 4 ? styles.labelStrong : criteriaScore >= 2 ? styles.labelFair : styles.labelWeak}`}>
                    {password.length === 0 ? 'Requirements' : criteriaScore < 2 ? 'Weak' : criteriaScore < 4 ? 'Good' : 'Strong'}
                  </span>
                </div>
                <div className={styles.meterTrack}>
                  <div
                    className={`${styles.meterFill} ${
                      criteriaScore >= 4 ? styles.meterStrong : criteriaScore >= 2 ? styles.meterFair : styles.meterWeak
                    }`}
                    style={{ width: password.length === 0 ? '0%' : `${(criteriaScore / 4) * 100}%` }}
                  />
                </div>
                <div className={styles.criteriaGrid}>
                  <div className={`${styles.criteriaItem} ${hasMinLen ? styles.met : ''}`}>
                    <span className={styles.criteriaIcon}>{hasMinLen ? '✓' : '•'}</span>
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`${styles.criteriaItem} ${hasUpper ? styles.met : ''}`}>
                    <span className={styles.criteriaIcon}>{hasUpper ? '✓' : '•'}</span>
                    <span>One uppercase letter (A–Z)</span>
                  </div>
                  <div className={`${styles.criteriaItem} ${hasLower ? styles.met : ''}`}>
                    <span className={styles.criteriaIcon}>{hasLower ? '✓' : '•'}</span>
                    <span>One lowercase letter (a–z)</span>
                  </div>
                  <div className={`${styles.criteriaItem} ${hasNumber ? styles.met : ''}`}>
                    <span className={styles.criteriaIcon}>{hasNumber ? '✓' : '•'}</span>
                    <span>One number (0–9)</span>
                  </div>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>CONFIRM KEY</label>
                <input
                  id="auth-confirm"
                  className={styles.fieldInput}
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  autoComplete="new-password"
                />
                {confirmPw.length > 0 && (
                  <div className={`${styles.matchHint} ${hasMatch ? styles.matchSuccess : styles.matchFail}`}>
                    <span>{hasMatch ? '✓ Keys match' : '✕ Keys do not match yet'}</span>
                  </div>
                )}
              </div>
            )}

            {mode === 'login' && (
              <button type="button" className={styles.forgotBtn}>FORGOT KEY?</button>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading
                ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                : null}
              {mode === 'login' ? 'AUTHENTICATE →' : 'INITIALIZE ACCOUNT →'}
            </button>
          </form>

          <div className={styles.toggleRow}>
            <span className={styles.toggleText}>
              {mode === 'login' ? "New to the platform?" : "Already have access?"}
            </span>
            <button type="button" className={styles.toggleBtn} onClick={toggle}>
              {mode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          <div className={styles.formFooter}>
            <a href="#" className={styles.footerLink}>ETHICS PROTOCOL</a>
            <span className={styles.footerDot}>·</span>
            <a href="#" className={styles.footerLink}>PRIVACY POLICY</a>
            <span className={styles.footerDot}>·</span>
            <a href="#" className={styles.footerLink}>DATA COMPLIANCE</a>
          </div>
        </div>
      </div>
    </div>
  );
}
