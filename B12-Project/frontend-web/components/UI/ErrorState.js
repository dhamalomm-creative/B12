'use client';
import styles from './ErrorState.module.css';

/**
 * Consistent error component — matches DisclaimerStrip visual language.
 * Used across all pages for failed API calls.
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'We couldn\'t load this data. Please try again.',
  onRetry,
  compact = false,
}) {
  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <div className={styles.iconRow}>
        <span className={styles.icon}>⚠️</span>
        <div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>
      </div>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
