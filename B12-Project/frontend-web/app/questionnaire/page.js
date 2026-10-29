'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp, setRiskResult } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { buildQuestionSet } from '@/data/questions';
import { calculateRisk } from '@/utils/riskCalculator';
import { questionnaireAPI } from '@/services/api';
import styles from './page.module.css';

export default function QuestionnairePage() {
  const { state, dispatch } = useApp();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { user } = state;

  const questions = useMemo(() => {
    return buildQuestionSet(
      user?.age || '18-24',
      user?.gender || 'male',
      user?.dietType || 'vegetarian'
    );
  }, [user?.age, user?.gender, user?.dietType]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverQuestions, setServerQuestions] = useState([]);

  useEffect(() => {
    questionnaireAPI.getQuestions().then(d => {
      if (d?.questions) setServerQuestions(d.questions);
    }).catch(() => {});
  }, []);

  const q = questions[currentIdx] || questions[0];
  const total = questions.length;

  // Sync selectedOption with existing answers for this question
  useEffect(() => {
    if (q && answers[q.id]) {
      setSelectedOption(answers[q.id]);
    } else {
      setSelectedOption(null);
    }
  }, [currentIdx, q, answers]);

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
      return {
        score: 0,
        maxPossible: 0,
        percentage: Math.round(data.percentage || 0),
        level: (data.risk_level || 'low').toUpperCase(),
        breakdown: data.breakdown || {},
        suggestions: data.suggestions || []
      };
    } catch {
      return null;
    }
  };

  const handleSelect = (opt) => {
    setSelectedOption(opt);
    setAnswers(prev => ({ ...prev, [q.id]: opt }));
  };

  const handleNext = async () => {
    const chosen = selectedOption || answers[q.id] || q.options?.[0];
    const updated = { ...answers, [q.id]: chosen };
    setAnswers(updated);

    if (currentIdx === total - 1) {
      setSubmitting(true);
      let result = await submitToServer(updated);
      if (!result) {
        result = calculateRisk(updated, questions, user?.dietType || 'vegetarian');
      }
      dispatch(setRiskResult(result));
      setSubmitting(false);
      router.replace(isAuthenticated ? '/results' : '/score-preview');
      return;
    }

    setCurrentIdx(i => i + 1);
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(i => i - 1);
    } else {
      router.back();
    }
  };

  // Plain English & Why it matters extraction
  const plainEnglish =
    q?.explanation?.simpleText ||
    q?.insight ||
    'This question spots subtle signals of how your body absorbs and utilizes vitamin B12.';

  const whyItMatters =
    q?.explanation?.whyItMatters ||
    (q?.weight >= 3
      ? 'This symptom is strongly correlated with early neurological or energy signaling and has extra weight in your score.'
      : 'B12 is essential for cellular red blood cell formation and nervous system balance.');

  return (
    <div className={styles.questionnairePage}>
      {/* ── Top Header ── */}
      <header className={styles.header}>
        <Link href="/" className={styles.brandTitle}>B12 Health Tracker</Link>
        <button
          type="button"
          className={styles.saveExitBtn}
          onClick={() => router.push(isAuthenticated ? '/dashboard' : '/')}
        >
          Save and exit
        </button>
      </header>

      <main className={styles.container}>
        {/* Progress Tracker */}
        <div className={styles.progressSection}>
          <p className={styles.questionCounter}>
            Question {currentIdx + 1} of {total}
          </p>
          <div className={styles.segmentedTrack}>
            {questions.map((item, idx) => (
              <span
                key={item.id || idx}
                className={`${styles.segmentDash} ${idx <= currentIdx ? styles.dashActive : ''}`}
              />
            ))}
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className={styles.contentGrid}>
          {/* Left Column — Question & Answers */}
          <div className={styles.questionCol}>
            <div className={styles.categoryBadge}>
              {q?.category || 'General Health'}
            </div>

            <h2 className={styles.questionTitle}>
              {q?.question}
            </h2>

            <div className={styles.optionsList}>
              {(q?.options || []).map((opt) => {
                const isSelected = selectedOption?.id === opt.id || answers[q?.id]?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${styles.optionPill} ${isSelected ? styles.optionSelected : ''}`}
                    onClick={() => handleSelect(opt)}
                  >
                    {opt.label.replace(/^[^\w\s]+\s*/, '')}
                  </button>
                );
              })}
            </div>

            <div className={styles.actionButtons}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={handleBack}
              >
                Back
              </button>
              <button
                type="button"
                className={styles.nextBtn}
                onClick={handleNext}
                disabled={submitting}
              >
                {submitting ? 'Calculating…' : currentIdx === total - 1 ? 'See Results' : 'Next'}
              </button>
            </div>
          </div>

          {/* Right Column — Educational Card */}
          <div className={styles.explainerCol}>
            <div className={styles.explainerCard}>
              <div className={styles.explainBlock}>
                <h4 className={styles.explainHeading}>In plain English</h4>
                <p className={styles.explainText}>{plainEnglish}</p>
              </div>

              <div className={styles.explainBlock} style={{ marginTop: '24px' }}>
                <h4 className={styles.explainHeading}>Why it matters</h4>
                <p className={styles.explainText}>{whyItMatters}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
