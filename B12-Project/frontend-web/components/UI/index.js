'use client';
import { useEffect, useState } from 'react';
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
          <div key={t.id} className={`${styles.toast} ${styles[t.type] || ''}`}>
            {type === 'success' ? '✓ ' : 'ℹ '}{t.msg}
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

export function ProgressBar({ progress, total, color }) {
  const pct = Math.min(100, Math.round((progress / total) * 100));
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

export function RiskGauge({ percentage = 24, level = 'Low', className = '' }) {
  // Clamp between 5% and 95% for the circle marker
  const markerPos = Math.min(95, Math.max(5, percentage));
  return (
    <div className={`risk-gauge-container ${className}`} style={{ width: '100%' }}>
      <div className="risk-gauge-track">
        <div className="risk-gauge-marker" style={{ left: `${markerPos}%` }} />
      </div>
    </div>
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
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '16px',
      background: 'var(--bg)',
    }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontFamily: 'var(--font)' }}>Loading…</p>
    </div>
  );
}
