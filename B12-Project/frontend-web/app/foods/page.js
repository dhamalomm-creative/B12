'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { B12_FOODS, DAILY_B12_MCG, getBMICategory, BMI_INFO } from '@/data/b12Foods';
import AppShell from '@/components/layout/AppShell';
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

const SORTS = [
  { id: 'b12', label: 'Most B12' },
  { id: 'cal', label: 'Fewest calories' },
];

export default function FoodsPage() {
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
      .filter((f) => !q || f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q))
      .sort((a, b) => (sort === 'cal' ? a.calories - b.calories : b.b12mcg - a.b12mcg));
  }, [diet, query, sort]);

  const content = (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>B12 food guide</h1>
        <p className={styles.subtitle}>
          Adults need about <strong>{`${DAILY_B12_MCG} mcg`}</strong>{' '}of vitamin B12 a day (2.6 in pregnancy, 2.8 when breastfeeding).
          Here&apos;s how much a typical serving gives you.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.filterRow} role="tablist" aria-label="Filter by diet">
          {DIET_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={diet === f.id}
              className={`${styles.filterPill} ${diet === f.id ? styles.filterPillActive : ''}`}
              onClick={() => setDiet(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={styles.searchRow}>
          <input
            type="search"
            className={styles.search}
            placeholder="Search foods (e.g. eggs, fish, milk)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search foods"
          />
          <select className={styles.sort} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort foods">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {diet === 'vegan' && (
        <div className={styles.callout}>
          <strong>Vegan tip:</strong> plants don&apos;t naturally provide reliable B12. Fortified foods or a regular
          supplement are essential — mushrooms, seaweed and tempeh are not dependable sources.
        </div>
      )}

      {isAuthenticated && (
        <div className={styles.bmiRow}>
          <p>
            {bmiCat
              ? `${BMI_INFO[bmiCat].tip} (BMI ${bmi})`
              : 'Add your BMI to get calorie-aware suggestions.'}
          </p>
          <Link href="/bmi" className={styles.bmiLink}>{bmiCat ? 'Update BMI' : 'Calculate BMI'} →</Link>
        </div>
      )}

      {foods.length === 0 ? (
        <p className={styles.empty}>No foods match “{query}”.</p>
      ) : (
        <ul className={styles.grid}>
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
                      alt={`Photo of ${f.name}`}
                      fill
                      sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 320px"
                      className={styles.photoImg}
                      onError={() => setBrokenImages((s) => new Set(s).add(f.name))}
                    />
                  )}
                  <span className={styles.typeBadge}>{f.type}</span>
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.foodName}>{f.name}</h2>
                  <p className={styles.serving}>{f.serving}</p>
                  <div className={styles.amountRow}>
                    <span className={styles.amount}>{f.b12mcg} mcg</span>
                    <span className={styles.dv}>{pctDV >= 1000 ? '1000%+' : `${pctDV}%`} of daily need</span>
                  </div>
                  <div className={styles.dvTrack} aria-hidden="true">
                    <div className={styles.dvFill} style={{ width: `${Math.min(100, pctDV)}%` }} />
                  </div>
                  <p className={styles.desc}>{f.desc}</p>
                  {f.calories > 0 && <p className={styles.kcal}>≈ {f.calories} kcal per serving</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.disclaimer}>
        Values are approximate and vary by brand and preparation. Sources: NIH Office of Dietary Supplements, USDA FoodData Central.
        Food photos from Unsplash.
        People with absorption problems may not get enough B12 from food alone — ask your doctor.
      </p>
    </div>
  );

  if (isAuthenticated) return <AppShell>{content}</AppShell>;

  return (
    <div className={styles.publicWrap}>
      <header className={styles.publicHeader}>
        <Link href="/" className={styles.publicBrand}>B12 Health Tracker</Link>
        <nav className={styles.publicNav}>
          <Link href="/onboarding">Take the assessment</Link>
          <Link href="/auth?mode=login">Log in</Link>
          <Link href="/auth?mode=register" className={styles.publicCta}>Start free</Link>
        </nav>
      </header>
      <main className={styles.publicMain}>{content}</main>
    </div>
  );
}
