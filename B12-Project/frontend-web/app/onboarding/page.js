'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp, setUser, setGuestName, completeOnboarding } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/UI';
import AmbientBackground from '@/components/AmbientBackground';
import styles from './page.module.css';

const AGE_RANGES = [
  { id: 'under18', label: 'Under 18', numericAge: 16, min: 1, max: 17 },
  { id: '18-24', label: '18–24', numericAge: 21, min: 18, max: 24 },
  { id: '25-40', label: '25–40', numericAge: 32, min: 25, max: 40 },
  { id: '41-60', label: '41–60', numericAge: 50, min: 41, max: 60 },
  { id: '60+', label: '60+', numericAge: 65, min: 61, max: 120 },
];

const GENDERS = [
  { id: 'female', label: 'Female', hint: 'Adds questions about periods & pregnancy' },
  { id: 'male', label: 'Male', hint: '' },
  { id: 'other', label: 'Prefer not to say', hint: '' },
];

const DIETS = [
  { id: 'vegan', label: 'Vegan', icon: '🌱', hint: 'No animal products' },
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥛', hint: 'Dairy / eggs, no meat or fish' },
  { id: 'pescatarian', label: 'Pescatarian', icon: '🐟', hint: 'Fish, no meat' },
  { id: 'omnivore', label: 'Non-vegetarian', icon: '🍗', hint: 'Meat, fish, eggs, dairy' },
];

const rangeForAge = (age) => {
  const n = parseInt(age, 10);
  if (!n) return '';
  return AGE_RANGES.find((r) => n >= r.min && n <= r.max)?.id || '';
};

function OnboardingForm() {
  const { state, dispatch } = useApp();
  const { isAuthenticated, user: authUser, updateProfile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [dietType, setDietType] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill from account or earlier guest answers
  useEffect(() => {
    const src = isAuthenticated ? authUser : state.user;
    if (!src) return;
    setName((n) => n || src.name || state.guestName || '');
    setAge((a) => a || rangeForAge(src.age));
    setGender((g) => g || src.gender || '');
    setDietType((d) => d || src.dietType || '');
  }, [isAuthenticated, authUser, state.user, state.guestName]);

  const complete = age && gender && dietType;

  const handleContinue = async () => {
    if (!complete) {
      setError('Please choose your age range, gender and diet so we can tailor your questions.');
      return;
    }
    setError('');
    setSaving(true);
    const chosenName = name.trim().slice(0, 80);
    const ageObj = AGE_RANGES.find((a) => a.id === age);
    const numericAge = ageObj ? ageObj.numericAge : 30;

    dispatch(setUser({ name: chosenName, age: String(numericAge), gender, dietType }));
    dispatch(setGuestName(chosenName));
    dispatch(completeOnboarding());

    if (isAuthenticated) {
      try {
        await updateProfile({
          ...(chosenName ? { name: chosenName } : {}),
          age: numericAge,
          gender,
          dietType,
        });
      } catch (err) {
        setSaving(false);
        toast(err.message || 'Could not save your profile. Please try again.', 'error');
        return;
      }
    }

    setSaving(false);
    router.push(params.get('next') === 'dashboard' ? '/dashboard' : '/questionnaire');
  };

  return (
    <div className={styles.onboardingPage}>
      <AmbientBackground fixed />
      <header className={styles.topHeader}>
        <Link href={isAuthenticated ? '/dashboard' : '/'} className={styles.brandTitle}>B12 Health Tracker</Link>
      </header>

      <main className={styles.contentWrap}>
        <p className={styles.stepCount}>Step 1 of 2 · About you</p>
        <h1 className={styles.mainTitle}>Let&apos;s tailor your check-up</h1>
        <p className={styles.subtitle}>
          Your age, gender and diet change how much B12 you need and how well you absorb it — so we ask
          about 20 questions picked for you. Takes about 4 minutes.
        </p>

        <div className={styles.formCard}>
          <div className={styles.inputGroup}>
            <label className={styles.groupLabel} htmlFor="name">
              What should we call you? <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              className={styles.nameInput}
              placeholder="First name"
              value={name}
              maxLength={80}
              autoComplete="given-name"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <fieldset className={styles.inputGroup}>
            <legend className={styles.groupLabel}>Age range</legend>
            <div className={styles.pillRow}>
              {AGE_RANGES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={age === a.id}
                  className={`${styles.choicePill} ${age === a.id ? styles.choicePillActive : ''}`}
                  onClick={() => setAge(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className={styles.inputGroup}>
            <legend className={styles.groupLabel}>Gender</legend>
            <div className={styles.pillRow}>
              {GENDERS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  aria-pressed={gender === g.id}
                  className={`${styles.choicePill} ${gender === g.id ? styles.choicePillActive : ''}`}
                  onClick={() => setGender(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {gender && GENDERS.find((g) => g.id === gender)?.hint && (
              <p className={styles.hint}>{GENDERS.find((g) => g.id === gender).hint}</p>
            )}
          </fieldset>

          <fieldset className={styles.inputGroup}>
            <legend className={styles.groupLabel}>Your usual diet</legend>
            <div className={styles.dietGrid}>
              {DIETS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  aria-pressed={dietType === d.id}
                  className={`${styles.dietCard} ${dietType === d.id ? styles.dietCardActive : ''}`}
                  onClick={() => setDietType(d.id)}
                >
                  <span className={styles.dietIcon} aria-hidden="true">{d.icon}</span>
                  <span className={styles.dietLabel}>{d.label}</span>
                  <span className={styles.dietHint}>{d.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {error && <p className={styles.errorText} role="alert">{error}</p>}
        </div>

        <div className={styles.actionsRow}>
          <button type="button" className={styles.backBtn} onClick={() => router.back()}>
            Back
          </button>
          <button
            type="button"
            className={styles.continueBtn}
            onClick={handleContinue}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Start my assessment →'}
          </button>
        </div>
        <p className={styles.privacyNote}>
          🔒 No account needed to see your score. We never sell your data.
        </p>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  );
}
