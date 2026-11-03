import styles from './AmbientBackground.module.css';

/**
 * Slow, blurred colour shapes that drift behind a page.
 * Purely decorative: CSS-only, animates transform alone, and holds still
 * when the user prefers reduced motion.
 *
 * The parent must create a stacking context (`isolation: isolate`) so the
 * layer sits above the parent's background but below its content.
 *
 * @param {'light'|'dark'} tone  light for cream pages, dark for the green brand panel
 * @param {boolean} fixed        stay put while the page scrolls (full-page use)
 */
export default function AmbientBackground({ tone = 'light', fixed = false }) {
  return (
    <div
      className={`${styles.layer} ${fixed ? styles.fixed : ''} ${styles[tone]}`}
      aria-hidden="true"
    >
      <span className={`${styles.blob} ${styles.a}`} />
      <span className={`${styles.blob} ${styles.b}`} />
      <span className={`${styles.blob} ${styles.c}`} />
    </div>
  );
}
