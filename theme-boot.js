(() => {
  let saved;
  try { saved = localStorage.getItem('theme'); } catch {}
  document.documentElement.dataset.theme = ['light', 'dark', 'terminal'].includes(saved) ? saved : 'light';
})();
