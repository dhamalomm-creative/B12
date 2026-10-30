'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp, setUser, setGuestName, completeOnboarding } from '@/context/AppContext';
import styles from './page.module.css';

const AGE_RANGES = [
  { id: 'under18', label: 'Under 18', numericAge: 16 },
  { id: '18-24', label: '18 to 24', numericAge: 21 },
  { id: '25-40', label: '25 to 40', numericAge: 30 },
  { id: '41-60', label: '41 to 60', numericAge: 50 },
  { id: '60+', label: '60+', numericAge: 65 },
];

const GENDERS = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'other', label: 'Other' },
];

const DIETS = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'pescatarian', label: 'Pescatarian' },
  { id: 'omnivore', label: 'Omnivore' },
];

export default function OnboardingPage() {
  const { state, dispatch } = useApp();
  const router = useRouter();

  const [name, setName]         = useState(state.user?.name || state.guestName || '');
  const [age, setAge]           = useState(state.user?.age || '18-24');
  const [gender, setGender]     = useState(state.user?.gender || 'female');
  const [dietType, setDietType] = useState(state.user?.dietType || 'vegetarian');
  const [saving, setSaving]     = useState(false);

  const handleContinue = async () => {
    setSaving(true);
    const chosenName = name.trim() || 'Friend';
    const ageObj = AGE_RANGES.find(a => a.id === age);
    dispatch(setUser({
      name: chosenName,
      age: ageObj ? String(ageObj.numericAge) : '21',
      gender,
      dietType,
    }));
    dispatch(setGuestName(chosenName));
    dispatch(completeOnboarding());
    setSaving(false);
    router.push('/questionnaire');
  };

  return (
    <div className={styles.onboardingPage}>
      <header className={styles.topHeader}>
        <Link href="/" className={styles.brandTitle}>B12 Health Tracker</Link>
      </header>

      <main className={styles.contentWrap}>
        {/* Step Indicator */}
        <div className={styles.stepHeader}>
          <span className={styles.stepCount}>Assessment setup</span>
          <div className={styles.segmentedBar}>
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <span
                key={s}
                className={`${styles.segment} ${s <= 6 ? styles.segmentFilled : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Heading & Subtitle */}
        <h1 className={styles.mainTitle}>Tell us a little about you</h1>
        <p className={styles.subtitle}>
          This tunes your questions and food ideas. You can change it anytime.
        </p>

        {/* Form Card */}
        <div className={styles.formCard}>
          {/* Your name */}
          <div className={styles.inputGroup}>
            <label className={styles.groupLabel}>Your name</label>
            <input
              type="text"
              className={styles.nameInput}
              placeholder="Enter your name (e.g. Alex)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Age range */}
          <div className={styles.inputGroup}>
            <label className={styles.groupLabel}>Age range</label>
            <div className={styles.pillRow}>
              {AGE_RANGES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`${styles.choicePill} ${age === a.id ? styles.choicePillActive : ''}`}
                  onClick={() => setAge(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className={styles.inputGroup}>
            <label className={styles.groupLabel}>Gender</label>
            <div className={styles.pillRow}>
              {GENDERS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`${styles.choicePill} ${gender === g.id ? styles.choicePillActive : ''}`}
                  onClick={() => setGender(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Diet */}
          <div className={styles.inputGroup}>
            <label className={styles.groupLabel}>Diet</label>
            <div className={styles.pillRow}>
              {DIETS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`${styles.choicePill} ${dietType === d.id ? styles.choicePillActive : ''}`}
                  onClick={() => setDietType(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => router.back()}
          >
            Back
          </button>
          <button
            type="button"
            className={styles.continueBtn}
            onClick={handleContinue}
            disabled={saving}
          >
            {saving ? 'Loading…' : 'Start assessment'}
          </button>
        </div>
      </main>
    </div>
  );
}
