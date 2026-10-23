(() => {
  let saved;
  try { saved = localStorage.getItem('theme'); } catch {}
  let theme = ['light', 'dark', 'terminal'].includes(saved) ? saved : undefined;
  if (!theme) {
    let dark = false;
    try { dark = window.matchMedia('(prefers-color-scheme: dark)').matches; } catch {}
    theme = dark ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
})();
