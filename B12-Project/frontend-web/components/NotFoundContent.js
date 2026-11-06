'use client';
import Link from 'next/link';
import { useI18n } from '@/i18n/LanguageProvider';

export default function NotFoundContent() {
  const { t } = useI18n();
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <p style={{ fontSize: 56, fontWeight: 800, color: 'var(--primary)', letterSpacing: -2 }}>404</p>
        <h1 style={{ fontSize: 26, margin: '8px 0' }}>{t("We couldn't find that page")}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          {t('The link may be broken or the page may have moved.')}
        </p>
        <Link href="/" className="btn-primary">{t('Back to home')}</Link>
      </div>
    </main>
  );
}
