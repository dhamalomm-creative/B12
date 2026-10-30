'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import AppShell from '@/components/layout/AppShell';
import styles from './page.module.css';

const DIET_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'omnivore', label: 'Omnivore' },
];

const FOODS_BY_DIET = {
  vegetarian: [
    {
      name: 'Nutritional yeast',
      tier: 'Low cal',
      amount: '5.0 mcg / 100 g',
      desc: 'Fortified flakes, great on pasta or popcorn.',
      colorClass: 'cardSage',
    },
    {
      name: 'Fortified cereal',
      tier: 'Medium cal',
      amount: '4.2 mcg / 100 g',
      desc: 'Check the label for added B12.',
      colorClass: 'cardYellow',
    },
    {
      name: 'Swiss cheese',
      tier: 'High cal',
      amount: '1.7 mcg / 100 g',
      desc: 'Easy snack for vegetarians.',
      colorClass: 'cardBlue',
    },
    {
      name: 'Eggs',
      tier: 'Medium cal',
      amount: '1.1 mcg / 100 g',
      desc: 'Versatile and widely available.',
      colorClass: 'cardPeach',
    },
    {
      name: 'Yogurt',
      tier: 'Low cal',
      amount: '0.8 mcg / 100 g',
      desc: 'Plain or fortified varieties.',
      colorClass: 'cardSage',
    },
    {
      name: 'Tempeh',
      tier: 'Medium cal',
      amount: '0.1 mcg / 100 g',
      desc: 'Low natural B12, useful as a protein.',
      colorClass: 'cardYellow',
    },
  ],
  vegan: [
    {
      name: 'Nutritional yeast',
      tier: 'Low cal',
      amount: '5.0 mcg / 100 g',
      desc: 'Fortified flakes, great on pasta or popcorn.',
      colorClass: 'cardSage',
    },
    {
      name: 'Fortified cereal',
      tier: 'Medium cal',
      amount: '4.2 mcg / 100 g',
      desc: 'Check the label for added B12.',
      colorClass: 'cardYellow',
    },
    {
      name: 'Fortified plant milk',
      tier: 'Low cal',
      amount: '1.2 mcg / 100 g',
      desc: 'Soy, almond, or oat milk fortified with B12.',
      colorClass: 'cardBlue',
    },
    {
      name: 'Marmite / Yeast extract',
      tier: 'Low cal',
      amount: '0.5 mcg / 100 g',
      desc: 'Savory spread enriched with B vitamins.',
      colorClass: 'cardPeach',
    },
    {
      name: 'Nori seaweed',
      tier: 'Low cal',
      amount: '0.3 mcg / 100 g',
      desc: 'Dried seaweed with bioavailable B12 analogues.',
      colorClass: 'cardSage',
    },
    {
      name: 'Tempeh',
      tier: 'Medium cal',
      amount: '0.1 mcg / 100 g',
      desc: 'Low natural B12, useful as a protein.',
      colorClass: 'cardYellow',
    },
  ],
  pescatarian: [
    {
      name: 'Clams',
      tier: 'Low cal',
      amount: '84.1 mcg / 100 g',
      desc: 'Highest natural B12 source.',
      colorClass: 'cardSage',
    },
    {
      name: 'Salmon',
      tier: 'Medium cal',
      amount: '4.8 mcg / 100 g',
      desc: 'Rich in omega-3 and bioavailable B12.',
      colorClass: 'cardYellow',
    },
    {
      name: 'Canned tuna',
      tier: 'Low cal',
      amount: '3.0 mcg / 100 g',
      desc: 'High protein lean seafood.',
      colorClass: 'cardBlue',
    },
    {
      name: 'Swiss cheese',
      tier: 'High cal',
      amount: '1.7 mcg / 100 g',
      desc: 'Easy snack for vegetarians.',
      colorClass: 'cardPeach',
    },
    {
      name: 'Eggs',
      tier: 'Medium cal',
      amount: '1.1 mcg / 100 g',
      desc: 'Versatile and widely available.',
      colorClass: 'cardSage',
    },
    {
      name: 'Yogurt',
      tier: 'Low cal',
      amount: '0.8 mcg / 100 g',
      desc: 'Plain or fortified varieties.',
      colorClass: 'cardYellow',
    },
  ],
  omnivore: [
    {
      name: 'Beef liver',
      tier: 'Medium cal',
      amount: '70.6 mcg / 100 g',
      desc: 'Dense organ meat with exceptional B12.',
      colorClass: 'cardSage',
    },
    {
      name: 'Clams',
      tier: 'Low cal',
      amount: '84.1 mcg / 100 g',
      desc: 'Highest natural seafood B12.',
      colorClass: 'cardYellow',
    },
    {
      name: 'Lean beef',
      tier: 'Medium cal',
      amount: '2.6 mcg / 100 g',
      desc: 'High zinc, iron, and cellular B12.',
      colorClass: 'cardBlue',
    },
    {
      name: 'Swiss cheese',
      tier: 'High cal',
      amount: '1.7 mcg / 100 g',
      desc: 'Easy dairy snack.',
      colorClass: 'cardPeach',
    },
    {
      name: 'Eggs',
      tier: 'Medium cal',
      amount: '1.1 mcg / 100 g',
      desc: 'Versatile and widely available.',
      colorClass: 'cardSage',
    },
    {
      name: 'Yogurt',
      tier: 'Low cal',
      amount: '0.8 mcg / 100 g',
      desc: 'Plain or fortified varieties.',
      colorClass: 'cardYellow',
    },
  ],
};

FOODS_BY_DIET.all = FOODS_BY_DIET.vegetarian;

export default function FoodsPage() {
  const { state } = useApp();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState(
    state.user?.dietType || 'vegetarian'
  );

  const userBmi = state.bmiData?.bmi;
  const foods = FOODS_BY_DIET[activeFilter] || FOODS_BY_DIET.vegetarian;

  const content = (
    <div className={styles.foodsPage} style={{ padding: isAuthenticated ? undefined : '20px 24px 60px' }}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>B12 foods directory</h1>
        <p className={styles.subtitle}>Filtered for your diet and tailored for your nutritional balance.</p>
      </header>

      {/* Filter Pills */}
      <div className={styles.filterRow}>
        {DIET_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`${styles.filterPill} ${activeFilter === f.id ? styles.filterPillActive : ''}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* BMI Status & Action */}
      <div className={styles.bmiStatusRow}>
        <p className={styles.bmiText}>
          {userBmi
            ? `Tailored for your recorded BMI of ${userBmi}.`
            : 'Track your BMI to personalize calorie and nutrient recommendations.'}
        </p>
        <button
          type="button"
          className={styles.updateBmiBtn}
          onClick={() => router.push(isAuthenticated ? '/bmi' : '/auth?mode=login')}
        >
          {userBmi ? 'Update BMI' : 'Calculate BMI'}
        </button>
      </div>

      {/* Food Cards Grid */}
      <div className={styles.foodGrid}>
        {foods.map((food, idx) => (
          <div
            key={idx}
            className={`${styles.foodCard} ${styles[food.colorClass]}`}
          >
            <div className={styles.cardTop}>
              <span className={styles.foodName}>{food.name}</span>
              <span className={styles.calBadge}>{food.tier}</span>
            </div>
            <p className={styles.foodAmount}>{food.amount}</p>
            <p className={styles.foodDesc}>{food.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  if (isAuthenticated) {
    return <AppShell>{content}</AppShell>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg, #FAF6F0)' }}>
      {/* Public Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 32px',
        maxWidth: '1100px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <Link href="/" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}>
          B12 Health Tracker
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Home
          </Link>
          <Link href="/onboarding" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Assessment
          </Link>
          <Link href="/auth?mode=login" style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none' }}>
            Log in
          </Link>
          <Link
            href="/auth?mode=register"
            style={{
              fontSize: '13.5px',
              backgroundColor: 'var(--primary, #1E3A2B)',
              color: '#FFFFFF',
              padding: '8px 18px',
              borderRadius: '9999px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Start free
          </Link>
        </nav>
      </header>
      <main style={{ maxWidth: '1040px', margin: '0 auto' }}>
        {content}
      </main>
    </div>
  );
}
