'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { usersAPI, questionnaireAPI, checkinAPI } from '@/services/api';
import { GROUP_INFO, localISODate } from '@/utils/riskCalculator';
import { LAB_STATUS, toPgMl } from '@/utils/labResult';
import {
  COMMON_QUESTIONS, CLINICAL_QUESTIONS, AGE_QUESTIONS, GENDER_QUESTIONS, DIET_B12_QUESTIONS, SUPPLEMENT_QUESTION,
} from '@/data/questions';
import styles from './page.module.css';

// One-page summary a user can save as PDF and take to their doctor. Built for A4 print
// (see @page in globals.css); on screen it previews as a sheet with a print button.

const DAYS = 14;
const LEVEL_LABEL = { LOW: 'Low', MEDIUM: 'Moderate', HIGH: 'High' };
const DIET_LABEL = { vegan: 'Vegan', vegetarian: 'Vegetarian', pescatarian: 'Pescatarian', omnivore: 'Non-vegetarian' };
const GENDER_LABEL = { male: 'Male', female: 'Female', other: 'Other' };

const QUESTION_BY_KEY = Object.fromEntries(
  [
    ...COMMON_QUESTIONS, ...CLINICAL_QUESTIONS, SUPPLEMENT_QUESTION,
    ...Object.values(AGE_QUESTIONS).flat(), ...Object.values(GENDER_QUESTIONS).flat(),
    ...Object.values(DIET_B12_QUESTIONS),
  ].map((q) => [q.id, q]),
);

const fmtDate = (d) => {
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return ''; }
};

// Answers that pushed the score up the most (weighted), with the question as it was asked.
const keyFindings = (answers) => answers
  .map((a) => {
    const snap = a.question_text_snapshot || '';
    const key = (snap.match(/^\[([^\]]+)\]/) || [])[1];
    const q = key ? QUESTION_BY_KEY[key] : null;
    const max = q ? Math.max(...q.options.map((o) => o.score)) : 4;
    const score = Number(a.answer_score) || 0;
    return {
      text: q?.question || snap.replace(/^\[[^\]]+\]\s*/, ''),
      answer: String(a.answer_label || a.answer_value).replace(/^[^\p{L}\p{N}]+/u, ''),
      share: max > 0 ? score / max : 0,
      weighted: score * (Number(a.question_weight) || 1),
    };
  })
  .filter((f) => f.text && f.share >= 0.6)
  .sort((a, b) => b.weighted - a.weighted)
  .slice(0, 8);

const historyItems = (p) => [
  p?.has_pernicious_anemia && 'Pernicious anaemia',
  (p?.has_crohns_disease || p?.has_celiac_disease) && 'Crohn’s or coeliac disease',
  p?.has_gastric_surgery && 'Stomach / bowel surgery',
  p?.takes_metformin && 'Takes metformin',
  p?.takes_ppi && 'Takes acid reducers (PPI / H2 blockers)',
  p?.is_pregnant && 'Pregnant',
  p?.is_breastfeeding && 'Breastfeeding',
].filter(Boolean);

function TrendChart({ days }) {
  const W = 640, H = 150, padL = 26, padR = 8, padT = 8, padB = 22;
  const x = (i) => padL + (i * (W - padL - padR)) / (days.length - 1);
  const y = (v) => padT + ((4 - v) * (H - padT - padB)) / 4;
  const line = (key) => {
    let d = '';
    let pen = false;
    days.forEach((day, i) => {
      const v = day.log?.[key];
      if (v == null) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };
  const series = [
    { key: 'energy_score', label: 'Energy (4 = excellent)', cls: styles.lineEnergy },
    { key: 'fatigue_score', label: 'Tiredness (4 = exhausted)', cls: styles.lineFatigue },
    { key: 'sleep_score', label: 'Sleep (4 = excellent)', cls: styles.lineSleep },
  ];
  return (
    <figure className={styles.chart}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Energy, tiredness and sleep over the last ${days.length} days`}>
        {[0, 2, 4].map((v) => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} className={styles.grid} />
            <text x={padL - 8} y={y(v) + 4} className={styles.axis} textAnchor="end">{v}</text>
          </g>
        ))}
        {/* Every other day, counted back from today so the last label is always "today" */}
        {days.map((day, i) => (days.length - 1 - i) % 2 === 0 && (
          <text key={day.date} x={x(i)} y={H - 6} className={styles.axis} textAnchor="middle">{day.short}</text>
        ))}
        {series.map((s) => <path key={s.key} d={line(s.key)} className={`${styles.line} ${s.cls}`} />)}
        {series.map((s) => days.map((day, i) => day.log?.[s.key] != null && (
          <circle key={`${s.key}${i}`} cx={x(i)} cy={y(day.log[s.key])} r="2.6" className={`${styles.dot} ${s.cls}`} />
        )))}
      </svg>
      <figcaption className={styles.legend}>
        {series.map((s) => (
          <span key={s.key}><i className={`${styles.swatch} ${s.cls}`} aria-hidden="true" />{s.label}</span>
        ))}
      </figcaption>
    </figure>
  );
}

export default function ReportPage() {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [prof, latest, hist] = await Promise.all([
          usersAPI.getProfile(),
          questionnaireAPI.getLatest(),
          checkinAPI.getHistory(DAYS).catch(() => ({ logs: [] })),
        ]);
        const assessment = latest?.assessment || null;
        const detail = assessment ? await questionnaireAPI.getById(assessment.id).catch(() => null) : null;
        if (!cancelled) {
          setData({ user: prof?.user, profile: prof?.profile, assessment, answers: detail?.answers || [], logs: hist?.logs || [] });
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load your report.');
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const days = useMemo(() => {
    const byDate = Object.fromEntries((data?.logs || []).map((l) => [l.checkin_date, l]));
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (DAYS - 1 - i));
      const date = localISODate(d);
      return { date, short: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), log: byDate[date] || null };
    });
  }, [data]);

  const logged = days.filter((d) => d.log);
  const avg = (key) => (logged.length ? (logged.reduce((s, d) => s + d.log[key], 0) / logged.length).toFixed(1) : '—');

  const a = data?.assessment;
  const p = data?.profile;
  const level = String(a?.risk_level || '').toUpperCase();
  const pct = Math.round(Number(a?.risk_percentage) || 0);
  const breakdown = Object.entries(a?.category_breakdown || {})
    .filter(([k, v]) => GROUP_INFO[k] && typeof v === 'number')
    .map(([k, v]) => ({ key: k, label: GROUP_INFO[k].label, pct: Math.round(v) }))
    .sort((x, y) => y.pct - x.pct);
  const findings = keyFindings(data?.answers || []);
  const history = historyItems(p);
  const labPmol = a?.lab_b12_value_pmol != null ? Number(a.lab_b12_value_pmol) : null;
  const lab = labPmol != null ? LAB_STATUS[a.ml_label] : null;

  return (
    <AuthGuard>
      <div className={styles.screen}>
        <div className={styles.toolbar}>
          <Link href="/results" className={styles.back}>← Back to results</Link>
          {a && (
            <button type="button" className={styles.printBtn} onClick={() => window.print()}>
              Save as PDF / Print
            </button>
          )}
        </div>
        {a && <p className={styles.tip}>Tip: in the print window choose “Save as PDF” as the printer to get a file you can email or keep on your phone.</p>}

        <main className={styles.sheet}>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          {!data && !error && <p className={styles.loading} aria-busy="true">Preparing your report…</p>}
          {data && !a && (
            <p className={styles.loading}>
              No assessment yet. <Link href="/questionnaire">Take the assessment</Link> to create your report.
            </p>
          )}

          {a && (
            <>
              <header className={styles.head}>
                <div>
                  <p className={styles.kicker}>B12 Health Tracker · patient-reported summary</p>
                  <h1 className={styles.title}>Vitamin B12 deficiency risk summary</h1>
                </div>
                <p className={styles.generated}>Prepared {fmtDate(new Date())}</p>
              </header>

              <dl className={styles.patient}>
                <div><dt>Name</dt><dd>{p?.name || '—'}</dd></div>
                <div><dt>Age</dt><dd>{p?.age ?? a.age_at_assessment ?? '—'}</dd></div>
                <div><dt>Sex</dt><dd>{GENDER_LABEL[p?.gender || a.gender] || '—'}</dd></div>
                <div><dt>Diet</dt><dd>{DIET_LABEL[p?.diet_type || a.diet_type] || '—'}</dd></div>
                <div><dt>Assessment</dt><dd>{fmtDate(a.completed_at)}</dd></div>
              </dl>

              <div className={styles.twoCol}>
                <section className={styles.block}>
                  <h2>Questionnaire risk score</h2>
                  <p className={styles.score}>
                    <strong>{pct}%</strong>
                    <span className={`${styles.badge} ${styles[`badge_${level.toLowerCase()}`] || ''}`}>{LEVEL_LABEL[level] || level} risk</span>
                  </p>
                  <p className={styles.small}>Scale: low &lt;35 · moderate 35–64 · high 65+. Based on {a.questions_shown} answers.</p>
                  <ul className={styles.bars}>
                    {breakdown.slice(0, 6).map((b) => (
                      <li key={b.key}>
                        <span>{b.label}</span>
                        <span className={styles.barTrack}><span className={styles.barFill} style={{ width: `${Math.max(2, b.pct)}%` }} /></span>
                        <span className={styles.barPct}>{b.pct}%</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className={styles.block}>
                  <h2>Blood test</h2>
                  {lab ? (
                    <>
                      <p className={styles.score}>
                        <strong>{toPgMl(labPmol)} pg/mL</strong>
                        <span className={`${styles.badge} ${styles[`badge_${lab.tone}`]}`}>{lab.label}</span>
                      </p>
                      <p className={styles.small}>= {Math.round(labPmol)} pmol/L · serum B12, entered by the user</p>
                    </>
                  ) : (
                    <p className={styles.small}>No B12 blood test recorded.</p>
                  )}
                  <h2 className={styles.subhead}>Relevant history</h2>
                  {history.length ? (
                    <ul className={styles.list}>{history.map((h) => <li key={h}>{h}</li>)}</ul>
                  ) : (
                    <p className={styles.small}>None reported (absorption conditions, metformin, acid reducers, pregnancy).</p>
                  )}
                </section>
              </div>

              <section className={styles.block}>
                <h2>Answers that raised the score</h2>
                {findings.length ? (
                  <table className={styles.table}>
                    <tbody>
                      {findings.map((f) => (
                        <tr key={f.text}><td>{f.text}</td><td className={styles.answer}>{f.answer}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.small}>No strongly positive answers.</p>
                )}
              </section>

              <section className={styles.block}>
                <h2>Daily check-ins — last {DAYS} days</h2>
                {logged.length ? (
                  <>
                    <dl className={styles.averages}>
                      <div><dt>Days logged</dt><dd>{logged.length}/{DAYS}</dd></div>
                      <div><dt>Energy</dt><dd>{avg('energy_score')}/4</dd></div>
                      <div><dt>Tiredness</dt><dd>{avg('fatigue_score')}/4</dd></div>
                      <div><dt>Mood</dt><dd>{avg('mood_score')}/4</dd></div>
                      <div><dt>Sleep</dt><dd>{avg('sleep_score')}/4</dd></div>
                      <div><dt>Focus</dt><dd>{avg('focus_score')}/4</dd></div>
                    </dl>
                    <TrendChart days={days} />
                  </>
                ) : (
                  <p className={styles.small}>No daily check-ins in the last {DAYS} days.</p>
                )}
              </section>

              <footer className={styles.foot}>
                <p>
                  <strong>For the clinician:</strong> self-reported questionnaire and symptom diary, not a diagnosis.
                  The score is rule-based and not clinically validated. Lab values were typed in by the patient — please check the original report.
                </p>
              </footer>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
