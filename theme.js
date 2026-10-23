export const themes = ['light', 'dark', 'terminal'];

export function bindTheme(button, translate) {
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const nameElement = button.querySelector('[data-theme-name]');
  let chosen = false;
  try { chosen = themes.includes(localStorage.getItem('theme')); } catch {}
  const current = () => themes.includes(document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : 'light';
  const following = theme => themes[(themes.indexOf(theme) + 1) % themes.length];
  function update() {
    const next = following(current());
    button.dataset.nextTheme = next;
    nameElement.textContent = translate(`theme.${next}`);
    button.setAttribute('aria-label', translate('themeButton').replace('{current}', translate(`theme.${current()}`)).replace('{next}', translate(`theme.${next}`)));
  }
  button.addEventListener('click', () => {
    const next = following(current());
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
