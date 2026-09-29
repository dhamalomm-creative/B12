'use client';
import styles from './Skeleton.module.css';

/**
 * Skeleton loader components — shaped like actual content for perceived performance.
 * Uses shimmer animation with the app's dark teal color system.
 */

/* ─── Base Skeleton ─────────────────────────────────────────────────────── */
export function Skeleton({ width, height, radius = 'var(--radius-md)', style = {}, className = '' }) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

/* ─── Preset: Stat Card Skeleton ────────────────────────────────────────── */
export function SkeletonCard({ count = 4 }) {
  return (
    <div className={styles.cardRow}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.cardTop}>
            <Skeleton width="60%" height={12} radius="6px" />
            <Skeleton width={24} height={24} radius="50%" />
          </div>
          <Skeleton width={64} height={64} radius="50%" style={{ margin: '16px auto 12px' }} />
          <Skeleton width="40%" height={28} radius="8px" style={{ margin: '0 auto 8px' }} />
          <Skeleton width="50%" height={12} radius="6px" style={{ margin: '0 auto' }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Preset: Chart Area Skeleton ───────────────────────────────────────── */
export function SkeletonChart({ height = 220 }) {
  return (
    <div className={styles.chart} style={{ height }}>
      <div className={styles.chartBars}>
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            width="100%"
            height={`${30 + Math.random() * 60}%`}
            radius="4px 4px 0 0"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <Skeleton width="100%" height={1} radius="0" style={{ opacity: 0.3 }} />
    </div>
  );
}

/* ─── Preset: Grid of Cards Skeleton ────────────────────────────────────── */
export function SkeletonGrid({ count = 6, columns = 3 }) {
  return (
    <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.gridItem}>
          <Skeleton width="100%" height={80} radius="var(--radius-md)" />
          <Skeleton width="70%" height={14} radius="6px" style={{ marginTop: 10 }} />
          <Skeleton width="50%" height={11} radius="6px" style={{ marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Preset: Text Block Skeleton ───────────────────────────────────────── */
export function SkeletonText({ lines = 3 }) {
  return (
    <div className={styles.textBlock}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={14}
          radius="6px"
          style={{ marginBottom: 10 }}
        />
      ))}
    </div>
  );
}

/* ─── Preset: Profile Skeleton ──────────────────────────────────────────── */
export function SkeletonProfile() {
  return (
    <div className={styles.profile}>
      <Skeleton width={80} height={80} radius="50%" />
      <Skeleton width="40%" height={20} radius="8px" style={{ marginTop: 16 }} />
      <Skeleton width="30%" height={14} radius="6px" style={{ marginTop: 8 }} />
      <div className={styles.profileStats}>
        {[1, 2, 3].map(i => (
          <div key={i} className={styles.profileStat}>
            <Skeleton width={40} height={28} radius="8px" />
            <Skeleton width={60} height={12} radius="6px" style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
