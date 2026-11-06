'use client';
import { useI18n } from '@/i18n/LanguageProvider';

export default function SkipLink() {
  const { t } = useI18n();
  return <a href="#main-content" className="skip-link">{t('Skip to content')}</a>;
}
