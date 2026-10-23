export function bindTheme(button, label) {
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let chosen = false;
  try { chosen = ['light', 'dark'].includes(localStorage.getItem('theme')); } catch {}
  function update() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    button.textContent = label(next);
  }
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    chosen = true;
    try { localStorage.setItem('theme', next); } catch {}
    update();
  });
  preference.addEventListener('change', event => {
    if (!chosen) document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
    update();
  });
  button.hidden = false;
  update();
  return update;
}
