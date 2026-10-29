(() => {
  let saved;
  try { saved = localStorage.getItem('theme'); } catch {}
  document.documentElement.dataset.theme = ['light', 'dark', 'terminal'].includes(saved) ? saved : 'light';
  // The HTML is in Portuguese; main.js translates it to English after load. Hide
  // the page until then (data-i18n-pending), with a timeout in case main.js fails.
  let language;
  try { language = localStorage.getItem('lang'); } catch {}
  if (language !== 'pt-BR' && (language === 'en' || String(globalThis.navigator?.language).toLowerCase().startsWith('en'))) {
    document.documentElement.dataset.i18nPending = '';
    setTimeout(() => delete document.documentElement.dataset.i18nPending, 3000);
  }
})();
