'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, setRiskResult } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { buildQuestionSet } from '@/data/questions';
import { buildInterstitialContent } from '@/data/questionnaireInterstitials';
import { calculateRisk } from '@/utils/riskCalculator';
import { questionnaireAPI } from '@/services/api';
import { ProgressBar, CategoryBadge, InsightCard, PrimaryButton, SecondaryButton } from '@/components/UI';
import styles from './page.module.css';

export default function QuestionnairePage() {
  const { state, dispatch } = useApp();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { user } = state;

  const questions = buildQuestionSet(user?.age || '25-40', user?.gender || 'male');

  const [currentIdx,      setCurrentIdx]      = useState(0);
  const [answers,         setAnswers]         = useState({});
  const [selected,        setSelected]        = useState(null);
  const [showInsight,     setShowInsight]     = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [showInter,       setShowInter]       = useState(false);
  const [interEnd,        setInterEnd]        = useState(0);
  const [animKey,         setAnimKey]         = useState(0);
  const interShownRef = useRef(new Set());
  const [serverQuestions, setServerQuestions] = useState([]);

  useEffect(() => {
    questionnaireAPI.getQuestions().then(d => { if (d?.questions) setServerQuestions(d.questions); }).catch(() => {});
  }, []);

  const q      = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const interPayload = useMemo(() => {
    if (!showInter || !interEnd) return null;
    return buildInterstitialContent(interEnd, questions);
  }, [showInter, interEnd, questions]);

  const transition = (cb) => {
    setAnimKey(k => k + 1);
    setTimeout(cb, 50);
  };

  const mapToServer = (localAnswers) => {
    if (!serverQuestions.length) return null;
    return Object.entries(localAnswers).map(([lid, opt]) => {
      const lq = questions.find(qq => qq.id === lid);
      const sq = serverQuestions.find(s => s.question_text === lq?.question);
      return { questionId: sq?.id || 0, answerValue: opt.id };
    }).filter(a => a.questionId > 0);
  };

  const submitToServer = async (allAnswers) => {
    const sa = mapToServer(allAnswers);
    if (!sa?.length) return null;
    try {
      const data = await questionnaireAPI.submit(sa);
      return { score: 0, maxPossible: 0, percentage: Math.round(data.percentage || 0), level: (data.risk_level || 'low').toUpperCase(), breakdown: data.breakdown || {}, suggestions: data.suggestions || [] };
    } catch { return null; }
  };

  const advanceToNext = async (chosen) => {
    const updated = { ...answers, [q.id]: chosen };
    setAnswers(updated);

    if (currentIdx === questions.length - 1) {
      setSubmitting(true);
      let result = await submitToServer(updated);
      if (!result) result = calculateRisk(updated, questions, user?.dietType || 'omnivore');
      dispatch(setRiskResult(result));
      setSubmitting(false);
      router.replace(isAuthenticated ? '/results' : '/score-preview');
      return;
    }

    const done = currentIdx + 1;
    const needsInter = done % 3 === 0 && done < questions.length && !interShownRef.current.has(done);
    if (needsInter) {
      interShownRef.current.add(done);
      transition(() => { setInterEnd(done); setShowInter(true); setSelected(null); setShowInsight(false); });
      return;
    }
    transition(() => { setCurrentIdx(i => i + 1); setSelected(null); setShowInsight(false); });
  };

  const selectOption = (opt) => {
    setSelected(opt);
    setShowInsight(true);
    setTimeout(() => advanceToNext(opt), 750);
  };

  const continueInter = () => {
    transition(() => { setShowInter(false); setCurrentIdx(interEnd); setSelected(null); setShowInsight(false); });
  };

  const goBack = () => {
    if (showInter) {
      interShownRef.current.delete(interEnd);
      transition(() => { setShowInter(false); const bi = interEnd - 1; setCurrentIdx(bi); const pid = questions[bi]?.id; setSelected(pid ? answers[pid] || null : null); setShowInsight(!!(pid && answers[pid])); });
      return;
    }
    if (currentIdx === 0) { router.back(); return; }
    transition(() => { const pid = questions[currentIdx - 1].id; setCurrentIdx(i => i - 1); setSelected(answers[pid] || null); setShowInsight(!!answers[pid]); });
  };

  const skipQuestion = async () => {
    if (showInter) { continueInter(); return; }
    if (isLast) {
      setSubmitting(true);
      let result = await submitToServer(answers);
      if (!result) result = calculateRisk(answers, questions, user?.dietType || 'omnivore');
      dispatch(setRiskResult(result));
      setSubmitting(false);
      router.replace(isAuthenticated ? '/results' : '/score-preview');
    } else {
      transition(() => { setCurrentIdx(i => i + 1); setSelected(null); setShowInsight(false); });
    }
  };

  if (submitting) return (
    <div className={styles.page}>
      <div className={styles.loading}>
        <span className="spinner" style={{ width: 40, height: 40 }} />
        <p>Analyzing your responses…</p>
      </div>
    </div>
  );

  if (showInter && interPayload) {
    const p = interPayload;
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={goBack}>←</button>
          <div className={styles.progressWrap}><ProgressBar progress={interEnd} total={questions.length} /></div>
        </div>
        <div className={styles.scroll}>
          <p className={styles.interLead}>Short insight · then continue</p>
          <div className={styles.interHero}>
            <span className={styles.interTag}>{p.heroTag}</span>
            <div className={styles.interRing}><span className={styles.interEmoji}>{p.heroEmoji}</span></div>
            <h2 className={styles.interTitle}>{p.title}</h2>
            <p className={styles.interSub}>{p.subtitle}</p>
          </div>
          {p.items.map((item, i) => (
            <div key={i} className={styles.insightBlock}>
              <div className={styles.insightHead}><span className={styles.insightCat}>{item.category}</span><div className={styles.insightLine} /></div>
              <p className={styles.insightQ}>{item.questionPreview}</p>
              <p className={styles.insightWhyLabel}>Why we ask</p>
              <p className={styles.insightSig}>{item.significance}</p>
            </div>
          ))}
          <div className={styles.closingCard}><p className={styles.closingText}>{p.closing}</p></div>
          <PrimaryButton label="Continue" onClick={continueInter} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={goBack}>←</button>
        <div className={styles.progressWrap}><ProgressBar progress={currentIdx + 1} total={questions.length} /></div>
      </div>
      <div className={styles.scroll}>
        <div key={animKey} className={styles.qWrap}>
          <CategoryBadge icon={q.categoryIcon} label={q.category} />
          <p className={styles.qNum}>Question {currentIdx + 1} of {questions.length}</p>
          <p className={styles.qMeta}>{questions.length - currentIdx - 1 === 0 ? 'Last question' : `${questions.length - currentIdx - 1} questions left`} · ~{Math.max(1, Math.ceil((questions.length - currentIdx) / 12))} min</p>
          <h2 className={styles.qText}>{q.question}</h2>
          <div className={styles.options}>
            {q.options.map(opt => {
              const sel = selected?.id === opt.id;
              return (
                <button key={opt.id} className={`${styles.optCard} ${sel ? styles.optSelected : ''}`} onClick={() => selectOption(opt)}>
                  {opt.emoji && <span className={styles.optEmoji}>{opt.emoji}</span>}
                  <span className={styles.optLabel}>{opt.label}</span>
                  {sel && <span className={styles.checkCircle}>✓</span>}
                </button>
              );
            })}
          </div>
          {showInsight && q.insight && <InsightCard text={q.insight} />}
          {currentIdx > 0 && currentIdx < questions.length - 1 && (
            <p className={styles.motiv}>{currentIdx < questions.length / 2 ? "You're doing great — steady progress." : 'Almost there — a few more to go.'}</p>
          )}
        </div>
      </div>
      <div className={styles.bottomBar}><SecondaryButton label={isLast ? 'Skip and see results' : 'Skip question'} onClick={skipQuestion} /></div>
    </div>
  );
}
