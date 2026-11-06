'use client';
import { useEffect, useState } from 'react';
import { motion, useReducedMotionConfig } from 'framer-motion';
import { useI18n } from '@/i18n/LanguageProvider';
import styles from './Toast.module.css';

let addToastGlobal = null;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let counter = 0;
    addToastGlobal = (msg, type = 'success') => {
      counter += 1;
      const id = `${Date.now()}-${counter}`;
      setToasts(t => [...t.slice(-2), { id, msg, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };
    return () => { addToastGlobal = null; };
  }, []);

  return (
    <>
      {children}
      <div className={styles.container} role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type] || ''}`}>
            <span aria-hidden="true">{t.type === 'success' ? '✓' : t.type === 'error' ? '!' : 'ℹ'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function toast(msg, type = 'success') {
  if (addToastGlobal) addToastGlobal(msg, type);
}

// ─── Reusable UI Components ───────────────────────────────────────────────────

export function PrimaryButton({ label, onClick, disabled, loading, className = '', type = 'button', style }) {
  return (
    <button
      type={type}
      className={`btn-primary ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      style={style}
    >
      {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : null}
      {label}
    </button>
  );
}

export function SecondaryButton({ label, onClick, className = '', style }) {
  return (
    <button className={`btn-secondary ${className}`} onClick={onClick} style={style}>
      {label}
    </button>
  );
}

export function ProgressBar({ progress = 0, total = 1, color }) {
  const safeTotal = Number(total) || 1;
  const safeProgress = Number(progress) || 0;
  const pct = Math.min(100, Math.max(0, Math.round((safeProgress / safeTotal) * 100)));
  return (
    <div className="progress-bar-outer" style={{ height: 6, background: 'var(--border)', borderRadius: '9999px', overflow: 'hidden' }}>
      <div
        className="progress-bar-fill"
        style={{
          width: `${pct}%`,
          height: '100%',
          background: color || 'var(--primary)',
          borderRadius: '9999px',
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );
}

/**
 * Horizontal risk scale with a marker at `percentage`.
 * `animateIn`: 'mount' or 'view' sweeps the scale in and slides the marker to its value
 * (transform only); omit for a static gauge. Reduced motion always renders it static.
 */
export function RiskGauge({ percentage = 0, className = '', animateIn, delay = 0, duration = 0.8 }) {
  const { t } = useI18n();
  const reduce = useReducedMotionConfig();
  const num = Number(percentage);
  const safePct = isNaN(num) ? 0 : Math.min(100, Math.max(0, num));
  // Clamp between 5% and 95% for the circle marker
  const markerPos = Math.min(95, Math.max(5, safePct));
  const animated = !!animateIn && !reduce;
  const trigger = animateIn === 'view'
    ? { whileInView: 'show', viewport: { once: true, amount: 0.6 } }
    : { animate: 'show' };
  const ease = [0.22, 1, 0.36, 1];
  return (
    <motion.div
      className={`risk-gauge-container ${className}`}
      style={{ width: '100%' }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safePct)}
      aria-label={t('B12 risk score')}
      initial={animated ? 'hidden' : false}
      {...(animated ? trigger : { animate: 'show' })}
    >
      <div className="risk-gauge-track">
        <motion.div
          className="risk-gauge-bar"
          variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1 } }}
          transition={animated ? { duration: 0.4, delay, ease } : { duration: 0 }}
        />
        <motion.div
          className="risk-gauge-rail"
          variants={{ hidden: { x: '0%', opacity: 0 }, show: { x: `${markerPos}%`, opacity: 1 } }}
          transition={animated
            ? { x: { duration, delay: delay + 0.15, ease }, opacity: { duration: 0.2, delay: delay + 0.15 } }
            : { duration: 0.4, ease }}
        >
          <div className="risk-gauge-marker" />
        </motion.div>
      </div>
    </motion.div>
  );
}

export function RiskBadge({ level }) {
  const cfg = {
    LOW:    { color: '#3D8B57', bg: '#E5EFE7', label: 'Low risk' },
    MEDIUM: { color: '#D99B26', bg: '#FDF1D8', label: 'Medium risk' },
    HIGH:   { color: '#D95338', bg: '#FCECE3', label: 'High risk' },
  };
  const c = cfg[level] || cfg.LOW;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 14px', borderRadius: '9999px',
      background: c.bg,
      fontSize: '13px', fontWeight: 600, color: c.color,
    }}>
      {c.label}
    </span>
  );
}

export function CategoryBadge({ icon, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: '9999px',
      background: '#E1EDF7',
      fontSize: '12px', fontWeight: 600, color: '#2C4960',
      marginBottom: '12px',
    }}>
      {icon} {label}
    </span>
  );
}

export function InsightCard({ text }) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 20px',
      marginTop: '16px',
    }}>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {text}
      </p>
    </div>
  );
}

export function SectionHeader({ title }) {
  return <p className="section-header">{title}</p>;
}

export function DisclaimerStrip() {
  return (
    <div className="disclaimer-banner" style={{ marginTop: '16px' }}>
      This tool is for education and awareness. It does not provide a diagnosis. Please see a doctor for blood tests.
    </div>
  );
}

export function LoadingScreen() {
  const { t } = useI18n();
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '16px',
      background: 'var(--bg)',
    }}>
      <span className="spinner" style={{ width: 32, height: 32 }} aria-hidden="true" />
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'var(--font)' }} role="status">{t('Loading…')}</p>
    </div>
  );
}
