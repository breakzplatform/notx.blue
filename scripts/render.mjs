import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { apps, site, support, secondary, handles } from '../site-data.js';
import { translate } from '../i18n.js';

export const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
export function renderPage(page, language = 'pt-BR') {
  const text = key => escape(translate(key, language));
  const tagged = (tag, key, attributes = '') => `<${tag} data-i18n="${key}"${attributes}>${text(key)}</${tag}>`;
  const link = (url, key, classes = '') => `<a href="${escape(url)}"${url.startsWith('https:') ? ' target="_blank" rel="noopener"' : ''}${classes ? ` class="${classes}"` : ''} data-i18n="${key}">${text(key)}</a>`;
  const item = entry => `${link(entry.url, entry.label)}${entry.source ? ` ${link(entry.source, 'source', 'source-link')}` : ''}`;
  const footer = `<footer>
    <div class="footer-meta">${link(site.contact, 'contact')} ${link(site.privacy, 'privacy')} <span>${tagged('span', 'by')} ${link(site.author, 'author')}</span></div>
    ${tagged('p', 'support')}
    <div class="support">${support.map(entry => link(entry.url, entry.label, `db-chip db-chip-${entry.className} cast press`)).join('\n')}</div>
  </footer>`;
  let content;
  if (page === 'home') {
    content = `<section class="hero">${tagged('h1', 'hero')}<p class="intro">${tagged('span', 'intro')} ${link(site.author, 'author')}.</p></section>
    <section aria-labelledby="apps-title">${tagged('h2', 'apps', ' id="apps-title" class="section-title"')}
    <div class="app-grid">${apps.map(app => `<article class="app-card cast ink-${app.ink}" id="${app.id}">
      <h3>${escape(app.name)}</h3>${app.status ? tagged('p', app.status, ' class="status"') : ''}
      ${tagged('p', app.description, ' class="description"')}
      ${app.aliases ? `<p class="aliases"><small>${tagged('span', 'alsoAt')} ${app.aliases.map(url => `<a href="${escape(url)}" target="_blank" rel="noopener">${escape(new URL(url).host)}</a>`).join(', ')}</small></p>\n      ` : ''}<div class="card-actions">${link(app.url, 'open', 'button primary press')}${app.source ? link(app.source, 'source') : ''}</div>
      ${app.links ? `<ul class="sublinks">${app.links.map(entry => `<li>${item(entry)}</li>`).join('')}</ul>` : ''}
    </article>`).join('\n')}</div></section>
    <section class="secondary">${tagged('h2', 'secondary')}<ul>${secondary.map(entry => `<li>${item(entry)}</li>`).join('')}</ul></section>
    <section class="handle-list">${tagged('h2', 'handles')}<div>${handles.map(item).join(' ')}</div></section>`;
  } else if (page === 'privacy') {
    const section = (id, heading, paragraphs, ending = '') => `<section id="${id}">${tagged('h2', heading)}${paragraphs.map(key => tagged('p', key)).join('')}${ending}</section>`;
    content = `<article class="policy">${tagged('h1', 'privacy')}${tagged('p', 'updated', ' class="meta"')}${tagged('p', 'privacyIntro', ' class="intro"')}
    ${apps.map(app => `<section id="privacy-${app.id}"><h2>${escape(app.name)}</h2>${tagged('p', `privacy.${app.id}`)}${app.id === 'links' ? tagged('p', 'privacy.linksProxy') : ''}${app.id === 'sorteio' ? tagged('p', 'privacy.sorteioResults') : ''}</section>`).join('\n')}
    ${section('common', 'commonTitle', ['common'])}${section('retention', 'retentionTitle', ['retention'])}${section('rights', 'rightsTitle', ['rights'])}${section('changes', 'changesTitle', ['changes'], link(site.contact, 'contact'))}</article>`;
  } else {
    content = `<section class="hero"><p class="meta">404</p>${tagged('h1', 'notFound')}${tagged('p', 'notFoundDescription', ' class="intro"')}${link(site.home, 'home', 'button primary cast press')}</section>`;
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
  <link rel="stylesheet" href="/assets/tailwind-4.3.3.css">
  <link rel="stylesheet" href="/assets/site-v1.css">
  <script type="module" src="/main.js"></script>
</head>
<body>
  ${link('#main', 'skip', 'skip-link')}
  <div class="shell">
    <header><a class="wordmark" href="/" aria-label="notx.blue">notx<span class="ink-block tilt-cw">.blue</span></a>
      <nav data-i18n-label="navigation" aria-label="${text('navigation')}">
        <button id="language-toggle" class="button cast press" type="button" data-i18n="language" lang="en" hidden>${text('language')}</button>
        <button id="theme-toggle" class="button cast press" type="button" aria-label="${text('themeButtonLabelLight')}" hidden>${text('dark')}</button>
      </nav>
    </header>
    <main id="main" tabindex="-1">${content}</main>
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
