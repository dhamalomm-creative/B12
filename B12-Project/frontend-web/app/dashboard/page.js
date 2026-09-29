'use client';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, setServerInsights, setServerCheckins } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { calculateStreak } from '@/utils/riskCalculator';
import { insightsAPI, checkinAPI } from '@/services/api';
import { RiskBadge, DisclaimerStrip } from '@/components/UI';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

const MOTIVATIONS = [
  "Small daily check-ins add up to big clarity.",
  "Building a habit your future self will thank you for.",
  "Consistency turns data into insight.",
  "Stay curious about how you feel — the first step to care.",
];

/* Tiny radial gauge SVG */
function RingGauge({ value, max = 100, color = 'var(--primary)', size = 80 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const r = 32; const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(88,245,209,0.10)" strokeWidth="6" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
    </svg>
  );
}

export default function DashboardPage() {
  const { state, dispatch } = useApp();
  const { user: authUser, isAuthenticated } = useAuth();
  const router = useRouter();

  const { user, guestName, riskResult, dailyLogs, serverInsights, serverStreak, serverCheckinHistory } = state;
  const localStreak = useMemo(() => calculateStreak(dailyLogs), [dailyLogs]);
  const streak      = serverStreak?.current_streak ?? localStreak;
  const todayStr    = new Date().toISOString().split('T')[0];

  const checkedToday =
    serverStreak?.last_checkin_date === todayStr ||
    (serverCheckinHistory || []).some(l => l.checkin_date === todayStr) ||
    dailyLogs.some(l => new Date(l.date).toISOString().split('T')[0] === todayStr);

  const recentLogs = dailyLogs.slice(-7);
  const avgEnergy  = recentLogs.length
    ? Math.round(recentLogs.reduce((s, l) => { const e = l.answers?.daily_energy; return s + (e ? 5 - e.score : 3); }, 0) / recentLogs.length)
    : 0;

  const motivation   = MOTIVATIONS[new Date().getDay() % MOTIVATIONS.length];
  const displayName  = user?.name || guestName || authUser?.name || 'Researcher';
  const totalCheckins = serverStreak?.total_checkins ?? dailyLogs.length;

  const riskCfg = {
    LOW:    { color: 'var(--risk-low)',    label: 'Lower Concern' },
    MEDIUM: { color: 'var(--risk-medium)', label: 'Moderate' },
    HIGH:   { color: 'var(--risk-high)',   label: 'High Attention' },
  };
  const rc = riskResult ? riskCfg[riskResult.level] : null;

  useEffect(() => {
    if (!isAuthenticated) return;
    insightsAPI.get().then(d => { if (d?.insights) dispatch(setServerInsights(d.insights)); }).catch(() => {});
    checkinAPI.getHistory().then(d => { if (d?.history) dispatch(setServerCheckins(d.history)); }).catch(() => {});
  }, [isAuthenticated]);

  return (
    <AppShell>
      <div className={styles.page}>

        {/* ── Top Header Bar ── */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <p className={styles.topBarLabel}>METABOLIC IMMERSION OVERVIEW</p>
            <h1 className={styles.topBarTitle}>Health Dashboard</h1>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.statusChip}>
              <span className={styles.statusDot} />
              <span className={styles.statusText}>Live Monitoring</span>
            </div>
            <button className={styles.avatarBtn} onClick={() => router.push('/profile')} aria-label="Profile">
              {(displayName).trim().charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        {/* ── Hero Banner ── */}
        <section className={styles.heroBanner}>
          <div className={styles.heroLeft}>
            <p className={styles.heroEyebrow}>
              🧬 GENOMIC SEQUENCE · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h2 className={styles.heroGreeting}>Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, <span className={styles.heroName}>{displayName}</span></h2>
            <p className={styles.heroDesc}>Real-time biological monitoring of vitamin synthesis and mitochondrial efficiency.</p>
            <div className={styles.heroActions}>
              {!checkedToday ? (
                <button className={styles.heroBtn} onClick={() => router.push('/checkin')}>
                  Submit Daily Protocol →
                </button>
              ) : (
                <div className={styles.heroDone}>
                  <span className={styles.heroDoneIcon}>✓</span>
                  Protocol submitted today
                </div>
              )}
              <div className={styles.streakTag}>
                🔥 <strong>{streak}</strong>-day streak
              </div>
            </div>
          </div>
          <div className={styles.heroRight}>
            {/* B12 Risk Score Ring */}
            <div className={styles.scoreRingWrap}>
              <div className={styles.scoreRingLabel}>B12 RISK SCORE</div>
              {riskResult ? (
                <>
                  <div className={styles.scoreRingOuter} style={{ borderColor: rc?.color }}>
                    <span className={styles.scoreRingPct} style={{ color: rc?.color }}>{riskResult.percentage}%</span>
                    <span className={styles.scoreRingUnit}>SCORE</span>
                  </div>
                  <RiskBadge level={riskResult.level} />
                </>
              ) : (
                <div className={styles.scoreRingOuter} style={{ borderColor: 'var(--outline)' }}>
                  <span className={styles.scoreRingPct} style={{ color: 'var(--text-muted)' }}>—</span>
                  <span className={styles.scoreRingUnit}>NO DATA</span>
                </div>
              )}
            </div>
          </div>
          {/* background glow */}
          <div className={styles.heroBg} />
        </section>

        {/* ── Metric Cards Row ── */}
        <section className={styles.metricsRow}>
          {[
            {
              label: 'ENERGY INDEX',
              value: avgEnergy || '—',
              unit: '/ 5',
              icon: '⚡',
              color: 'var(--primary)',
              gauge: avgEnergy,
              max: 5,
              sub: recentLogs.length > 0 ? `7-day average` : 'No data yet',
            },
            {
              label: 'TOTAL CHECK-INS',
              value: totalCheckins,
              unit: 'logs',
              icon: '📝',
              color: 'var(--secondary)',
              gauge: Math.min(totalCheckins, 100),
              max: 100,
              sub: `+${streak} streak days`,
            },
            {
              label: 'ACTIVE STREAK',
              value: streak,
              unit: 'days',
              icon: '🔥',
              color: 'var(--amber)',
              gauge: Math.min(streak, 30),
              max: 30,
              sub: streak > 0 ? 'Keep it going!' : 'Start today',
            },
            {
              label: 'B12 SCORE',
              value: riskResult ? `${riskResult.percentage}%` : '—',
              unit: '',
              icon: '🎯',
              color: rc?.color || 'var(--text-muted)',
              gauge: riskResult?.percentage || 0,
              max: 100,
              sub: rc?.label || 'Assessment needed',
            },
          ].map((m, i) => (
            <div key={i} className={styles.metricCard}>
              <div className={styles.metricTop}>
                <span className={styles.metricLabel}>{m.label}</span>
                <span className={styles.metricIcon}>{m.icon}</span>
              </div>
              <div className={styles.metricBody}>
                <div className={styles.metricGauge}>
                  <RingGauge value={m.gauge} max={m.max} color={m.color} />
                </div>
                <div className={styles.metricVals}>
                  <span className={styles.metricVal} style={{ color: m.color }}>{m.value}</span>
                  {m.unit && <span className={styles.metricUnit}>{m.unit}</span>}
                </div>
              </div>
              <p className={styles.metricSub}>{m.sub}</p>
            </div>
          ))}
        </section>

        {/* ── Main Content Grid ── */}
        <div className={styles.mainGrid}>

          {/* Left column */}
          <div className={styles.leftCol}>

            {/* Daily Protocol Card */}
            <div className={styles.protocolCard}>
              <div className={styles.cardHeader}>
                <p className={styles.cardLeadLabel}>DAILY PROTOCOL</p>
                <div className={styles.cardHeaderRight}>
                  {checkedToday
                    ? <span className={styles.completedBadge}>✓ COMPLETE</span>
                    : <span className={styles.pendingBadge}>⏳ PENDING</span>}
                </div>
              </div>
              <h3 className={styles.cardTitle}>Submit your symptoms and dosage log for precision adjustment.</h3>
              {!checkedToday ? (
                <button className={styles.protocolBtn} onClick={() => router.push('/checkin')}>
                  Begin Protocol →
                </button>
              ) : (
                <p className={styles.protocolDone}>Protocol submitted. Next entry available tomorrow.</p>
              )}
            </div>

            {/* Insights */}
            <div className={styles.insightsBlock}>
              <p className={styles.blockLabel}>AI SIGNAL ANALYSIS</p>
              {serverInsights.length > 0
                ? serverInsights.slice(0, 2).map((ins, i) => (
                  <div key={i} className={`${styles.insightItem} ${ins.priority === 'high' ? styles.insightHigh : ''}`}>
                    <div className={styles.insightDot} style={{ background: ins.priority === 'high' ? 'var(--error)' : 'var(--primary)' }} />
                    <p className={styles.insightText}>{ins.message}</p>
                  </div>
                ))
                : (
                  <div className={styles.insightItem}>
                    <div className={styles.insightDot} />
                    <p className={styles.insightText}>{motivation}</p>
                  </div>
                )}
            </div>

            {/* Quick access */}
            <div className={styles.quickGrid}>
              <button className={styles.quickCard} onClick={() => router.push('/bmi')}>
                <span className={styles.quickIcon}>⚖️</span>
                <span className={styles.quickLabel}>BMI Analysis</span>
                <span className={styles.quickArrow}>→</span>
              </button>
              <button className={styles.quickCard} onClick={() => router.push('/foods')}>
                <span className={styles.quickIcon}>🥗</span>
                <span className={styles.quickLabel}>Nutrient Library</span>
                <span className={styles.quickArrow}>→</span>
              </button>
              <button className={styles.quickCard} onClick={() => router.push('/progress')}>
                <span className={styles.quickIcon}>📊</span>
                <span className={styles.quickLabel}>Progress Analytics</span>
                <span className={styles.quickArrow}>→</span>
              </button>
              <button className={styles.quickCard} onClick={() => router.push('/questionnaire')}>
                <span className={styles.quickIcon}>📋</span>
                <span className={styles.quickLabel}>Assessment</span>
                <span className={styles.quickArrow}>→</span>
              </button>
            </div>
          </div>

          {/* Right column */}
          <div className={styles.rightCol}>
            {/* Risk Result OR Assessment CTA */}
            {riskResult ? (
              <button className={styles.resultCard} onClick={() => router.push('/results')}>
                <div className={styles.resultCardTop}>
                  <p className={styles.cardLeadLabel}>LATEST RESULT</p>
                  <span className={styles.viewLink}>View full report →</span>
                </div>
                <div className={styles.resultCardBody}>
                  <div className={styles.resultBig} style={{ color: rc?.color }}>{riskResult.percentage}%</div>
                  <RiskBadge level={riskResult.level} />
                </div>
                {riskResult.suggestions?.length > 0 && (
                  <div className={styles.resultTip}>
                    <span className={styles.resultTipIcon}>💡</span>
                    <span className={styles.resultTipText}>{riskResult.suggestions[0]}</span>
                  </div>
                )}
              </button>
            ) : (
              <button className={styles.assessCard} onClick={() => router.push('/questionnaire')}>
                <div className={styles.assessTop}>
                  <p className={styles.cardLeadLabel}>SEQUENCE ACTIVITY</p>
                </div>
                <span className={styles.assessEmoji}>📋</span>
                <h3 className={styles.assessTitle}>Complete your B12 Assessment</h3>
                <p className={styles.assessSub}>Live chromosomal feedback from sub-dermal sensor. ~3 minutes · personalized risk overview.</p>
                <div className={styles.assessBtn}>INITIALIZE SCAN →</div>
              </button>
            )}

            {/* Disclaimer */}
            <DisclaimerStrip />

            {/* Sequence Activity Card */}
            <div className={styles.seqCard}>
              <p className={styles.cardLeadLabel}>SEQUENCE ACTIVITY</p>
              <div className={styles.seqBars}>
                {Array.from({ length: 20 }).map((_, i) => {
                  const h = 20 + Math.random() * 60;
                  const active = i < Math.round((riskResult?.percentage || 0) / 5);
                  return (
                    <div key={i} className={styles.seqBar}
                      style={{
                        height: `${h}%`,
                        background: active ? 'var(--gradient-primary)' : 'var(--bg-elevated)',
                        boxShadow: active ? '0 0 6px rgba(88,245,209,0.30)' : 'none',
                      }}
                    />
                  );
                })}
              </div>
              <p className={styles.seqLabel}>Live chromosomal feedback from sub-dermal sensor.</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
