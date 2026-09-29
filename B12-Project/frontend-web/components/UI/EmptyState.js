'use client';
import styles from './EmptyState.module.css';

/**
 * Reusable empty state component — shown when a section has no data yet.
 * Matches the Clinical Luminary design language.
 */
export default function EmptyState({
  icon = '📊',
  title = 'No data yet',
  description = 'Start tracking to see your data here.',
  actionLabel,
  onAction,
}) {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrap}>
        <span className={styles.icon}>{icon}</span>
        <div className={styles.glow} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      {actionLabel && onAction && (
        <button className={styles.action} onClick={onAction}>
          {actionLabel} →
        </button>
      )}
    </div>
  );
}
