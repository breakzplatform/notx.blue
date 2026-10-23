import portuguese from './i18n/pt-BR.js';
import english from './i18n/en.js';

export const dictionaries = { 'pt-BR': portuguese, en: english };
export function detectLanguage(saved, browserLanguage = '') {
  if (saved in dictionaries) return saved;
  return browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'pt-BR';
}
export function translate(key, language = 'pt-BR') {
  const value = dictionaries[language]?.[key];
  if (value === undefined) throw new Error(`Missing translation: ${language}/${key}`);
  return value;
}
export function applyLanguage(document, language) {
  document.documentElement.lang = language;
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = translate(element.dataset.i18n, language);
  }
  for (const element of document.querySelectorAll('[data-i18n-content]')) {
    element.setAttribute('content', translate(element.dataset.i18nContent, language));
  }
  for (const element of document.querySelectorAll('[data-i18n-label]')) {
    element.setAttribute('aria-label', translate(element.dataset.i18nLabel, language));
  }
}
