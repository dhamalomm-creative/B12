'use client';
import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return <div className={`${styles.toggle} ${className}`} style={{ width: 52, height: 28 }} />;
  }

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className={`${styles.toggle} ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <span className={styles.track}>
        <span className={`${styles.thumb} ${isLight ? styles.thumbLight : ''}`}>
          {isLight ? '☀️' : '🌙'}
        </span>
      </span>
    </button>
  );
}
