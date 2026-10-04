'use client';
import { useState } from 'react';
import styles from './QuestionExplainer.module.css';

// SVG Diagram Component for various medical & biological concepts
function QuestionVisualDiagram({ type }) {
  switch (type) {
    case 'energy_drain':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Battery Outline */}
          <rect x="15" y="20" width="62" height="40" rx="8" stroke="#3ADFFA" strokeWidth="2.5" fill="#091420" />
          <path d="M80 32C82 32 84 34 84 37V43C84 46 82 48 80 48" stroke="#3ADFFA" strokeWidth="2.5" strokeLinecap="round" />
          {/* Draining indicator - Low Charge */}
          <rect x="21" y="26" width="12" height="28" rx="4" fill="#FF716C" />
          <line x1="39" y1="26" x2="39" y2="54" stroke="#6D7684" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="53" y1="26" x2="53" y2="54" stroke="#6D7684" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Energy spark warning */}
          <path d="M47 8L39 19H49L43 30" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="66" y="44" fill="#FF716C" fontSize="10" fontWeight="bold" fontFamily="sans-serif">LOW</text>
        </svg>
      );

    case 'sleep_recovery':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Moon & Sleep */}
          <path d="M28 20C28 32 38 42 50 42C44 46 36 48 28 46C18 43 12 34 14 24C16 18 20 14 26 12C26.5 14.5 27 17 28 20Z" fill="#3ADFFA" opacity="0.85" />
          {/* Bed icon */}
          <rect x="42" y="34" width="46" height="26" rx="4" stroke="#58F5D1" strokeWidth="2" fill="#091420" />
          <rect x="46" y="27" width="16" height="8" rx="3" fill="#6D7684" />
          <line x1="42" y1="50" x2="88" y2="50" stroke="#58F5D1" strokeWidth="2" />
          <line x1="44" y1="60" x2="44" y2="68" stroke="#58F5D1" strokeWidth="2" strokeLinecap="round" />
          <line x1="86" y1="60" x2="86" y2="68" stroke="#58F5D1" strokeWidth="2" strokeLinecap="round" />
          {/* Low recovery sign */}
          <circle cx="76" cy="20" r="9" fill="#14202F" stroke="#FF716C" strokeWidth="1.5" />
          <text x="76" y="23" textAnchor="middle" fill="#FF716C" fontSize="10" fontWeight="bold">!</text>
        </svg>
      );

    case 'midday_crash':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Chart Axes */}
          <path d="M15 65H88" stroke="#6D7684" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M15 15V65" stroke="#6D7684" strokeWidth="1.5" strokeLinecap="round" />
          {/* Energy Curve with crash */}
          <path d="M16 26Q35 22 45 35T70 60T85 62" stroke="#FF716C" strokeWidth="2.5" strokeLinecap="round" />
          {/* Normal ideal dashed line */}
          <path d="M16 26Q50 28 85 34" stroke="#58F5D1" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          {/* Sun icon for morning, slump arrow */}
          <circle cx="28" cy="18" r="4" fill="#FBBF24" />
          <path d="M68 46L68 56M68 56L63 51M68 56L73 51" stroke="#FF716C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="60" y="73" fill="#A2ACBB" fontSize="8" fontFamily="sans-serif">Midday</text>
        </svg>
      );

    case 'nerve_tingling':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Hand Silhouette */}
          <path d="M35 68V48C35 44 38 41 42 41C45 41 47 43 47 46V33C47 29.5 50 27 53 27C56 27 58 29.5 58 33V35C59 31 62 29 65 30C68 31 69 34 69 38V42C71 40 75 40 76 43C77 46 76 56 71 63C67 68 58 70 48 70H35" stroke="#58F5D1" strokeWidth="2" fill="#091420" strokeLinejoin="round" />
          {/* Tingling / Pins & Needles Sparks */}
          <path d="M52 14L54 18L58 19L54 22L53 26L50 22L46 20L50 18L52 14Z" fill="#FBBF24" />
          <path d="M32 26L33 29L36 30L33 32L32 35L30 32L27 30L30 29L32 26Z" fill="#3ADFFA" />
          <path d="M72 18L73 21L76 22L73 24L72 27L70 24L67 22L70 21L72 18Z" fill="#FBBF24" />
          {/* Sensory pulse waves */}
          <path d="M22 42Q18 48 22 54" stroke="#58F5D1" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 38Q10 48 16 58" stroke="#3ADFFA" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </svg>
      );

    case 'focus_target':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Target concentric rings */}
          <circle cx="50" cy="40" r="30" stroke="#6D7684" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="50" cy="40" r="18" stroke="#3ADFFA" strokeWidth="2" />
          <circle cx="50" cy="40" r="6" fill="#FF716C" />
          {/* Crosshairs drifting */}
          <line x1="50" y1="6" x2="50" y2="74" stroke="#58F5D1" strokeWidth="1.5" opacity="0.7" />
          <line x1="16" y1="40" x2="84" y2="40" stroke="#58F5D1" strokeWidth="1.5" opacity="0.7" />
          {/* Distraction dots */}
          <circle cx="28" cy="24" r="3" fill="#FBBF24" />
          <circle cx="74" cy="56" r="3" fill="#FBBF24" />
          <path d="M28 24L44 36" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M74 56L56 44" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2 2" />
        </svg>
      );

    case 'brain_fog':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Brain profile outline */}
          <path d="M38 60C30 60 25 54 26 47C22 45 20 40 22 35C21 28 27 22 34 23C37 17 46 15 52 18C57 15 67 17 69 23C76 24 80 30 79 36C82 41 80 47 75 49C76 56 70 61 62 60" stroke="#3ADFFA" strokeWidth="2" fill="#091420" />
          {/* Synapses inside */}
          <circle cx="42" cy="38" r="3" fill="#58F5D1" />
          <circle cx="58" cy="36" r="3" fill="#58F5D1" />
          <path d="M42 38L58 36" stroke="#58F5D1" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Cloud / Fog overlay */}
          <path d="M20 54C20 49 25 46 29 47C31 42 37 40 42 42C44 38 52 38 56 41C61 39 68 41 70 46C76 47 79 52 77 56C78 61 74 65 68 65H27C22 65 20 60 20 54Z" fill="#14202F" stroke="#FBBF24" strokeWidth="1.5" opacity="0.9" />
          <text x="49" y="57" textAnchor="middle" fill="#EFF8FF" fontSize="9" fontWeight="bold">FOG</text>
        </svg>
      );

    case 'mood_scale':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Balance fulcrum */}
          <path d="M50 22V62M42 62H58" stroke="#6D7684" strokeWidth="2" strokeLinecap="round" />
          {/* Tilted balance beam */}
          <path d="M22 32L78 46" stroke="#3ADFFA" strokeWidth="2.5" strokeLinecap="round" />
          {/* Left pan (happy) */}
          <line x1="24" y1="33" x2="24" y2="44" stroke="#A2ACBB" strokeWidth="1" />
          <path d="M16 44H32" stroke="#58F5D1" strokeWidth="2" strokeLinecap="round" />
          <circle cx="24" cy="40" r="5" fill="#58F5D1" />
          {/* Right pan (low mood, tilted down) */}
          <line x1="76" y1="46" x2="76" y2="57" stroke="#A2ACBB" strokeWidth="1" />
          <path d="M68 57H84" stroke="#FF716C" strokeWidth="2" strokeLinecap="round" />
          <circle cx="76" cy="53" r="5" fill="#FF716C" />
        </svg>
      );

    case 'b12_sources':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Plate Circle */}
          <circle cx="50" cy="40" r="32" stroke="#58F5D1" strokeWidth="2" fill="#091420" />
          <circle cx="50" cy="40" r="24" stroke="#3ADFFA" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          {/* Fish / Meat / Dairy icons */}
          {/* Fish */}
          <path d="M34 32C40 28 44 32 44 32C44 32 40 36 34 32ZM34 32L30 30V34L34 32Z" fill="#3ADFFA" />
          {/* Egg */}
          <ellipse cx="64" cy="34" rx="6" ry="8" fill="#F4FAFF" />
          <circle cx="64" cy="35" r="3.5" fill="#FBBF24" />
          {/* Dairy / Milk glass */}
          <path d="M46 44H54L53 56H47L46 44Z" fill="#58F5D1" />
          {/* B12 Label Badge */}
          <rect x="36" y="20" width="28" height="12" rx="4" fill="#14202F" stroke="#58F5D1" strokeWidth="1" />
          <text x="50" y="29" textAnchor="middle" fill="#58F5D1" fontSize="8" fontWeight="bold">B-12</text>
        </svg>
      );

    case 'sleep_quality':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Night Sky Horizon */}
          <path d="M15 62H85" stroke="#6D7684" strokeWidth="1" />
          {/* Sleep EEG waveform - Restless jagged line */}
          <path d="M15 48H32L36 32L40 56L44 38L48 50H60L64 28L68 54L72 44H85" stroke="#FF716C" strokeWidth="2" strokeLinejoin="round" />
          {/* Moon */}
          <path d="M32 18C32 24 37 29 43 29C40 31 36 32 32 31C27 29 24 24 25 19C26 16 28 14 31 13C31.5 14.5 32 16 32 18Z" fill="#FBBF24" />
          <text x="65" y="22" fill="#3ADFFA" fontSize="8" fontFamily="sans-serif">Broken sleep</text>
        </svg>
      );

    case 'dizziness_swirl':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head Profile */}
          <path d="M40 68V58C36 56 34 50 34 46C30 46 29 42 30 38C30 32 35 24 45 23C56 22 62 28 62 38C62 46 58 56 52 58V68" stroke="#58F5D1" strokeWidth="2" fill="#091420" />
          {/* Vertigo / Spinning spirals above head */}
          <path d="M48 20C40 20 34 15 36 10C38 6 46 6 52 8C60 10 66 18 64 24C62 30 52 32 46 30" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
          {/* Stars */}
          <path d="M68 14L69 16L72 16L70 18L71 20L68 19L66 20L67 18L65 16L67 16L68 14Z" fill="#3ADFFA" />
          <path d="M26 22L27 24L29 24L27 25L28 27L26 26L24 27L25 25L23 24L25 24L26 22Z" fill="#3ADFFA" />
        </svg>
      );

    case 'meal_clock':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Clock face */}
          <circle cx="42" cy="40" r="26" stroke="#3ADFFA" strokeWidth="2" fill="#091420" />
          <circle cx="42" cy="40" r="3" fill="#58F5D1" />
          {/* Skipped meal hour marker */}
          <line x1="42" y1="40" x2="42" y2="22" stroke="#58F5D1" strokeWidth="2" strokeLinecap="round" />
          <line x1="42" y1="40" x2="56" y2="40" stroke="#58F5D1" strokeWidth="2" strokeLinecap="round" />
          {/* Plate crossed out on right */}
          <circle cx="76" cy="40" r="14" stroke="#6D7684" strokeWidth="1.5" />
          <line x1="68" y1="32" x2="84" y2="48" stroke="#FF716C" strokeWidth="2.5" strokeLinecap="round" />
          <text x="42" y="73" textAnchor="middle" fill="#A2ACBB" fontSize="8">Missed meals</text>
        </svg>
      );

    case 'fast_food':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Burger buns */}
          <path d="M30 38C30 26 70 26 70 38H30Z" fill="#FBBF24" opacity="0.8" />
          <rect x="28" y="42" width="44" height="6" rx="3" fill="#58F5D1" />
          <rect x="30" y="50" width="40" height="8" rx="4" fill="#FBBF24" opacity="0.8" />
          {/* Nutrients low meter */}
          <rect x="76" y="24" width="8" height="34" rx="3" stroke="#6D7684" strokeWidth="1" />
          <rect x="78" y="46" width="4" height="10" rx="1" fill="#FF716C" />
          <text x="50" y="68" textAnchor="middle" fill="#FF716C" fontSize="9" fontWeight="bold">Low Micronutrients</text>
        </svg>
      );

    case 'irregular_clock':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="40" r="28" stroke="#6D7684" strokeWidth="2" fill="#091420" />
          {/* Erratic arrow pointers */}
          <path d="M50 40L34 26" stroke="#FF716C" strokeWidth="2" strokeLinecap="round" />
          <path d="M50 40L68 52" stroke="#3ADFFA" strokeWidth="2" strokeLinecap="round" />
          <path d="M50 40L62 24" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
          {/* Circular shift arrows */}
          <path d="M26 32Q34 16 50 16" stroke="#FF716C" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="50" cy="40" r="3" fill="#EFF8FF" />
          <text x="50" y="74" textAnchor="middle" fill="#A2ACBB" fontSize="8">Shifting Bedtimes</text>
        </svg>
      );

    case 'work_desk':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Laptop */}
          <rect x="30" y="32" width="40" height="24" rx="2" stroke="#3ADFFA" strokeWidth="2" fill="#091420" />
          <path d="M22 56H78L75 60H25L22 56Z" fill="#6D7684" />
          {/* Screen glow & busy tasks */}
          <line x1="36" y1="38" x2="52" y2="38" stroke="#58F5D1" strokeWidth="2" />
          <line x1="36" y1="44" x2="62" y2="44" stroke="#58F5D1" strokeWidth="2" />
          {/* Overtime clock */}
          <circle cx="76" cy="22" r="10" stroke="#FF716C" strokeWidth="1.5" fill="#14202F" />
          <polyline points="76,16 76,22 80,22" stroke="#FF716C" strokeWidth="1.5" />
          <text x="50" y="72" textAnchor="middle" fill="#A2ACBB" fontSize="8">Busy schedule</text>
        </svg>
      );

    case 'caffeine_boost':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Coffee Mug */}
          <path d="M24 30H54V54C54 60 48 64 42 64H36C30 64 24 60 24 54V30Z" fill="#091420" stroke="#58F5D1" strokeWidth="2" />
          <path d="M54 36C60 36 64 40 64 46C64 52 58 54 54 54" stroke="#58F5D1" strokeWidth="2" />
          {/* Steam / Boost wave */}
          <path d="M32 24Q30 18 34 14" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M42 22Q44 16 40 12" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
          {/* Spike & Crash chart next to it */}
          <path d="M66 64V24" stroke="#6D7684" strokeWidth="1" />
          <path d="M66 52Q72 20 78 30T90 60" stroke="#FF716C" strokeWidth="2" />
          <text x="80" y="70" textAnchor="middle" fill="#FF716C" fontSize="7">Energy Crash</text>
        </svg>
      );

    case 'battery_zero':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="18" y="24" width="60" height="34" rx="6" stroke="#FF716C" strokeWidth="2" fill="#091420" />
          <path d="M78 34C80 34 82 36 82 39V43C82 46 80 48 78 48" stroke="#FF716C" strokeWidth="2" strokeLinecap="round" />
          {/* Blinking 0% Warning */}
          <line x1="26" y1="30" x2="36" y2="52" stroke="#FF716C" strokeWidth="2" />
          <text x="52" y="46" textAnchor="middle" fill="#FF716C" fontSize="12" fontWeight="bold">EMPTY</text>
          <text x="50" y="70" textAnchor="middle" fill="#A2ACBB" fontSize="8">Drained after work</text>
        </svg>
      );

    case 'aging_absorption':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stomach silhouette with slow absorption filter */}
          <path d="M30 20C30 32 32 40 38 48C46 58 56 60 64 54C72 48 74 36 72 28C70 20 62 18 56 22C52 26 48 26 42 22C36 18 30 14 30 20Z" stroke="#3ADFFA" strokeWidth="2" fill="#091420" />
          {/* Reduced absorption arrows */}
          <path d="M50 32V42M50 42L46 38M50 42L54 38" stroke="#FF716C" strokeWidth="2" strokeLinecap="round" />
          <circle cx="50" cy="50" r="3" fill="#FBBF24" />
          <text x="50" y="72" textAnchor="middle" fill="#58F5D1" fontSize="8">Reduced Uptake with Age</text>
        </svg>
      );

    case 'gut_health':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Stomach & digestion */}
          <path d="M32 18C30 28 32 38 40 46C48 54 58 56 66 50C74 44 76 34 72 26C68 18 60 16 54 20C50 24 46 24 42 20" stroke="#58F5D1" strokeWidth="2" fill="#091420" />
          {/* Bloating bubbles */}
          <circle cx="48" cy="34" r="4" stroke="#FBBF24" strokeWidth="1.5" fill="none" />
          <circle cx="58" cy="38" r="5" stroke="#FBBF24" strokeWidth="1.5" fill="none" />
          <circle cx="44" cy="44" r="3" stroke="#FBBF24" strokeWidth="1.5" fill="none" />
          <text x="50" y="68" textAnchor="middle" fill="#FBBF24" fontSize="8">Bloating / Indigestion</text>
        </svg>
      );

    case 'balance_walk':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Footsteps pathway wavering */}
          <ellipse cx="32" cy="58" rx="5" ry="8" fill="#3ADFFA" opacity="0.6" transform="rotate(-15 32 58)" />
          <ellipse cx="50" cy="44" rx="5" ry="8" fill="#FF716C" transform="rotate(25 50 44)" />
          <ellipse cx="64" cy="28" rx="5" ry="8" fill="#3ADFFA" opacity="0.6" transform="rotate(-20 64 28)" />
          {/* Wavering balance trajectory */}
          <path d="M32 58Q56 50 50 44T64 28" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="3 3" />
          <text x="50" y="74" textAnchor="middle" fill="#FF716C" fontSize="8">Unsteady gait</text>
        </svg>
      );

    case 'limb_numbness':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Leg & Foot silhouette */}
          <path d="M42 16V46L54 58H68C70 58 72 60 70 62C68 64 64 65 52 65C40 65 36 56 36 46V16" stroke="#3ADFFA" strokeWidth="2" fill="#091420" />
          {/* Numbness / sensory disconnection line */}
          <line x1="30" y1="46" x2="60" y2="46" stroke="#FF716C" strokeWidth="2" strokeDasharray="3 2" />
          {/* Tingling waves below */}
          <path d="M42 54Q48 50 54 54" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M44 60Q50 56 56 60" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />
          <text x="50" y="75" textAnchor="middle" fill="#FF716C" fontSize="8">Loss of sensation</text>
        </svg>
      );

    case 'blood_flow':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blood Drop */}
          <path d="M40 18C40 18 24 38 24 50C24 60 32 66 40 66C48 66 56 60 56 50C56 38 40 18 40 18Z" fill="#FF716C" opacity="0.85" />
          {/* Depletion indicator */}
          <path d="M68 28V54" stroke="#3ADFFA" strokeWidth="2" strokeLinecap="round" />
          <path d="M64 48L68 54L72 48" stroke="#3ADFFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="68" y="24" textAnchor="middle" fill="#58F5D1" fontSize="8">Iron & B12</text>
          <text x="40" y="75" textAnchor="middle" fill="#A2ACBB" fontSize="8">High Blood Loss</text>
        </svg>
      );

    case 'period_cycle':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Calendar grid */}
          <rect x="24" y="20" width="52" height="42" rx="4" stroke="#3ADFFA" strokeWidth="2" fill="#091420" />
          <line x1="24" y1="32" x2="76" y2="32" stroke="#3ADFFA" strokeWidth="1.5" />
          {/* Highlighted heavy/fatigue days */}
          <circle cx="34" cy="42" r="5" fill="#FF716C" />
          <circle cx="48" cy="42" r="5" fill="#FF716C" />
          <circle cx="62" cy="42" r="5" fill="#FF716C" />
          <circle cx="34" cy="54" r="4" fill="#6D7684" />
          <circle cx="48" cy="54" r="4" fill="#6D7684" />
          {/* Battery drain mini */}
          <path d="M48 10L44 16H52L46 22" stroke="#FBBF24" strokeWidth="1.5" />
          <text x="50" y="72" textAnchor="middle" fill="#FF716C" fontSize="8">Cycle Fatigue</text>
        </svg>
      );

    case 'cycle_calendar':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="22" y="20" width="56" height="42" rx="4" stroke="#58F5D1" strokeWidth="2" fill="#091420" />
          <line x1="22" y1="32" x2="78" y2="32" stroke="#58F5D1" strokeWidth="1.5" />
          {/* Scattered question dates */}
          <circle cx="32" cy="42" r="4" fill="#FF716C" />
          <text x="50" y="45" textAnchor="middle" fill="#FBBF24" fontSize="11" fontWeight="bold">?</text>
          <circle cx="68" cy="54" r="4" fill="#FF716C" />
          <text x="50" y="73" textAnchor="middle" fill="#A2ACBB" fontSize="8">Irregular Dates</text>
        </svg>
      );

    case 'cycle_dizziness':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Seated figure with dizzy halo */}
          <circle cx="48" cy="30" r="10" stroke="#58F5D1" strokeWidth="2" fill="#091420" />
          <path d="M48 40V62M48 52L62 62" stroke="#58F5D1" strokeWidth="2" strokeLinecap="round" />
          {/* Orbit rings around head */}
          <ellipse cx="48" cy="24" rx="18" ry="6" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="3 2" transform="rotate(-15 48 24)" />
          <text x="50" y="74" textAnchor="middle" fill="#FF716C" fontSize="8">Low blood oxygen</text>
        </svg>
      );

    case 'pregnancy_care':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Maternal silhouette profile */}
          <circle cx="44" cy="26" r="8" stroke="#3ADFFA" strokeWidth="2" fill="#091420" />
          <path d="M44 34C40 38 36 44 36 54C42 54 54 56 56 46C56 40 50 36 44 34Z" stroke="#3ADFFA" strokeWidth="2" fill="#091420" />
          {/* Baby heart pulse */}
          <circle cx="44" cy="46" r="4" fill="#FF716C" />
          {/* 2x Nutrient requirement tag */}
          <rect x="58" y="24" width="28" height="18" rx="4" fill="#14202F" stroke="#58F5D1" strokeWidth="1" />
          <text x="72" y="36" textAnchor="middle" fill="#58F5D1" fontSize="9" fontWeight="bold">2x B12</text>
          <text x="50" y="72" textAnchor="middle" fill="#A2ACBB" fontSize="8">Higher Demand</text>
        </svg>
      );

    case 'male_stamina':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Gauge dial */}
          <path d="M22 54A32 32 0 0 1 78 54" stroke="#6D7684" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M22 54A32 32 0 0 1 40 28" stroke="#FF716C" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Needle pointing low */}
          <circle cx="50" cy="54" r="5" fill="#58F5D1" />
          <line x1="50" y1="54" x2="34" y2="34" stroke="#FF716C" strokeWidth="2.5" strokeLinecap="round" />
          <text x="50" y="70" textAnchor="middle" fill="#FF716C" fontSize="8" fontWeight="bold">Low Physical Stamina</text>
        </svg>
      );

    case 'muscle_strength':
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Arm / Bicep profile */}
          <path d="M24 56C24 46 28 38 38 34C44 30 52 30 58 38L70 48C74 52 74 58 68 60H34C28 60 24 58 24 56Z" stroke="#58F5D1" strokeWidth="2" fill="#091420" />
          {/* Weakness downward arrow */}
          <path d="M46 20V36M46 36L41 31M46 36L51 31" stroke="#FF716C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="50" y="72" textAnchor="middle" fill="#FF716C" fontSize="8">Reduced Muscle Force</text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 80" className={styles.visualSvg} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="40" r="24" stroke="#58F5D1" strokeWidth="2" fill="#091420" />
          <text x="50" y="46" textAnchor="middle" fill="#58F5D1" fontSize="20" fontWeight="bold">💡</text>
        </svg>
      );
  }
}

export default function QuestionExplainer({ explanation, category }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!explanation) return null;

  const { simpleText, whyItMatters, visualType, keySigns } = explanation;

  return (
    <div className={styles.explainerCard}>
      <button
        type="button"
        className={styles.toggleBtn}
        onClick={() => setIsExpanded(prev => !prev)}
        aria-expanded={isExpanded}
      >
        <div className={styles.toggleLeft}>
          <span className={styles.badgeIcon}>💡</span>
          <div>
            <span className={styles.toggleTitle}>What does this question mean?</span>
            <span className={styles.toggleHint}>— Visual guide & plain English</span>
          </div>
        </div>
        <div className={styles.toggleRight}>
          <span>{isExpanded ? 'Hide explanation' : 'Show explanation'}</span>
          <span className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}>▼</span>
        </div>
      </button>

      {isExpanded && (
        <div className={styles.contentWrapper}>
          <div className={styles.visualContainer}>
            <div className={styles.visualSvgWrap}>
              <QuestionVisualDiagram type={visualType} />
            </div>
            <span className={styles.visualTag}>{category || 'Visual Guide'}</span>
          </div>

          <div className={styles.textSection}>
            <div className={styles.simpleSection}>
              <h4 className={styles.labelHeading}>
                <span>📖</span> In Plain English:
              </h4>
              <p className={styles.simpleText}>{simpleText}</p>
            </div>

            {whyItMatters && (
              <div className={styles.whySection}>
                <p className={styles.whyText}>
                  <strong>Why it matters:</strong> {whyItMatters}
                </p>
              </div>
            )}

            {keySigns && keySigns.length > 0 && (
              <ul className={styles.keySignsList}>
                {keySigns.map((sign, idx) => (
                  <li key={idx} className={styles.keySignItem}>
                    <span className={styles.signBullet}>•</span>
                    <span>{sign}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
