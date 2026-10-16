
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ms from './locales/ms.json';

const savedLanguage =
  typeof window !== 'undefined'
    ? localStorage.getItem('cakna-language')
    : null;

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ms: { translation: ms },
  },
  lng: savedLanguage === 'ms' ? 'ms' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('cakna-language', language);
  }
});

export default i18n;
