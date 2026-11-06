'use client';
import { Fragment, createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

// ─── Language system ──────────────────────────────────────────────────────────
// Strings are keyed by their English text: t('Log in') returns 'Log in' in English and
// the Hindi / Marathi entry from i18n/translations otherwise. A missing entry falls back
// to English, so nothing ever renders blank. Answer ids and scoring never pass through
// here, so the language can't change a score. Run `npm run i18n:check` after adding text.

export const LOCALES = [
  { code: 'en', label: 'English', intl: undefined },
  { code: 'hi', label: 'हिन्दी', intl: 'hi-IN' },
  // -u-nu-latn keeps digits Latin, matching the rest of the app (mr defaults to Devanagari digits)
  { code: 'mr', label: 'मराठी', intl: 'mr-IN-u-nu-latn' },
];

const STORAGE_KEY = 'b12_locale';
const TRANSLATION_INDEX = { hi: 0, mr: 1 };

const listeners = new Set();
const readLocale = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LOCALES.some((l) => l.code === saved) ? saved : 'en';
  } catch { return 'en'; }
};
const subscribe = (listener) => {
  listeners.add(listener);
  window.addEventListener('storage', listener); // keeps other open tabs in step
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};
const writeLocale = (code) => {
  try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ }
  listeners.forEach((l) => l());
};

const fill = (text, vars) => (vars
  ? text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match))
  : text);

// Numbers that aren't part of a word, so the 12 in "B12" stays put.
const NUMBER = /(?<![A-Za-z\d.])\d+(?:\.\d+)?/g;

/**
 * Finds the translation for an English string. Text built with numbers already in it
 * (API insights, stored alerts) matches an entry written with {0}, {1}… placeholders.
 */
const lookup = (dict, index, text) => {
  const exact = dict[text];
  if (exact) return exact[index];
  const numbers = [];
  const pattern = text.replace(NUMBER, (n) => {
    numbers.push(n);
    return `{${numbers.length - 1}}`;
  });
  const entry = numbers.length ? dict[pattern] : null;
  return entry ? fill(entry[index], { ...numbers }) : text;
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // English on the server and during hydration; the saved language applies right after.
  const locale = useSyncExternalStore(subscribe, readLocale, () => 'en');
  const [dict, setDict] = useState(null);

  useEffect(() => {
    document.documentElement.lang = locale;
    // Loaded on demand so English visitors don't download the translations.
    if (locale !== 'en' && !dict) {
      import('./translations').then((m) => setDict(m.default)).catch(() => {});
    }
  }, [locale, dict]);

  const t = useCallback((text, vars) => {
    if (typeof text !== 'string' || !text) return text;
    const index = TRANSLATION_INDEX[locale];
    if (index === undefined || !dict) return fill(text, vars);
    return fill(lookup(dict, index, text), vars);
  }, [locale, dict]);

  /** Like t(), but placeholders can be React elements (links, <strong>…). */
  const rich = useCallback((text, vars) => t(text).split(/(\{\w+\})/).map((part, i) => {
    const name = part.match(/^\{(\w+)\}$/)?.[1];
    return <Fragment key={i}>{name && name in vars ? vars[name] : part}</Fragment>;
  }), [t]);

  const formatDate = useCallback((date, options) => {
    const intl = LOCALES.find((l) => l.code === locale)?.intl;
    return new Date(date).toLocaleDateString(intl, options);
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale: writeLocale, t, rich, formatDate }),
    [locale, t, rich, formatDate],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useI18n = () => useContext(LanguageContext);
