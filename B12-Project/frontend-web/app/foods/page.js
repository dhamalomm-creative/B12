'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/LanguageProvider';
import { B12_FOODS, DAILY_B12_MCG, getBMICategory, BMI_INFO } from '@/data/b12Foods';
import AppShell from '@/components/layout/AppShell';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import styles from './page.module.css';

const DIET_FILTERS = [
  { id: 'all', label: 'All foods' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'omnivore', label: 'Non-veg' },
];

const TYPE_TONE = {
  Seafood: 'blue', Meat: 'peach', Dairy: 'yellow', Eggs: 'yellow', Fortified: 'green', Supplement: 'green', Plant: 'green',
};

// Moves the card's hover spotlight (see .card::before) to the pointer, via CSS
// variables so React doesn't re-render on every mouse move.
const trackSpotlight = (e) => {
  if (e.pointerType !== 'mouse') return;
  const card = e.target.closest('li');
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--mx', `${e.clientX - r.left}px`);
  card.style.setProperty('--my', `${e.clientY - r.top}px`);
};

const SORTS = [
  { id: 'b12', label: 'Most B12' },
  { id: 'cal', label: 'Fewest calories' },
];

export default function FoodsPage() {
  const { t, rich } = useI18n();
  const { state } = useApp();
  const { isAuthenticated, user } = useAuth();

  const preferredDiet = (isAuthenticated ? user?.dietType : state.user?.dietType) || 'all';
  const [diet, setDiet] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('b12');
  // Foods whose photo failed to load fall back to their emoji.
  const [brokenImages, setBrokenImages] = useState(() => new Set());

  useEffect(() => { if (preferredDiet) setDiet(preferredDiet); }, [preferredDiet]);

  const bmi = state.bmiData?.bmi;
  const bmiCat = bmi ? getBMICategory(bmi) : null;

  const foods = useMemo(() => {
    const q = query.trim().toLowerCase();
    return B12_FOODS
      .filter((f) => diet === 'all' || f.dietTags.includes(diet))
      .filter((f) => !q || [f.name, f.type, t(f.name), t(f.type)].some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => (sort === 'cal' ? a.calories - b.calories : b.b12mcg - a.b12mcg));
  }, [diet, query, sort, t]);

  const content = (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('B12 food guide')}</h1>
        <p className={styles.subtitle}>
          {rich("Adults need about {amount} of vitamin B12 a day (2.6 in pregnancy, 2.8 when breastfeeding). Here's how much a typical serving gives you.", {
            amount: <strong>{`${DAILY_B12_MCG} mcg`}</strong>,
          })}
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.filterRow} role="tablist" aria-label={t('Filter by diet')}>
          {DIET_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={diet === f.id}
              className={`${styles.filterPill} ${diet === f.id ? styles.filterPillActive : ''}`}
              onClick={() => setDiet(f.id)}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
        <div className={styles.searchRow}>
          <input
            type="search"
            className={styles.search}
            placeholder={t('Search foods (e.g. eggs, fish, milk)')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={t('Search foods')}
          />
          <select className={styles.sort} value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('Sort foods')}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>{t(s.label)}</option>)}
          </select>
        </div>
      </div>

      {diet === 'vegan' && (
        <div className={styles.callout}>
          <strong>{t('Vegan tip:')}</strong>{' '}
          {t("plants don't naturally provide reliable B12. Fortified foods or a regular supplement are essential — mushrooms, seaweed and tempeh are not dependable sources.")}
        </div>
      )}

      {isAuthenticated && (
        <div className={styles.bmiRow}>
          <p>
            {bmiCat
              ? `${t(BMI_INFO[bmiCat].tip)} (BMI ${bmi})`
              : t('Add your BMI to get calorie-aware suggestions.')}
          </p>
          <Link href="/bmi" className={styles.bmiLink}>{t(bmiCat ? 'Update BMI' : 'Calculate BMI')} →</Link>
        </div>
      )}

      {foods.length === 0 ? (
        <p className={styles.empty}>{t('No foods match “{query}”.', { query })}</p>
      ) : (
        <ul className={styles.grid} onPointerMove={trackSpotlight}>
          {foods.map((f) => {
            const pctDV = Math.round((f.b12mcg / DAILY_B12_MCG) * 100);
            const tone = TYPE_TONE[f.type] || 'green';
            return (
              <li key={f.name} className={`${styles.card} ${styles[`tone_${tone}`]}`}>
                <div className={styles.photo}>
                  <span className={styles.emoji} aria-hidden="true">{f.emoji}</span>
                  {f.image && !brokenImages.has(f.name) && (
                    <Image
                      src={f.image}
                      alt={t('Photo of {food}', { food: t(f.name) })}
                      fill
                      sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 320px"
                      className={styles.photoImg}
                      onError={() => setBrokenImages((s) => new Set(s).add(f.name))}
                    />
                  )}
                  <span className={styles.typeBadge}>{t(f.type)}</span>
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.foodName}>{t(f.name)}</h2>
                  <p className={styles.serving}>{t(f.serving)}</p>
                  <div className={styles.amountRow}>
                    <span className={styles.amount}>{f.b12mcg} mcg</span>
                    <span className={styles.dv}>{t('{pct} of daily need', { pct: pctDV >= 1000 ? '1000%+' : `${pctDV}%` })}</span>
                  </div>
                  <div className={styles.dvTrack} aria-hidden="true">
                    <div className={styles.dvFill} style={{ width: `${Math.min(100, pctDV)}%` }} />
                  </div>
                  <p className={styles.desc}>{t(f.desc)}</p>
                  {f.calories > 0 && <p className={styles.kcal}>≈ {t('{n} kcal per serving', { n: f.calories })}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.disclaimer}>
        {t('Values are approximate and vary by brand and preparation. Sources: NIH Office of Dietary Supplements, USDA FoodData Central. Food photos from Unsplash and Wikimedia Commons. People with absorption problems may not get enough B12 from food alone — ask your doctor.')}
      </p>
    </div>
  );

  if (isAuthenticated) return <AppShell>{content}</AppShell>;

  return (
    <div className={styles.publicWrap}>
      <header className={styles.publicHeader}>
        <Link href="/" className={styles.publicBrand}>B12 Health Tracker</Link>
        <nav className={styles.publicNav}>
          <LanguageSwitcher />
          <Link href="/onboarding">{t('Take the assessment')}</Link>
          <Link href="/auth?mode=login">{t('Log in')}</Link>
          <Link href="/auth?mode=register" className={styles.publicCta}>{t('Start free')}</Link>
        </nav>
      </header>
      <main className={styles.publicMain}>{content}</main>
    </div>
  );
}
