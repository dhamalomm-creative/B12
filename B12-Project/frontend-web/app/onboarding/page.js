'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, setUser, setGuestName, completeOnboarding } from '@/context/AppContext';
import { DIET_TYPES } from '@/data/questions';
import { PrimaryButton } from '@/components/UI';
import styles from './page.module.css';

const INTRO_SLIDES = [
  { kicker: 'Welcome',    emoji: '🌿', title: 'Your calm space for B12 wellness',          subtitle: 'B12 Health helps you understand vitamin B12 in everyday language — with a guided assessment and quick daily check-ins you can complete in moments.' },
  { kicker: 'How it works', emoji: '✨', title: 'Simple steps, meaningful clarity',         subtitle: 'Take a one-time questionnaire tailored to your age, diet, and lifestyle. Then log energy, mood, and sleep in seconds. We surface patterns so you can spot trends over time.' },
  { kicker: 'Our vision', emoji: '🎯', title: 'Awareness that empowers — not alarms',      subtitle: 'We believe preventive health should feel supportive and professional. Our goal is to help you prepare for informed conversations with your clinician — never to replace medical advice.' },
  { kicker: 'Privacy',    emoji: '🔐', title: 'You stay in control',                       subtitle: 'Your responses are stored securely on your account. We design every screen to respect your data and keep the experience transparent and easy to understand.' },
  { kicker: 'Inside the app', emoji: '🩺', title: 'Know your vitamin B12 picture',         subtitle: 'Surface early signs that may warrant attention — before they heavily impact how you feel day to day.' },
  { kicker: 'Inside the app', emoji: '📊', title: 'Track gentle daily patterns',           subtitle: 'Log energy, mood, and fatigue in about ten seconds to see how your week unfolds.' },
  { kicker: 'Inside the app', emoji: '💡', title: 'Personalized insights',                 subtitle: 'Recommendations adapt to your profile so guidance feels relevant, not generic.' },
];

export default function OnboardingPage() {
  const { dispatch } = useApp();
  const router = useRouter();
  const [slide, setSlide]       = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState('');
  const [age, setAge]           = useState('');
  const [gender, setGender]     = useState('');
  const [dietType, setDietType] = useState('');
  const [saving, setSaving]     = useState(false);

  const total   = INTRO_SLIDES.length;
  const pct     = ((slide + 1) / total) * 100;
  const isLast  = slide === total - 1;

  const goNext = () => {
    if (!isLast) setSlide(s => s + 1);
    else setShowForm(true);
  };

  const handleStart = async () => {
    if (!age || !gender || !dietType) return;
    setSaving(true);
    dispatch(setUser({ name: name || 'Friend', age, gender, dietType }));
    dispatch(setGuestName(name || 'Friend'));
    dispatch(completeOnboarding());
    setSaving(false);
    router.push('/questionnaire');
  };

  if (showForm) {
    const canSubmit = age && gender && dietType && !saving;
    return (
      <div className={styles.page}>
        <div className={styles.formTopBar}>
          <button className={styles.backBtn} onClick={() => setShowForm(false)}>←</button>
          <span className={styles.brand}>B12 Health</span>
          <div style={{ width: 44 }} />
        </div>

        <div className={styles.formScroll}>
          <span className={styles.stepPill}>Step 2 of 2 · Your profile</span>
          <h1 className={styles.formTitle}>A few details to personalize your plan</h1>
          <p className={styles.formSubtitle}>We ask for age, gender, and diet so questions and tips match your situation.</p>

          <div className={styles.formGrid}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>About you</h3>

              <label className={styles.fieldLabel}>Name <span className={styles.optional}>(optional)</span></label>
              <input className="input" placeholder="e.g. Alex" value={name} onChange={e => setName(e.target.value)} />

              <div className={styles.divider} />

              <label className={styles.fieldLabel}>Age range <span className={styles.required}>*</span></label>
              <div className={styles.pillRow}>
                {['15-24','25-40','41-60','60+'].map(a => (
                  <button key={a} className={`pill ${age===a?'active':''}`} onClick={() => setAge(a)}>{a}</button>
                ))}
              </div>

              <div className={styles.divider} />

              <label className={styles.fieldLabel}>Gender <span className={styles.required}>*</span></label>
              <div className={styles.genderCol}>
                {[{id:'female',label:'Female'},{id:'male',label:'Male'},{id:'other',label:'Other / Prefer not to say'}].map(g => (
                  <button key={g.id} className={`pill ${styles.pillWide} ${gender===g.id?'active':''}`} onClick={() => setGender(g.id)}>{g.label}</button>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Typical eating pattern</h3>
              <p className={styles.cardHint}>This helps estimate B12 intake from food. Choose what fits best most days.</p>
              {(DIET_TYPES||[]).map(d => (
                <button key={d.id} className={`${styles.dietCard} ${dietType===d.id?styles.dietCardActive:''}`} onClick={() => setDietType(d.id)}>
                  <span className={styles.dietEmoji}>{d.icon}</span>
                  <div className={styles.dietText}>
                    <span className={styles.dietLabel}>{d.label}</span>
                    {d.weight > 0 && <span className={styles.dietHint}>{d.weight>=3?'Often higher need for B12 awareness':d.weight===2?'Moderate attention to B12 sources':'Generally more B12 from diet'}</span>}
                  </div>
                  <span className={`${styles.dietRadio} ${dietType===d.id?styles.dietRadioActive:''}`}>{dietType===d.id?'✓':''}</span>
                </button>
              ))}
            </div>
          </div>

          <PrimaryButton label={saving ? 'Saving…' : 'Continue to assessment'} onClick={handleStart} disabled={!canSubmit} loading={saving} />
          <button className={styles.loginLink} onClick={() => router.push('/auth')}>
            Already have an account? <span className={styles.loginHighlight}>Log in</span>
          </button>
        </div>
      </div>
    );
  }

  const s = INTRO_SLIDES[slide];
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <span className={styles.brand}>B12 Health</span>
        <span className={styles.stepCount}>{slide + 1} / {total}</span>
      </div>
      <div className={styles.progressWrap}>
        <div className={styles.progressOuter}><div className={styles.progressFill} style={{ width: `${pct}%` }} /></div>
      </div>

      <div className={styles.slideWrap} key={slide}>
        <span className={styles.kicker}>{s.kicker}</span>
        <div className={styles.emojiRing}><span className={styles.emoji}>{s.emoji}</span></div>
        <h1 className={styles.slideTitle}>{s.title}</h1>
        <p className={styles.slideSubtitle}>{s.subtitle}</p>
      </div>

      <div className={styles.bottomBar}>
        <PrimaryButton label={isLast ? 'Continue' : 'Next'} onClick={goNext} />
        <button className={styles.loginLink} onClick={() => router.push('/auth')}>
          Already have an account? <span className={styles.loginHighlight}>Log in</span>
        </button>
      </div>
    </div>
  );
}
