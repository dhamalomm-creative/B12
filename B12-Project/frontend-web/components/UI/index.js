'use client';
import { useCallback, useEffect, useState } from 'react';
import styles from './Toast.module.css';

let addToastGlobal = null;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastGlobal = (msg, type = 'success') => {
      const id = Date.now();
      setToasts(t => [...t, { id, msg, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
    };
    return () => { addToastGlobal = null; };
  }, []);

  return (
    <>
      {children}
      <div className={styles.container}>
        {toasts.map(t => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            {t.type === 'success' ? '✅ ' : '⚠️ '}{t.msg}
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
      {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : null}
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

export function ProgressBar({ progress, total, color }) {
  const pct = Math.min(100, Math.round((progress / total) * 100));
  return (
    <div className="progress-bar-outer">
      <div
        className="progress-bar-fill"
        style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}

export function RiskBadge({ level }) {
  const cfg = {
    LOW:    { color: 'var(--risk-low)',    bg: 'var(--risk-bg-low)',    label: 'Lower concern' },
    MEDIUM: { color: 'var(--risk-medium)', bg: 'var(--risk-bg-medium)', label: 'Moderate attention' },
    HIGH:   { color: 'var(--risk-high)',   bg: 'var(--risk-bg-high)',   label: 'Higher attention' },
  };
  const c = cfg[level] || cfg.LOW;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 'var(--radius-full)',
      background: c.bg, border: `1px solid ${c.color}40`,
      fontSize: 'var(--fs-sm)', fontWeight: 700, color: c.color,
    }}>
      {level === 'LOW' ? '🟢' : level === 'MEDIUM' ? '🟡' : '🔴'} {c.label}
    </span>
  );
}

export function CategoryBadge({ icon, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 12px', borderRadius: 'var(--radius-full)',
      background: 'var(--tint-primary)', border: '1px solid var(--border-teal)',
      fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--primary-dark)',
      textTransform: 'uppercase', letterSpacing: '0.8px',
      marginBottom: 'var(--space-md)',
    }}>
      {icon} {label}
    </span>
  );
}

export function InsightCard({ text }) {
  return (
    <div style={{
      background: 'var(--tint-accent)', border: '1px solid var(--tint-accent-border)',
      borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
      marginTop: 'var(--space-md)',
    }}>
      <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        💡 {text}
      </p>
    </div>
  );
}

export function SectionHeader({ title }) {
  return <p className="section-header">{title}</p>;
}

export function DisclaimerStrip() {
  return (
    <div className="disclaimer-strip">
      🔬 For awareness only — not medical advice. Always consult a qualified healthcare professional.
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: 'var(--space-md)',
      background: 'var(--bg)',
    }}>
      <span style={{ fontSize: 48 }}>🧬</span>
      <span className="spinner" style={{ width: 32, height: 32 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font)' }}>Loading…</p>
    </div>
  );
}
