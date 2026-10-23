(() => {
  let saved;
  try { saved = localStorage.getItem('theme'); } catch {}
  const theme = saved === 'light' || saved === 'dark'
    ? saved
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
})();
