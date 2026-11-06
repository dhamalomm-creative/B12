'use client';
import { useI18n } from '@/i18n/LanguageProvider';

/** Legal text stays in English so there is one binding version; say so to other readers. */
export default function LegalLanguageNotice() {
  const { locale, t } = useI18n();
  if (locale === 'en') return null;
  return (
    <p style={{ margin: '0 0 20px', padding: '10px 14px', borderRadius: 12, background: 'var(--pastel-yellow)', fontSize: 14, color: 'var(--text-primary)' }}>
      {t('This page is available in English only, so there is one official version.')}
    </p>
  );
}
