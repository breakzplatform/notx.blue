export const themes = ['light', 'dark', 'terminal'];

export function bindTheme(button, translate) {
  const nameElement = button.querySelector('[data-theme-name]');
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
    try { localStorage.setItem('theme', next); } catch {}
    update();
  });
  button.hidden = false;
  update();
  return update;
}
