'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { checkinAPI } from '@/services/api';
import { calculateStreak } from '@/utils/riskCalculator';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

const SCORE_LABELS = { 0: 'None', 1: 'Mild', 2: 'Moderate', 3: 'Often', 4: 'Severe' };

const METRICS = [
  { key: 'energy',  label: 'ENERGY INDEX',  color: '#58F5D1', unit: '' },
  { key: 'mood',    label: 'MOOD SIGNAL',   color: '#3ADFFA', unit: '' },
  { key: 'fatigue', label: 'FATIGUE LOAD',  color: '#FBBF24', unit: '' },
];

export default function ProgressPage() {
  const { state }         = useApp();
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const streak       = state.serverStreak?.current_streak ?? calculateStreak(state.dailyLogs);
  const totalCheckins = state.serverStreak?.total_checkins ?? state.dailyLogs.length;

  useEffect(() => {
    if (!isAuthenticated) {
      setHistory(buildLocalHistory(state.dailyLogs));
      setLoading(false);
      return;
    }
    checkinAPI.getHistory()
      .then(d => setHistory(d?.history?.slice(-14).map(h => ({
        date:    h.checkin_date?.slice(5),
        energy:  h.energy_score  ?? 0,
        mood:    h.mood_score    ?? 0,
        fatigue: h.fatigue_score ?? 0,
      })) || []))
      .catch(() => setHistory(buildLocalHistory(state.dailyLogs)))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  function buildLocalHistory(logs) {
    return logs.slice(-14).map(l => ({
      date:    new Date(l.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      energy:  l.answers?.daily_energy  ? 4 - l.answers.daily_energy.score  : 0,
      mood:    l.answers?.daily_mood    ? 4 - l.answers.daily_mood.score    : 0,
      fatigue: l.answers?.daily_fatigue ? 4 - l.answers.daily_fatigue.score : 0,
    }));
  }

  const avgEnergy = history.length
    ? Math.round(history.reduce((s, h) => s + (h.energy || 0), 0) / history.length)
    : 0;

  const CustomTooltip = ({ active, payload, label, color }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-ghost)',
        borderRadius: 'var(--radius-md)',
        padding: '10px 14px',
        fontSize: 'var(--fs-xs)',
        boxShadow: 'var(--shadow-float)',
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.8px', textTransform: 'uppercase', fontSize: 9 }}>{label}</p>
        <p style={{ color, fontWeight: 700 }}>{SCORE_LABELS[Math.round(payload[0].value)] || payload[0].value}</p>
      </div>
    );
  };

  return (
    <AppShell>
      <div className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <p className={styles.topLabel}>BIOLOGICAL SIGNAL ANALYSIS</p>
            <h1 className={styles.title}>Progress Analytics</h1>
          </div>
        </header>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <span className={styles.statEmoji}>🔥</span>
            <div className={styles.statInfo}>
              <span className={styles.statNum}>{streak}</span>
              <span className={styles.statLbl}>Day Streak</span>
            </div>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statEmoji}>📝</span>
            <div className={styles.statInfo}>
              <span className={styles.statNum}>{totalCheckins}</span>
              <span className={styles.statLbl}>Total Logs</span>
            </div>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statEmoji}>⚡</span>
            <div className={styles.statInfo}>
              <span className={styles.statNum}>{avgEnergy}</span>
              <span className={styles.statLbl}>Avg Energy</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        {loading ? (
          <div className={styles.loading}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
        ) : history.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyEmoji}>📊</span>
            <h2 className={styles.emptyTitle}>No data yet</h2>
            <p className={styles.emptySub}>Complete your first daily check-in to start seeing biological signal trends here.</p>
          </div>
        ) : (
          <div className={styles.charts}>
            {METRICS.map(({ key, label, color }) => (
              <div key={key} className={styles.chartCard}>
                <p className={styles.chartLabel}>{label}</p>
                <p className={styles.chartTitle}>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  <span className={styles.chartAccent} style={{ color }}>— Last {history.length} days</span>
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={history} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.20} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="1 4" stroke="rgba(63,73,85,0.15)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} tickFormatter={v => SCORE_LABELS[v] || v} width={52} />
                    <Tooltip content={<CustomTooltip color={color} />} />
                    <Area type="monotone" dataKey={key} stroke={color} strokeWidth={2}
                      fill={`url(#grad-${key})`}
                      dot={{ fill: color, r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: color, stroke: 'var(--bg)', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
