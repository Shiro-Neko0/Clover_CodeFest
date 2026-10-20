import { useCallback, useSyncExternalStore } from 'react';
import en from './locales/en.json';
import ms from './locales/ms.json';

const resources = { en, ms };
const listeners = new Set();

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem('cakna-language');
    return saved === 'en' || saved === 'ms' ? saved : 'ms';
  } catch {
    return 'ms';
  }
}

let language = readSavedLanguage();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getLanguage() {
  return language;
}

function changeLanguage(nextLanguage) {
  if (!resources[nextLanguage] || language === nextLanguage) return;
  language = nextLanguage;
  try {
    localStorage.setItem('cakna-language', nextLanguage);
  } catch {
    // The selection still applies for this page session when storage is unavailable.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = nextLanguage;
  listeners.forEach((listener) => listener());
}

function translate(key, options = {}) {
  const template = resources[language][key] ?? resources.en[key] ?? key;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => options[name] ?? '');
}

if (typeof document !== 'undefined') document.documentElement.lang = language;

export function useTranslation() {
  const currentLanguage = useSyncExternalStore(subscribe, getLanguage, () => 'ms');
  const t = useCallback((key, options) => {
    const template = resources[currentLanguage][key] ?? resources.en[key] ?? key;
    return template.replace(/\{\{(\w+)\}\}/g, (_, name) => options?.[name] ?? '');
  }, [currentLanguage]);
  return {
    t,
    i18n: { language: currentLanguage, changeLanguage }
  };
}

const i18n = { changeLanguage, get language() { return language; }, t: translate };

export default i18n;
