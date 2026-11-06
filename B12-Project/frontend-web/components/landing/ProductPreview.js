'use client';
import { useState } from 'react';
import Image from 'next/image';
import { RiskGauge } from '@/components/UI';
import { Reveal } from '@/components/motion';
import { B12_FOODS, DAILY_B12_MCG } from '@/data/b12Foods';
import { useI18n } from '@/i18n/LanguageProvider';
import styles from './ProductPreview.module.css';

// A live preview, not a screenshot: it reuses the app's own gauge and food data, and it
// follows the chosen language. All the numbers are clearly labelled sample data.
const TABS = [
  { id: 'report', label: 'Risk report' },
  { id: 'checkin', label: 'Daily check-in' },
  { id: 'progress', label: 'Progress' },
  { id: 'foods', label: 'Food guide' },
];

const SAMPLE_DRIVERS = [
  { label: 'Diet & intake', pct: 62, tone: 'medium' },
  { label: 'Energy & fatigue', pct: 48, tone: 'medium' },
  { label: 'Nerves & brain', pct: 25, tone: 'low' },
];

const SAMPLE_RATING = [
  { label: 'Very low', emoji: '🪫' },
  { label: 'Low', emoji: '😔' },
  { label: 'Okay', emoji: '😐' },
  { label: 'Good', emoji: '🙂', selected: true },
  { label: 'Great', emoji: '🔋' },
];

const SAMPLE_ENERGY = [1.5, 2, 1.5, 2, 2.5, 2, 3, 2.5, 3, 3, 2.5, 3.5, 3, 3.5];
const SAMPLE_FOODS = ['Milk', 'Curd / yogurt (dahi)', 'Paneer'];

const chartPoints = (values, width, height) => values.map((v, i) => {
  const x = (i / (values.length - 1)) * width;
  const y = height - (v / 4) * height;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
});

function ReportPanel({ t }) {
  return (
    <div className={styles.split}>
      <div className={styles.tile}>
        <p className={styles.kicker}>{t('Overall B12 risk')}</p>
        <div className={styles.scoreRow}>
          <span className={styles.score}>42%</span>
          <span className={styles.badge}>{t('Moderate risk')}</span>
        </div>
        <RiskGauge percentage={42} />
        <p className={styles.note}>{t('A clear score, with what is behind it and what to do next.')}</p>
      </div>
      <div className={styles.tile}>
        <p className={styles.kicker}>{t("What's driving your score")}</p>
        <ul className={styles.drivers}>
          {SAMPLE_DRIVERS.map((d) => (
            <li key={d.label}>
              <div className={styles.driverHead}>
                <span>{t(d.label)}</span>
                <span>{d.pct}%</span>
              </div>
              <div className={styles.track}>
                <div className={`${styles.fill} ${styles[`fill_${d.tone}`]}`} style={{ width: `${d.pct}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CheckinPanel({ t }) {
  return (
    <div className={styles.split}>
      <div className={styles.tile}>
        <p className={styles.kicker}>{t('Question {current} of {total}', { current: 1, total: 5 })}</p>
        <p className={styles.question}>{t('How is your energy today?')}</p>
        <div className={styles.rating}>
          {SAMPLE_RATING.map((r) => (
            <span key={r.label} className={`${styles.ratingItem} ${r.selected ? styles.ratingOn : ''}`}>
              <span aria-hidden="true">{r.emoji}</span>
              <small>{t(r.label)}</small>
            </span>
          ))}
        </div>
      </div>
      <div className={`${styles.tile} ${styles.tileDark}`}>
        <p className={styles.kicker}>{t('Current streak')}</p>
        <p className={styles.streak}>{t('{n} days', { n: 12 })}</p>
        <div className={styles.week} aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => <span key={i} className={i < 6 ? styles.weekDone : ''}>{i < 6 ? '✓' : ''}</span>)}
        </div>
        <p className={styles.noteDark}>{t('Five quick taps, about 30 seconds.')}</p>
      </div>
    </div>
  );
}

function ProgressPanel({ t }) {
  const line = chartPoints(SAMPLE_ENERGY, 320, 110);
  return (
    <div className={styles.tile}>
      <div className={styles.chartHead}>
        <div>
          <p className={styles.chartTitle}>{t('Energy')}</p>
          <p className={styles.note}>{t('Avg {n} / 4', { n: '2.6' })} · {t('higher is better')}</p>
        </div>
        <span className={styles.trendGood}>{t('Improving')}</span>
      </div>
      <svg className={styles.chart} viewBox="0 0 320 118" preserveAspectRatio="none" role="img" aria-label={t('{metric} trend', { metric: t('Energy') })}>
        <defs>
          <linearGradient id="preview-energy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5AB879" stopOpacity="0.35" />
            <stop offset="95%" stopColor="#5AB879" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <polygon points={`0,118 ${line.join(' ')} 320,118`} fill="url(#preview-energy)" />
        <polyline points={line.join(' ')} fill="none" stroke="#2E7D4E" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function FoodsPanel({ t }) {
  const foods = SAMPLE_FOODS.map((name) => B12_FOODS.find((f) => f.name === name)).filter(Boolean);
  return (
    <ul className={styles.foods}>
      {foods.map((f) => (
        <li key={f.name} className={styles.food}>
          <div className={styles.foodPhoto}>
            <Image src={f.image} alt="" fill sizes="(max-width: 700px) 100vw, 240px" className={styles.foodImg} />
          </div>
          <div className={styles.foodBody}>
            <p className={styles.foodName}>{t(f.name)}</p>
            <p className={styles.note}>{t(f.serving)}</p>
            <p className={styles.foodAmount}>
              {f.b12mcg} mcg · {t('{pct} of daily need', { pct: `${Math.round((f.b12mcg / DAILY_B12_MCG) * 100)}%` })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const PANELS = { report: ReportPanel, checkin: CheckinPanel, progress: ProgressPanel, foods: FoodsPanel };

export default function ProductPreview() {
  const { t } = useI18n();
  const [tab, setTab] = useState('report');
  const Panel = PANELS[tab];

  const onKeyDown = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = TABS[(TABS.findIndex((x) => x.id === tab) + step + TABS.length) % TABS.length];
    setTab(next.id);
    e.currentTarget.querySelector(`[data-tab="${next.id}"]`)?.focus();
  };

  return (
    <section className={styles.section} aria-labelledby="preview-heading">
      <Reveal className={styles.intro}>
        <h2 id="preview-heading" className={styles.heading}>{t('See what you get')}</h2>
        <p className={styles.sub}>{t('Your score, your daily check-ins, your trends and foods that fit your diet, all in one place.')}</p>
      </Reveal>

      <Reveal className={styles.window} delay={0.08}>
        <div className={styles.tabs} role="tablist" aria-label={t('App preview')} onKeyDown={onKeyDown}>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`preview-tab-${item.id}`}
              data-tab={item.id}
              aria-selected={tab === item.id}
              aria-controls="preview-panel"
              tabIndex={tab === item.id ? 0 : -1}
              className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`}
              onClick={() => setTab(item.id)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        <div id="preview-panel" key={tab} className={styles.panel} role="tabpanel" aria-labelledby={`preview-tab-${tab}`}>
          <Panel t={t} />
        </div>
        <p className={styles.sampleNote}>{t('Sample data, shown for illustration.')}</p>
      </Reveal>
    </section>
  );
}
