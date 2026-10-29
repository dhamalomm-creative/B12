'use client';
import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { checkinAPI } from '@/services/api';
import { calculateStreak } from '@/utils/riskCalculator';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

// 14 days of sample data matching the design
const SAMPLE_DATA = [
  { day: '1', energy: 2.2, mood: 2.4, fatigue: 2.8 },
  { day: '2', energy: 2.5, mood: 2.6, fatigue: 2.5 },
  { day: '3', energy: 2.3, mood: 2.2, fatigue: 2.9 },
  { day: '4', energy: 2.7, mood: 2.5, fatigue: 2.4 },
  { day: '5', energy: 3.0, mood: 2.8, fatigue: 2.1 },
  { day: '6', energy: 2.9, mood: 2.7, fatigue: 2.2 },
  { day: '7', energy: 3.2, mood: 2.9, fatigue: 1.9 },
  { day: '8', energy: 3.1, mood: 2.8, fatigue: 2.0 },
  { day: '9', energy: 3.3, mood: 3.0, fatigue: 1.8 },
  { day: '10', energy: 3.4, mood: 3.1, fatigue: 1.6 },
  { day: '11', energy: 3.2, mood: 3.0, fatigue: 1.9 },
  { day: '12', energy: 3.5, mood: 3.2, fatigue: 1.5 },
  { day: '13', energy: 3.3, mood: 3.1, fatigue: 1.7 },
  { day: '14', energy: 3.6, mood: 3.3, fatigue: 1.4 },
];

export default function ProgressPage() {
  const { state } = useApp();
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState(SAMPLE_DATA);
  const [mounted, setMounted] = useState(false);

  const streak = state.serverStreak?.current_streak ?? (calculateStreak(state.dailyLogs) || 6);
  const totalLogs = state.serverStreak?.total_checkins ?? (state.dailyLogs.length || 24);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated) return;
    checkinAPI.getHistory()
      .then(d => {
        if (d?.history && d.history.length > 0) {
          const formatted = d.history.slice(-14).map((h, i) => ({
            day: String(i + 1),
            energy: h.energy_score ?? 3.1,
            mood: h.mood_score ?? 3.0,
            fatigue: h.fatigue_score ?? 2.0,
          }));
          setHistory(formatted);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  return (
    <AppShell>
      <div className={styles.progressPage}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>Your progress</h1>
          <p className={styles.subtitle}>Last 14 days. Sample data.</p>
        </header>

        {/* 3 Top Stat Cards */}
        <div className={styles.statCardsRow}>
          {/* Streak */}
          <div className={styles.statCardGreen}>
            <p className={styles.statLabel}>Streak</p>
            <h3 className={styles.statValue}>{streak} days</h3>
            <p className={styles.statFoot}>Keep going</p>
          </div>

          {/* Total logs */}
          <div className={styles.statCardYellow}>
            <p className={styles.statLabel}>Total logs</p>
            <h3 className={styles.statValue}>{totalLogs}</h3>
            <p className={styles.statFoot}>Check-ins</p>
          </div>

          {/* Average energy */}
          <div className={styles.statCardBlue}>
            <p className={styles.statLabel}>Average energy</p>
            <h3 className={styles.statValue}>3.1 / 4</h3>
            <p className={styles.statFoot}>Last 14 days</p>
          </div>
        </div>

        {/* 3 Side-by-Side Charts Row */}
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

        {/* Pattern Alert Banner */}
        <div className={styles.patternAlert}>
          <h4 className={styles.alertTitle}>Pattern alert</h4>
          <p className={styles.alertText}>
            Fatigue was high on 3 of the last 7 days. If this continues, consider talking to a doctor.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
