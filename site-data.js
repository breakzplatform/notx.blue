export const site = {
  origin: 'https://notx.blue',
  author: 'https://bsky.app/profile/joseli.to',
  contact: 'mailto:abuse@notx.blue',
  privacy: '/privacy',
  home: '/',
};

// Listed apps need an `ink`: a design-system ink name (resolved to --ink-<name>/--on-<name>) or
// 'links-green', the one literal colour (#2E6B3F under white text) defined in
// assets/site-v2.css. `listed: false` keeps an app out of the home page and /privacy:
// `localized: true` means the name and URL differ per language and come from the dictionaries
// (app.<id>.name, .url, .aliasName, .aliasUrl); name/url/aliases then hold the pt-BR defaults.
// enquete is a placeholder page and trending is discontinued.
export const apps = [
  { id: 'down', name: 'down.blue', description: 'app.down', url: 'https://down.blue', source: 'https://github.com/breakzplatform/downloader.notx.blue', ink: 'down', aliases: ['https://downloader.notx.blue'], extension: { chrome: 'https://down.blue/chrome', firefox: 'https://addons.mozilla.org/firefox/addon/down-blue/', source: 'https://github.com/breakzplatform/down.blue-extension' }, links: [
    { label: 'shortcut', url: 'https://www.icloud.com/shortcuts/dd6be3060b4d4d4caf45f494feb40a95' },
    { label: 'downBot', url: 'https://bsky.app/profile/down.blue', source: 'https://github.com/breakzplatform/down-blue-bot' },
  ] },
  { id: 'sorteio', name: 'sorteio.blue', description: 'app.sorteio', url: 'https://sorteio.blue', source: 'https://github.com/breakzplatform/skypicker.site', ink: 'magenta', localized: true, aliases: ['https://skypicker.site'] },
  { id: 'share', name: 'share.notx.blue', description: 'app.share', url: 'https://share.notx.blue', source: 'https://github.com/breakzplatform/share.notx.blue', ink: 'purple' },
  { id: 'links', name: 'links.notx.blue', description: 'app.links', url: 'https://links.notx.blue', source: 'https://github.com/breakzplatform/links.notx.blue', ink: 'links-green' },
  { id: 'handles', name: 'handles.notx.blue', description: 'app.handles', url: 'https://handles.notx.blue', source: 'https://github.com/breakzplatform/bsky-public-handles', ink: 'orange' },
  { id: 'enquete', name: 'enquete.notx.blue', description: 'app.enquete', url: 'https://enquete.notx.blue', status: 'soon', listed: false },
  { id: 'trending', name: 'trending.notx.blue', description: 'app.trending', url: 'https://github.com/breakzplatform/trending.notx.blue', openLabel: 'viewRepository', status: 'archived', listed: false },
];

export const secondary = [
  { group: 'labels', label: 'orkut', url: 'https://bsky.app/profile/etiquetasdoorkut.bsky.social', source: 'https://github.com/breakzplatform/orkut' },
  { group: 'bots', label: 'scorigami', url: 'https://bsky.app/profile/nflscorigami.bsky.social' },
  { group: 'bots', label: 'week', url: 'https://bsky.app/profile/semanaencerrada.bsky.social' },
  { group: 'bots', label: 'hours', url: 'https://bsky.app/profile/horariosoficiais.bsky.social' },
  { group: 'bots', label: 'bolsonaro', url: 'https://bsky.app/profile/obolsonaroestapreso.com' },
];
export const handles = [
  { label: 'pessoas', url: 'https://pessoas.dev' },
  { label: 'ceuazul', url: 'https://ceuazul.online' },
];
export const support = [
  { label: 'pix', url: 'https://pix.joseli.to', className: 'pix' },
  { label: 'coffee', url: 'https://buymeacoffee.com/joselito', className: 'coffee' },
  { label: 'sponsors', url: 'https://github.com/sponsors/breakzplatform', className: 'sponsors' },
];

export function externalUrls() {
  const urls = new Set();
  function visit(value) {
    if (typeof value === 'string' && value.startsWith('https://')) urls.add(value);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  }
  [site, apps, secondary, handles, support].forEach(visit);
  return [...urls];
}
