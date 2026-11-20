import { writeFile, readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { apps, site, support, secondary, handles } from '../site-data.js';
import { translate } from '../i18n.js';

// /assets/* is served immutable for a year, so each stylesheet URL carries a
// hash of its content: a changed file gets a new URL instead of a stale cache.
const asset = path => `${path}?v=${createHash('sha256').update(readFileSync(new URL(`..${path}`, import.meta.url))).digest('hex').slice(0, 10)}`;
export const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export function renderPage(page, language = 'pt-BR') {
  const text = key => escape(translate(key, language));
  const tagged = (tag, key, attributes = '') => `<${tag} data-i18n="${key}"${attributes}>${text(key)}</${tag}>`;
  const link = (url, key, classes = '') => `<a href="${escape(url)}"${url.startsWith('https:') ? ' target="_blank" rel="noopener"' : ''}${classes ? ` class="${classes}"` : ''} data-i18n="${key}">${text(key)}</a>`;
  const codeIcon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></svg>';
  const neutralButton = (url, key, classes, icon = '') => `<a href="${escape(url)}" target="_blank" rel="noopener" class="notx-btn nx-source ${classes} cast press">${icon}<span data-i18n="${key}">${text(key)}</span></a>`;
  const sourceButton = (url, classes) => neutralButton(url, 'source', classes, codeIcon);
  const sourceLink = url => link(url, 'source', 'nx-source-link');
  const item = entry => `${link(entry.url, entry.label)}${entry.source ? ` ${sourceLink(entry.source)}` : ''}`;
  const panel = (id, titleKey, body, { first = false, wrapper = 'section', headingTag = 'h2', bodyClasses = 'p-4' } = {}) =>
    `<${wrapper} class="cast notx-panel${first ? ' mt-15' : ''}" aria-labelledby="${id}"><${headingTag} class="notx-panel-head" id="${id}">${tagged('span', titleKey)}</${headingTag}><div class="${bodyClasses}">${body}</div></${wrapper}>`;
  // Same rows as the other notx apps (sumidos.notx.blue): who made it, the
  // fine print, the support chips, then the policy and contact links.
  const footer = `<footer class="notx-footer">
    <p class="notx-meta notx-foot">${tagged('span', 'tagline')}<span>${tagged('span', 'by')} ${link(site.author, 'author')}</span></p>
    ${tagged('p', 'fromBrazil', ' class="notx-note text-center"')}
    <div class="flex flex-wrap items-center justify-center gap-2">
      ${tagged('span', 'support', ' class="notx-meta"')}
      ${support.map(entry => link(entry.url, entry.label, `notx-chip cast press bg-ink-${entry.ink} text-on-${entry.ink}`)).join('\n      ')}
    </div>
    <p class="notx-meta notx-foot"><span>${link(site.privacy, 'privacy')}</span><span>${link(site.status, 'status')}</span><span>${link(site.contact, 'contact')}</span></p>
  </footer>`;
  const iconAttributes = 'width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"';
  const toggles = `<div class="flex flex-wrap items-center justify-end gap-2 pt-4">
      <button id="language-toggle" class="notx-btn notx-btn-sm cast press" type="button" lang="${language === 'en' ? 'pt-BR' : 'en'}"><span data-i18n="language">${text('language')}</span></button>
      <button id="theme-toggle" class="notx-btn notx-btn-sm cast press theme-switch" type="button" data-next-theme="dark" aria-label="${escape(translate('themeButton', language).replace('{current}', translate('theme.light', language)).replace('{next}', translate('theme.dark', language)))}">
        <svg class="icon icon-moon" ${iconAttributes}><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>
        <svg class="icon icon-terminal" ${iconAttributes}><path d="M12 19h8" /><path d="m4 17 6-6-6-6" /></svg>
        <svg class="icon icon-sun" ${iconAttributes}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
        <span data-theme-name>${text('theme.dark')}</span>
      </button>
    </div>`;
  const wordmark = page === 'home'
    ? '<h1 class="notx-wordmark"><span class="ink-block tilt-cw">!X</span>.blue</h1>'
    : '<div class="notx-wordmark"><a href="/" aria-label="notx.blue" data-no-invert><span class="ink-block tilt-cw">!X</span>.blue</a></div>';
  let content;
  if (page === 'home') {
    const appRow = app => {
      const name = key => app.localized ? translate(`app.${app.id}.${key}`, language) : null;
      const localizedLink = (key, urlKey, classes = '') => `<a href="${escape(name(urlKey))}" target="_blank" rel="noopener"${classes ? ` class="${classes}"` : ''} data-i18n="app.${app.id}.${key}" data-i18n-href="app.${app.id}.${urlKey}">${escape(name(key))}</a>`;
      const aliasLink = url => app.localized ? localizedLink('aliasName', 'aliasUrl') : `<a href="${escape(url)}" target="_blank" rel="noopener">${escape(new URL(url).host)}</a>`;
      const openButton = app.localized
        ? `<a href="${escape(name('url'))}" target="_blank" rel="noopener" class="notx-btn notx-btn-primary cast press" data-i18n="${app.openLabel || 'open'}" data-i18n-href="app.${app.id}.url">${text(app.openLabel || 'open')}</a>`
        : link(app.url, app.openLabel || 'open', 'notx-btn notx-btn-primary cast press');
      return `<li class="nx-app cast-flat nx-ink-${app.ink}" id="${app.id}">
        <div>
          <h3 class="nx-app-name"${app.localized ? ` data-i18n="app.${app.id}.title"` : ''}>${escape(app.localized ? name('title') : app.name.replace(/\.notx\.blue$/, ''))}</h3>
          ${tagged('p', app.description, ' class="nx-app-text"')}${app.status ? `\n          ${tagged('p', app.status, ' class="nx-app-aside"')}` : ''}${app.aliases ? `\n          <p class="nx-app-aside">${tagged('span', 'alsoAt')} ${app.aliases.map(aliasLink).join(', ')}</p>` : ''}
        </div>
        <div class="nx-app-actions">${app.source ? sourceButton(app.source, '') : ''}${openButton}</div>${app.rows ? app.rows.map(row => `
        <div class="nx-app-extension">${tagged('span', row.label, ' class="nx-micro text-text-3"')}${row.links.map(([key, url]) => link(url, key)).join('')}${row.source ? sourceLink(row.source) : ''}</div>`).join('') : ''}
      </li>`;
    };
    const linkPanel = (id, titleKey, entries) => panel(id, titleKey, `<ul class="nx-links nx-link-list">${entries.map(entry => `<li>${item(entry)}</li>`).join('')}</ul>`);
    content = `${panel('projects-title', 'panelTitle', `<p class="mt-0 mb-5">${tagged('span', 'lead')} ${link(site.author, 'author')}.</p>
      <ul class="nx-apps">
      ${apps.filter(app => app.listed !== false).map(appRow).join('\n      ')}
      </ul>`, { first: true })}
    ${['labels', 'bots'].map(group => linkPanel(`${group}-title`, group, secondary.filter(entry => entry.group === group))).join('\n    ')}
    ${linkPanel('handles-title', 'handles', handles)}`;
  } else if (page === 'privacy') {
    const section = (id, heading, paragraphs, ending = '') => `<section id="${id}">${tagged('h2', heading)}${paragraphs.map(key => tagged('p', key)).join('')}${ending}</section>`;
    content = panel('privacy-title', 'privacy', `${tagged('p', 'updated', ' class="nx-micro"')}${tagged('p', 'privacyIntro')}
    ${apps.filter(app => app.listed !== false || app.privacy).map(app => `<section id="privacy-${app.id}">${app.localized ? tagged('h2', `app.${app.id}.name`) : `<h2>${escape(new URL(app.url).host)}</h2>`}${tagged('p', `privacy.${app.id}`)}</section>`).join('\n    ')}
    ${section('common', 'commonTitle', ['common'])}${section('retention', 'retentionTitle', ['retention'])}${section('changes', 'changesTitle', ['changes'], link(site.contact, 'contact'))}`, { first: true, wrapper: 'article', headingTag: 'h1', bodyClasses: 'nx-policy p-4' });
  } else {
    content = panel('not-found-title', 'notFound', `${tagged('p', 'notFoundDescription', ' class="mt-0 mb-5"')}${link(site.home, 'home', 'notx-btn notx-btn-primary cast press')}`, { first: true, headingTag: 'h1' });
  }
  const title = page === 'home' ? 'homeTitle' : page === 'privacy' ? 'privacyTitle' : 'notFoundTitle';
  const description = page === 'home' ? 'homeDescription' : page === 'privacy' ? 'privacyDescription' : 'notFoundDescription';
  const canonical = site.origin + (page === 'home' ? '/' : page === 'privacy' ? '/privacy' : '/404.html');
  return `<!doctype html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${tagged('title', title)}
  <meta name="description" data-i18n-content="${description}" content="${text(description)}">
  ${page === '404' ? '<meta name="robots" content="noindex">' : ''}
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="notx.blue">
  <meta property="og:title" data-i18n-content="${title}" content="${text(title)}">
  <meta property="og:description" data-i18n-content="${description}" content="${text(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${site.origin}/share.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" data-i18n-content="${title}" content="${text(title)}">
  <meta name="twitter:description" data-i18n-content="${description}" content="${text(description)}">
  <meta name="twitter:image" content="${site.origin}/share.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <script src="/theme-boot.js"></script>
  <link rel="preload" href="https://static.joseli.to/assets/fonts/cmu-serif-700-roman.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="https://static.joseli.to/assets/fonts/cmu-sans-serif-500-roman.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="https://static.joseli.to/assets/fonts/cmu-sans-serif-700-roman.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="https://static.joseli.to/assets/fonts/cmu-typewriter-text-500-roman.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="https://static.joseli.to/assets/fonts/cmu-typewriter-text-700-roman.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${asset('/assets/tailwind-4.3.3.css')}">
  <link rel="stylesheet" href="${asset('/assets/site-v2.css')}">
  <script type="module" src="/main.js"></script>
</head>
<body>
  ${link('#main', 'skip', 'skip-link')}
  <div class="notx-page">
    ${toggles}
    <main id="main" tabindex="-1">
      ${wordmark}
      ${content}
    </main>
    ${footer}
  </div>
</body>
</html>
`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [page, filename] of [['home', 'index.html'], ['privacy', 'privacy.html'], ['404', '404.html']]) {
    const html = renderPage(page);
    if (process.argv.includes('--check')) {
      if (await readFile(filename, 'utf8') !== html) throw new Error(`Run npm run build:html: ${filename} is stale`);
    } else await writeFile(filename, html);
  }
}
