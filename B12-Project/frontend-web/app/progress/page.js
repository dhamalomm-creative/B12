'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { checkinAPI } from '@/services/api';
import { calculateStreak } from '@/utils/riskCalculator';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import AppShell from '@/components/layout/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';
import styles from './page.module.css';

export default function ProgressPage() {
  const { state, dispatch } = useApp();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const streak = state.serverStreak?.current_streak ?? calculateStreak(state.dailyLogs) ?? 0;
  const totalLogs = state.serverStreak?.total_checkins ?? state.dailyLogs.length ?? 0;

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) return;

    checkinAPI.getHistory(14)
      .then(d => {
        if (d?.logs && d.logs.length > 0) {
          const formatted = d.logs.map((h, i) => ({
            day: h.checkin_date ? new Date(h.checkin_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : `Day ${i + 1}`,
            energy: h.energy_score ?? 0,
            mood: h.mood_score ?? 0,
            fatigue: h.fatigue_score ?? 0,
          }));
          setHistory(formatted);
        } else {
          setHistory([]);
        }
      })
      .catch(() => {
        setHistory([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated]);

  const avgEnergy = useMemo(() => {
    if (!history.length) return '—';
    const sum = history.reduce((acc, cur) => acc + (cur.energy || 0), 0);
    return `${(sum / history.length).toFixed(1)} / 4`;
  }, [history]);

  return (
    <AuthGuard>
      <AppShell>
        <div className={styles.progressPage}>
          {/* Header */}
          <header className={styles.header}>
            <h1 className={styles.title}>Your progress</h1>
            <p className={styles.subtitle}>
              {history.length > 0 ? `Showing last ${history.length} logged days` : 'Track your daily check-in to see 14-day symptom trends'}
            </p>
          </header>

          {/* 3 Top Stat Cards */}
          <div className={styles.statCardsRow}>
            {/* Streak */}
            <div className={styles.statCardGreen}>
              <p className={styles.statLabel}>Streak</p>
              <h3 className={styles.statValue}>{streak} {streak === 1 ? 'day' : 'days'}</h3>
              <p className={styles.statFoot}>{streak > 0 ? 'Consecutive days' : 'No streak yet'}</p>
            </div>

            {/* Total logs */}
            <div className={styles.statCardYellow}>
              <p className={styles.statLabel}>Total logs</p>
              <h3 className={styles.statValue}>{totalLogs}</h3>
              <p className={styles.statFoot}>Check-ins recorded</p>
            </div>

            {/* Average energy */}
            <div className={styles.statCardBlue}>
              <p className={styles.statLabel}>Average energy</p>
              <h3 className={styles.statValue}>{avgEnergy}</h3>
              <p className={styles.statFoot}>Last 14 days</p>
            </div>
          </div>

          {/* If no check-in logs yet */}
          {!loading && history.length === 0 ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '36px 24px',
              textAlign: 'center',
              margin: '12px 0 28px',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                No daily check-ins recorded yet
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 20px', lineHeight: 1.5 }}>
                Take your first 30-second daily check-in to start tracking energy, mood, and fatigue patterns.
              </p>
              <button
                type="button"
                onClick={() => router.push('/checkin')}
                style={{
                  backgroundColor: 'var(--primary, #1E3A2B)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Start daily check-in
              </button>
            </div>
          ) : (
            /* 3 Side-by-Side Charts Row */
            <div className={styles.chartsGrid}>
              {/* Energy Chart (Green) */}
              <div className={styles.chartCard}>
                <h4 className={styles.chartTitle}>Energy</h4>
                <div className={styles.chartWrap}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5AB879" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#5AB879" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E8E2D5',
                            borderRadius: 8,
                            fontSize: 12,
                            padding: '4px 8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="energy"
                          stroke="#2E7D4E"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#energyGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Mood Chart (Blue) */}
              <div className={styles.chartCard}>
                <h4 className={styles.chartTitle}>Mood</h4>
                <div className={styles.chartWrap}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5A8AA8" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#5A8AA8" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E8E2D5',
                            borderRadius: 8,
                            fontSize: 12,
                            padding: '4px 8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="mood"
                          stroke="#3E657D"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#moodGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Fatigue Chart (Coral) */}
              <div className={styles.chartCard}>
                <h4 className={styles.chartTitle}>Fatigue</h4>
                <div className={styles.chartWrap}>
                  {mounted && (
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="fatigueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E76F51" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#E76F51" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E8E2D5',
                            borderRadius: 8,
                            fontSize: 12,
                            padding: '4px 8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="fatigue"
                          stroke="#C04A2D"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#fatigueGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pattern Alert Banner */}
          <div className={styles.patternAlert}>
            <h4 className={styles.alertTitle}>Health reminder</h4>
            <p className={styles.alertText}>
              Persistent fatigue, low energy, and mental fog are potential signs of vitamin B12 deficiency. If symptoms persist, consider consulting a medical professional.
            </p>
          </div>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
