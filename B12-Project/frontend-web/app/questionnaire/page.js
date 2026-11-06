'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotionConfig } from 'framer-motion';
import { useApp, setRiskResult, setPendingAnswers } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/i18n/LanguageProvider';
import { buildQuestionSet, dropHiddenAnswers, getAgeGroup, getVisibleQuestions } from '@/data/questions';
import { SECTIONS, SECTION_FACTS, getSectionId } from '@/data/questionnaireSections';
import { calculateRisk, toServerAnswers, normalizeServerResult } from '@/utils/riskCalculator';
import { questionnaireAPI } from '@/services/api';
import QuestionVisual from '@/components/questionnaire/QuestionVisual';
import { LoadingScreen, toast } from '@/components/UI';
import { EASE } from '@/components/motion';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import styles from './page.module.css';

const PROGRESS_KEY = 'b12_questionnaire_progress';
const PROGRESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SECONDS_PER_QUESTION = 12;

// Direction-aware slide: `custom` is +1 going forward, -1 going back. Passing it through
// AnimatePresence means the outgoing card exits the right way, not the way it entered.
const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir * -40 }),
};
const fadeVariants = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };

const cleanLabel = (label) => label.replace(/^[^\p{L}\p{N}]+\s*/u, '');

const readProgress = () => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const writeProgress = (data) => {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...data, updatedAt: Date.now() })); } catch { /* ignore */ }
};
const clearProgress = () => {
  try { localStorage.removeItem(PROGRESS_KEY); } catch { /* ignore */ }
};

export default function QuestionnairePage() {
  const { t, rich } = useI18n();
  const { state, dispatch } = useApp();
  const { isAuthenticated, isLoading: authLoading, user: authUser } = useAuth();
  const router = useRouter();
  const reduceMotion = useReducedMotionConfig();

  // Profile used to personalise the question set
  const profile = useMemo(() => {
    if (isAuthenticated) {
      return {
        age: authUser?.age || state.user?.age,
        gender: authUser?.gender || state.user?.gender,
        dietType: authUser?.dietType || state.user?.dietType,
      };
    }
    return state.user || {};
  }, [isAuthenticated, authUser, state.user]);

  const ready = state.hydrated && !authLoading && (!isAuthenticated || authUser);
  const profileComplete = !!(profile?.age && profile?.gender && profile?.dietType);

  useEffect(() => {
    if (ready && !profileComplete) router.replace('/onboarding?next=questionnaire');
  }, [ready, profileComplete, router]);

  const allQuestions = useMemo(
    () => (profileComplete ? buildQuestionSet(profile.age, profile.gender, profile.dietType) : []),
    [profileComplete, profile.age, profile.gender, profile.dietType],
  );
  const setKey = profileComplete ? `${getAgeGroup(profile.age)}|${profile.gender}|${profile.dietType}` : '';

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});      // { questionId: option }
  const [direction, setDirection] = useState(1);
  const [breakFor, setBreakFor] = useState(null);  // section id whose fact card is showing
  const [seenBreaks, setSeenBreaks] = useState([]);
  const [phase, setPhase] = useState('loading');   // loading | asking | analysing
  const [resumed, setResumed] = useState(false);
  const [showWhyMobile, setShowWhyMobile] = useState(false);
  const [whyClosing, setWhyClosing] = useState(false);
  const submittingRef = useRef(false);

  // Some answers rule later questions out, so everything below works from the visible set
  const questions = useMemo(() => getVisibleQuestions(allQuestions, answers), [allQuestions, answers]);

  // Restore saved progress once the question set is known
  useEffect(() => {
    if (!allQuestions.length || phase !== 'loading') return;
    const saved = readProgress();
    if (saved && saved.setKey === setKey && Date.now() - (saved.updatedAt || 0) < PROGRESS_TTL_MS) {
      const savedAnswers = {};
      Object.entries(saved.answers || {}).forEach(([qid, optId]) => {
        const q = allQuestions.find((x) => x.id === qid);
        const opt = q?.options.find((o) => o.id === optId);
        if (opt) savedAnswers[qid] = opt;
      });
      const restored = dropHiddenAnswers(allQuestions, savedAnswers);
      if (Object.keys(restored).length > 0) {
        const visible = getVisibleQuestions(allQuestions, restored);
        setAnswers(restored);
        // Resume at the first question that hasn't been answered yet
        const firstOpen = visible.findIndex((x) => !restored[x.id]);
        setIdx(firstOpen === -1 ? visible.length - 1 : firstOpen);
        setSeenBreaks(saved.seenBreaks || []);
        setResumed(true);
      }
    }
    setPhase('asking');
  }, [allQuestions, setKey, phase]);

  // Persist progress as the user goes
  useEffect(() => {
    if (phase !== 'asking' || !setKey) return;
    const plain = {};
    Object.entries(answers).forEach(([k, v]) => { plain[k] = v.id; });
    if (Object.keys(plain).length) writeProgress({ setKey, answers: plain, idx, seenBreaks });
  }, [answers, idx, seenBreaks, setKey, phase]);

  const total = questions.length;
  const q = questions[idx];
  const selected = q ? answers[q.id] : null;
  const answeredCount = Object.keys(answers).length;
  const progressPct = total ? Math.round((answeredCount / total) * 100) : 0;
  const minutesLeft = Math.max(1, Math.ceil(((total - answeredCount) * SECONDS_PER_QUESTION) / 60));
  const currentSection = q ? getSectionId(q.id) : null;

  const sectionsInSet = useMemo(() => {
    const present = new Set(questions.map((x) => getSectionId(x.id)));
    return SECTIONS.filter((s) => present.has(s.id)).map((s) => {
      const qs = questions.filter((x) => getSectionId(x.id) === s.id);
      const done = qs.every((x) => answers[x.id]);
      return { ...s, done, count: qs.length };
    });
  }, [questions, answers]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const finish = useCallback(async (finalAnswers) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPhase('analysing');

    const local = calculateRisk(finalAnswers, questions, profile.dietType);
    const serverAnswers = toServerAnswers(finalAnswers, questions);
    let result = { ...local, completedAt: new Date().toISOString(), synced: false };

    // Give the "analysing" screen a moment so the transition feels intentional
    const minDelay = new Promise((r) => setTimeout(r, reduceMotion ? 300 : 1600));

    if (isAuthenticated) {
      try {
        const data = await questionnaireAPI.submit(serverAnswers);
        const serverResult = normalizeServerResult(data);
        if (serverResult) result = serverResult;
        dispatch(setPendingAnswers(null));
      } catch (err) {
        dispatch(setPendingAnswers(serverAnswers));
        toast(t("We couldn't save to your account just now — your result is kept on this device and will sync automatically."), 'info');
      }
    } else {
      dispatch(setPendingAnswers(serverAnswers));
    }

    await minDelay;
    dispatch(setRiskResult(result));
    clearProgress();
    router.replace(isAuthenticated ? '/results?new=1' : '/score-preview');
  }, [questions, profile.dietType, isAuthenticated, dispatch, router, reduceMotion, t]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!q || !answers[q.id]) return;
    if (idx === total - 1) {
      finish(answers);
      return;
    }
    const nextSection = getSectionId(questions[idx + 1].id);
    if (nextSection !== currentSection && SECTION_FACTS[currentSection] && !seenBreaks.includes(currentSection)) {
      setDirection(1);
      setBreakFor(currentSection);
      setSeenBreaks((s) => [...s, currentSection]);
      return;
    }
    setDirection(1);
    // Absolute, not i + 1: the outgoing card is still clickable while it animates out, and a
    // second click there must not skip the next question.
    setIdx(idx + 1);
    setShowWhyMobile(false);
    setWhyClosing(false);
  }, [q, answers, idx, total, questions, currentSection, seenBreaks, finish]);

  const continueFromBreak = useCallback(() => {
    setBreakFor(null);
    setDirection(1);
    setIdx(Math.min(idx + 1, total - 1));
    setShowWhyMobile(false);
    setWhyClosing(false);
  }, [idx, total]);

  const goBack = useCallback(() => {
    if (breakFor) { setBreakFor(null); return; }
    if (idx === 0) { router.push(isAuthenticated ? '/dashboard' : '/onboarding'); return; }
    setDirection(-1);
    setIdx(idx - 1);
    setShowWhyMobile(false);
    setWhyClosing(false);
  }, [breakFor, idx, router, isAuthenticated]);

  const toggleWhy = () => {
    if (!showWhyMobile) { setWhyClosing(false); setShowWhyMobile(true); return; }
    if (reduceMotion) { setShowWhyMobile(false); return; }
    setWhyClosing(true); // let the 200 ms whyOut fade play, then hide
  };

  useEffect(() => {
    if (!whyClosing) return undefined;
    const t = setTimeout(() => { setWhyClosing(false); setShowWhyMobile(false); }, 200);
    return () => clearTimeout(t);
  }, [whyClosing]);

  const choose = useCallback((opt) => {
    if (!q) return;
    // Changing an answer can hide later questions; their answers must not survive to scoring
    setAnswers((prev) => dropHiddenAnswers(allQuestions, { ...prev, [q.id]: opt }));
  }, [q, allQuestions]);

  const startOver = () => {
    clearProgress();
    setAnswers({});
    setIdx(0);
    setSeenBreaks([]);
    setResumed(false);
  };

  const saveAndExit = () => {
    if (answeredCount > 0) toast(t('Progress saved — pick up where you left off any time.'), 'success');
    router.push(isAuthenticated ? '/dashboard' : '/');
  };

  // ── Keyboard shortcuts: 1–9 choose, Enter continue, ← back ────────────────
  useEffect(() => {
    if (phase !== 'asking') return undefined;
    const onKey = (e) => {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (breakFor) {
        if (e.key === 'Enter') { e.preventDefault(); continueFromBreak(); }
        return;
      }
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n) && q && n >= 1 && n <= q.options.length) {
        e.preventDefault();
        choose(q.options[n - 1]);
      } else if (e.key === 'Enter' && selected) {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goBack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, breakFor, q, selected, choose, goNext, goBack, continueFromBreak]);

  if (!ready || !profileComplete || phase === 'loading' || !q) return <LoadingScreen />;

  if (phase === 'analysing') return <AnalysingScreen reduceMotion={reduceMotion} />;

  const slide = {
    custom: direction,
    variants: reduceMotion ? fadeVariants : slideVariants,
    initial: 'enter',
    animate: 'center',
    exit: 'exit',
  };

  const maxScore = Math.max(...q.options.map((o) => o.score || 0)) || 1;
  const showMeter = q.type === 'frequency' || q.type === 'gradient';
  const isLast = idx === total - 1;
  const why = q.explanation || {};

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <Link href={isAuthenticated ? '/dashboard' : '/'} className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">B12</span>
          <span className={styles.brandText}>Health Tracker</span>
        </Link>
        <div className={styles.headerActions}>
          <LanguageSwitcher />
          <button type="button" className={styles.exitBtn} onClick={saveAndExit}>
            {t('Save & exit')}
          </button>
        </div>
      </header>

      {/* ── Progress ── */}
      <section aria-label={t('Your progress')}>
      <div className={styles.progressWrap}>
        <div className={styles.progressMeta}>
          <span className={styles.progressCount}>
            {breakFor ? t('Quick break') : t('Question {current} of {total}', { current: idx + 1, total })}
          </span>
          <span className={styles.progressTime}>
            {progressPct}% · {t('about {n} min left', { n: minutesLeft })}
          </span>
        </div>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label={t('Assessment progress')}
        >
          <motion.div
            className={styles.progressFill}
            initial={false}
            // Full-width bar slid in from the left: transform-only and keeps its rounded end
            animate={{ x: `${Math.max(progressPct, 2) - 100}%` }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: EASE }}
          />
        </div>
        <ol className={styles.sections} aria-label={t('Sections')}>
          {sectionsInSet.map((s) => {
            const active = s.id === (breakFor || currentSection);
            return (
              <li
                key={s.id}
                className={`${styles.sectionChip} ${active ? styles.sectionActive : ''} ${s.done ? styles.sectionDone : ''}`}
                aria-current={active ? 'step' : undefined}
              >
                <motion.span
                  key={s.done ? 'done' : 'todo'}
                  aria-hidden="true"
                  className={styles.sectionIcon}
                  initial={s.done && !reduceMotion ? { scale: 0.5, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  {s.done ? '✓' : s.icon}
                </motion.span>
                <span className={styles.sectionLabel}>{t(s.label)}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {resumed && !breakFor && (
        <div className={styles.resumeBar}>
          <span>{t('Welcome back — we saved your answers so you can continue where you left off.')}</span>
          <button type="button" onClick={startOver} className={styles.linkBtn}>{t('Start over')}</button>
        </div>
      )}
      </section>

      <main className={styles.main}>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          {breakFor ? (
            <motion.section
              key={`break-${breakFor}`}
              className={styles.factCard}
              {...slide}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
              aria-live="polite"
            >
              {/* Understated "section complete" beat: the emoji settles in and a small tick draws */}
              <motion.div
                className={styles.factEmoji}
                aria-hidden="true"
                initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.36, delay: 0.12, ease: EASE }}
              >
                {SECTION_FACTS[breakFor].emoji}
              </motion.div>
              <p className={styles.factKicker}>
                <Tick className={styles.factTick} draw={!reduceMotion} delay={0.3} />
                {t('Section complete')} · {t(SECTIONS.find((s) => s.id === breakFor)?.label)}
              </p>
              <h2 className={styles.factTitle}>{t(SECTION_FACTS[breakFor].title)}</h2>
              <p className={styles.factBody}>{t(SECTION_FACTS[breakFor].body)}</p>
              <div className={styles.factStat}>
                <span className={styles.factStatValue}>{t(SECTION_FACTS[breakFor].stat)}</span>
                <span className={styles.factStatLabel}>{t(SECTION_FACTS[breakFor].statLabel)}</span>
              </div>
              <div className={styles.factActions}>
                <button type="button" className={styles.backBtn} onClick={goBack}>{t('Back')}</button>
                <button type="button" className={styles.nextBtn} onClick={continueFromBreak} autoFocus>
                  {t('Continue')}
                </button>
              </div>
            </motion.section>
          ) : (
            <motion.div
              key={q.id}
              className={styles.grid}
              {...slide}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
            >
              {/* ── Question card ── */}
              <section className={styles.questionCard} aria-labelledby="question-title">
                <span className={styles.categoryBadge}>
                  <span aria-hidden="true">{q.categoryIcon}</span> {t(q.category)}
                </span>
                <h1 id="question-title" className={styles.questionTitle}>{t(q.question)}</h1>

                <div className={styles.options} role="radiogroup" aria-labelledby="question-title">
                  {q.options.map((opt, i) => {
                    const isSel = selected?.id === opt.id;
                    const level = (opt.score || 0) / maxScore;
                    return (
                      <motion.button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={isSel}
                        className={`${styles.option} ${isSel ? styles.optionSelected : ''}`}
                        onClick={() => choose(opt)}
                        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                        transition={{ duration: 0.15 }}
                      >
                        <span className={styles.optionKey} aria-hidden="true">{i + 1}</span>
                        <span className={styles.optionLabel}>{t(cleanLabel(opt.label))}</span>
                        {showMeter && (
                          <span className={styles.meter} aria-hidden="true">
                            {[0.25, 0.5, 0.75, 1].map((t) => (
                              <span key={t} className={`${styles.meterBar} ${level >= t - 0.01 ? styles.meterOn : ''}`} />
                            ))}
                          </span>
                        )}
                        {/* Small pop + tick when chosen; keyed so it replays on each new selection */}
                        <motion.span
                          key={isSel ? 'on' : 'off'}
                          className={styles.radioDot}
                          aria-hidden="true"
                          initial={isSel && !reduceMotion ? { scale: 0.7 } : false}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.24, ease: EASE }}
                        >
                          {isSel && <Tick className={styles.radioTick} draw={!reduceMotion} delay={0.05} />}
                        </motion.span>
                      </motion.button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selected && q.insight && (
                    <motion.div
                      className={styles.insight}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE }}
                      role="note"
                    >
                      <span className={styles.insightIcon} aria-hidden="true">💡</span>
                      <p><strong>{t('Good to know:')}</strong> {t(q.insight)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={styles.actions}>
                  <button type="button" className={styles.backBtn} onClick={goBack}>
                    ← {t('Back')}
                  </button>
                  <button
                    type="button"
                    className={styles.nextBtn}
                    onClick={goNext}
                    disabled={!selected}
                  >
                    {t(isLast ? 'See my results' : 'Continue')}
                  </button>
                </div>
                <p className={styles.kbdHint}>
                  {rich('Tip: press {keys} to answer and {enter} to continue.', {
                    keys: <><kbd>1</kbd>–<kbd>{q.options.length}</kbd></>,
                    enter: <kbd>Enter</kbd>,
                  })}
                </p>

                <button
                  type="button"
                  className={styles.whyToggle}
                  onClick={toggleWhy}
                  aria-expanded={showWhyMobile && !whyClosing}
                  aria-controls="why-panel"
                >
                  {t(showWhyMobile && !whyClosing ? 'Hide' : 'Why are we asking this?')}
                </button>
              </section>

              {/* ── Learn panel ── */}
              <aside
                id="why-panel"
                className={`${styles.whyPanel} ${showWhyMobile ? styles.whyPanelOpen : ''} ${whyClosing ? styles.whyPanelClosing : ''}`}
                aria-label={t('Why we ask this question')}
              >
                <div className={styles.visualTile}>
                  <QuestionVisual type={why.visualType} className={styles.visualSvg} />
                </div>
                <h2 className={styles.whyHeading}>{t('Why we ask')}</h2>
                <div className={styles.whyBlock}>
                  <h3>{t('In plain words')}</h3>
                  <p>{t(why.simpleText || q.insight)}</p>
                </div>
                {why.whyItMatters && (
                  <div className={styles.whyBlock}>
                    <h3>{t('How it links to B12')}</h3>
                    <p>{t(why.whyItMatters)}</p>
                  </div>
                )}
                {why.keySigns?.length > 0 && (
                  <div className={styles.whyBlock}>
                    <h3>{t('What it can look like')}</h3>
                    <ul className={styles.signs}>
                      {why.keySigns.map((s) => <li key={s}>{t(s)}</li>)}
                    </ul>
                  </div>
                )}
                {q.weight >= 4 && (
                  <p className={styles.weightNote}>
                    {t('This is a strong risk signal, so it counts more in your score.')}
                  </p>
                )}
                {currentSection === 'you' && (
                  <p className={styles.weightNote}>
                    {t('Asked because of your age or gender — these factors change B12 needs.')}
                  </p>
                )}
              </aside>
            </motion.div>
          )}
        </AnimatePresence>

        <p className={styles.disclaimer}>
          {t('Educational screening only — not a diagnosis. Your answers stay private.')}
        </p>
      </main>
    </div>
  );
}

const ANALYSIS_STEPS = [
  'Weighing your symptoms',
  'Checking diet and absorption factors',
  'Building your personal suggestions',
];

function AnalysingScreen({ reduceMotion }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (reduceMotion) return undefined;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 520);
    return () => clearInterval(t);
  }, [reduceMotion]);

  return (
    <div className={styles.analysing} role="status" aria-live="polite">
      <div className={styles.pulse} aria-hidden="true">
        <span>B12</span>
      </div>
      <h1 className={styles.analysingTitle}>{t('Analysing your answers…')}</h1>
      <ul className={styles.analysingSteps}>
        {ANALYSIS_STEPS.map((label, i) => (
          <motion.li
            key={label}
            className={i <= step ? styles.stepDone : ''}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.12, ease: EASE }}
          >
            <span aria-hidden="true">{i < step ? '✓' : i === step ? '•' : '○'}</span> {t(label)}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/** A check mark that draws itself (stroke only) unless motion is reduced. */
function Tick({ className, draw = true, delay = 0 }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <motion.path
        d="M3.5 8.5l3 3 6-7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={draw ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.26, delay, ease: EASE }}
      />
    </svg>
  );
}
