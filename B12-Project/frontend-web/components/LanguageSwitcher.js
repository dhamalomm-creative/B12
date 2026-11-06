'use client';
import { LOCALES, useI18n } from '@/i18n/LanguageProvider';
import styles from './LanguageSwitcher.module.css';

/** Language picker. A native select, so it works with keyboards, screen readers and phones. */
export default function LanguageSwitcher({ tone = 'light', className = '' }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className={`${styles.switcher} ${tone === 'dark' ? styles.dark : ''} ${className}`}>
      <span className="visually-hidden">{t('Language')}</span>
      <svg className={styles.globe} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 0 20a15.3 15.3 0 0 1 0-20z" />
      </svg>
      <select className={styles.select} value={locale} onChange={(e) => setLocale(e.target.value)}>
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
}
