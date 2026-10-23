import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { apps, externalUrls, support } from '../site-data.js';
import { dictionaries, translate, detectLanguage, applyLanguage } from '../i18n.js';
import { renderPage, escape } from '../scripts/render.mjs';

const pages = ['index.html', 'privacy.html', '404.html'];
const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('dictionaries have parity and no empty strings', () => {
  assert.deepEqual(Object.keys(dictionaries.en).sort(), Object.keys(dictionaries['pt-BR']).sort());
  for (const dictionary of Object.values(dictionaries)) {
    for (const value of Object.values(dictionary)) assert.ok(typeof value === 'string' && value.trim());
  }
});

test('HTML matches the renderer and all translation keys exist', async () => {
  for (const [index, page] of pages.entries()) {
    const html = await read(page);
    assert.equal(html, renderPage(['home', 'privacy', '404'][index]));
    for (const [, key] of html.matchAll(/data-i18n(?:-content|-label)?="([^"]+)"/g)) {
      for (const language of Object.keys(dictionaries)) assert.ok(translate(key, language));
    }
    assert.match(html, /<html lang="pt-BR">/);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>|\son\w+=|\sstyle=/i);
    for (const [, attributes] of html.matchAll(/<a\b([^>]+)>/g)) {
      if (attributes.includes('target="_blank"')) assert.match(attributes, /rel="noopener"/);
    }
  }
});

test('real app data is complete, unique and rendered', async () => {
  const html = await read('index.html');
  const listed = apps.filter(app => app.listed !== false);
  for (const property of ['name', 'id', 'url']) {
    assert.equal(new Set(apps.map(app => app[property])).size, apps.length);
  }
  assert.equal(new Set(listed.map(app => app.ink)).size, listed.length);
  assert.deepEqual(apps.filter(app => app.listed === false).map(app => app.id), ['enquete', 'trending']);
  for (const app of apps) {
    assert.ok(app.name);
    assert.equal(new URL(app.url).protocol, 'https:');
    assert.equal(html.includes(`href="${escape(app.url)}"`), app.listed !== false, app.id);
    assert.equal(html.includes(`id="${app.id}"`), app.listed !== false, app.id);
    for (const language of Object.keys(dictionaries)) assert.ok(translate(app.description, language));
  }
  assert.deepEqual(listed.map(app => [app.id, app.ink]), [['down', 'down'], ['sorteio', 'magenta'], ['share', 'purple'], ['links', 'links-green'], ['handles', 'orange']]);
  assert.equal(apps.find(app => app.id === 'links').source, undefined);
  for (const url of externalUrls()) {
    assert.equal(new URL(url).protocol, 'https:');
    assert.ok(!/\s/.test(url));
  }
});

test('local links and referenced files exist; external links belong to the data file', async () => {
  for (const page of pages) {
    for (const [, value] of (await read(page)).matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (value.startsWith('#') || value.startsWith('mailto:')) continue;
      if (value.startsWith('https:')) {
        assert.ok(externalUrls().includes(value) || value.startsWith('https://notx.blue/'));
        continue;
      }
      assert.ok(value.startsWith('/'));
      const path = value === '/' ? 'index.html' : value === '/privacy' ? 'privacy.html' : value.slice(1);
      await access(new URL(`../${path}`, import.meta.url));
    }
  }
});

test('privacy covers each app in both languages and is published at /privacy', async () => {
  for (const language of Object.keys(dictionaries)) {
    const html = renderPage('privacy', language);
    assert.match(html, /<title[^>]*>.+<\/title>/);
    assert.match(html, /<h1[^>]*>.+<\/h1>/);
    assert.match(html, /abuse@notx.blue/);
    for (const app of apps.filter(app => app.listed !== false)) {
      assert.ok(html.includes(`id="privacy-${app.id}"`));
      assert.ok(html.includes(escape(translate(`privacy.${app.id}`, language))));
    }
  }
  assert.match(await read('netlify.toml'), /publish = "\."/);
  assert.match(await read('netlify.toml'), /pretty_urls = true/);
  assert.match(await read('sitemap.xml'), /<loc>https:\/\/notx.blue\/privacy<\/loc>/);
});

test('every footer has contact, privacy and the three support chips in order', async () => {
  for (const page of pages) {
    const footer = (await read(page)).match(/<footer class="pt-6">([\s\S]*?)<\/footer>/)[1];
    assert.match(footer, /mailto:abuse@notx.blue/);
    assert.match(footer, /href="\/privacy"/);
    assert.deepEqual(support.map(entry => entry.label), ['pix', 'coffee', 'sponsors']);
    assert.deepEqual([...footer.matchAll(/<a href="([^"]+)"[^>]*class="db-chip /g)].map(match => match[1]), support.map(entry => entry.url));
    assert.doesNotMatch(footer, /apoia\.se/);
    assert.match(footer, /class="db-meta mb-6 text-center"/);
    assert.match(footer, /data-i18n="fromBrazil"/);
    assert.match(footer, /data-i18n="respect"/);
  }
});

test('language selection, safe text rendering and metadata updates', () => {
  assert.equal(detectLanguage('en', 'pt-BR'), 'en');
  assert.equal(detectLanguage(null, 'en-US'), 'en');
  assert.equal(detectLanguage('invalid', 'fr'), 'pt-BR');
  assert.equal(detectLanguage('toString', 'pt-BR'), 'pt-BR');
  const text = { dataset: { i18n: 'panelTitle' } };
  const meta = { dataset: { i18nContent: 'homeDescription' }, setAttribute(name, value) { this[name] = value; } };
  const document = { documentElement: {}, querySelectorAll(selector) { return selector === '[data-i18n]' ? [text] : selector === '[data-i18n-content]' ? [meta] : []; } };
  applyLanguage(document, 'en');
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(text.textContent, translate('panelTitle', 'en'));
  assert.equal(meta.content, translate('homeDescription', 'en'));
  assert.equal(escape('<script>"&'), '&lt;script&gt;&quot;&amp;');
});

test('theme boot starts light, honors choices and tolerates blocked storage', async () => {
  const source = await read('theme-boot.js');
  for (const [saved, dark, expected] of [[null, true, 'light'], [null, false, 'light'], ['light', true, 'light'], ['dark', false, 'dark'], ['terminal', true, 'terminal'], ['terminal', false, 'terminal'], ['invalid', true, 'light'], ['invalid', false, 'light'], ['throws', true, 'light'], ['throws', false, 'light']]) {
    const document = { documentElement: { dataset: {} } };
    runInNewContext(source, { document, window: { matchMedia: () => ({ matches: dark }) }, localStorage: { getItem() { if (saved === 'throws') throw Error('Denied'); return saved; } } });
    assert.equal(document.documentElement.dataset.theme, expected);
  }
});

test('CSP denies inline scripts and limits external resources', async () => {
  const config = await read('netlify.toml');
  for (const directive of ["script-src 'self'", "style-src 'self'", "connect-src 'self'", "frame-ancestors 'none'", "font-src 'self' https://static.joseli.to"]) assert.ok(config.includes(directive));
  assert.doesNotMatch(config, /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(await read('robots.txt'), /Disallow: \/\s/);
});

test('used ink pairs meet 4.5:1 in every theme', async () => {
  const luminance = hex => {
    const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  const contrast = (first, second) => {
    const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
    return (values[0] + .05) / (values[1] + .05);
  };
  const css = await read('assets/site-v2.css');
  const literal = css.match(/\.nx-ink-links-green \{ --project-ink: (#[a-f\d]{6}); --project-ink-contrast: (#[a-f\d]{6});/i);
  assert.ok(contrast(literal[1], literal[2]) >= 4.5, 'links-green');
  for (const file of ['colors', 'dark', 'terminal']) {
    const tokens = Object.fromEntries([...(await read(`scripts/ds/tokens/${file}.css`)).matchAll(/--([\w-]+):\s*(#[a-f\d]{6});/gi)].map(([, key, value]) => [key, value]));
    for (const ink of new Set(['blue', 'pix', 'sponsors', 'yellow', ...apps.filter(app => app.listed !== false && app.ink !== 'links-green').map(app => app.ink)])) {
      assert.ok(contrast(tokens[`ink-${ink}`], tokens[`on-${ink}`]) >= 4.5, `${file}/${ink}`);
    }
    if (file === 'terminal') assert.ok(contrast(tokens['ink-green'], tokens['on-green']) >= 4.5, 'terminal/green');
  }
});

test('app aliases are linked inside their cards in both languages', () => {
  for (const language of Object.keys(dictionaries)) {
    const html = renderPage('home', language);
    for (const app of apps.filter(app => app.aliases)) {
      const card = html.match(new RegExp('<li[^>]*id="' + app.id + '"[^>]*>([\\s\\S]*?)</li>\\s*(?:<li|</ul>)'))[1];
      for (const alias of app.aliases) {
        assert.ok(card.includes(`href="${alias}" target="_blank" rel="noopener">${new URL(alias).host}</a>`));
      }
      assert.ok(card.includes(translate('alsoAt', language)));
    }
  }
});

test('privacy contact belongs to the changes section', () => {
  for (const language of Object.keys(dictionaries)) {
    const section = renderPage('privacy', language).match(/<section id="changes">([\s\S]*?)<\/section>/)[1];
    assert.match(section, /:<\/p><a href="mailto:abuse@notx.blue"/);
  }
});

test('pre-rendered theme buttons name the next theme, like down.blue', () => {
  for (const language of Object.keys(dictionaries)) {
    for (const page of ['home', 'privacy', '404']) {
      const html = renderPage(page, language);
      const button = html.match(/<button id="theme-toggle"[\s\S]*?<\/button>/)[0];
      const label = translate('themeButton', language).replace('{current}', translate('theme.light', language)).replace('{next}', translate('theme.dark', language));
      assert.ok(button.includes(`aria-label="${label}"`));
      assert.ok(button.includes('data-next-theme="dark"'));
      assert.ok(button.includes(`<span data-theme-name>${translate('theme.dark', language)}</span>`));
      assert.equal([...button.matchAll(/<svg /g)].length, 3);
      assert.ok(html.includes('class="flex flex-wrap items-center justify-end gap-2 pt-4"'));
      assert.ok(html.includes('class="mx-auto max-w-[880px] px-6 pb-16"'));
      assert.doesNotMatch(html, /<header/);
    }
  }
});

test('masthead: one h1, the wordmark on home and the panel title elsewhere', () => {
  for (const language of Object.keys(dictionaries)) {
    for (const page of ['home', 'privacy', '404']) {
      const html = renderPage(page, language);
      assert.equal([...html.matchAll(/<h1[ >]/g)].length, 1);
      if (page === 'home') assert.match(html, /<h1 class="db-wordmark">notx<span class="ink-block tilt-cw">\.blue<\/span><\/h1>/);
      else {
        assert.match(html, /<div class="db-wordmark"><a href="\/" aria-label="notx.blue">notx<span class="ink-block tilt-cw">\.blue<\/span><\/a><\/div>/);
        assert.match(html, /<h1 class="db-panel-head"/);
      }
    }
  }
});

test('home: one projects panel with the listed apps, then compact labels, bots and domains panels', () => {
  for (const language of Object.keys(dictionaries)) {
    const html = renderPage('home', language);
    const panels = [...html.matchAll(/<section class="db-panel cast [^"]*" aria-labelledby="([^"]+)">/g)].map(match => match[1]);
    assert.deepEqual(panels, ['projects-title', 'labels-title', 'bots-title', 'handles-title']);
    assert.equal([...html.matchAll(/class="nx-app cast-flat nx-ink-/g)].length, 5);
    assert.equal([...html.matchAll(/class="db-btn db-btn-primary cast press"/g)].length, 5);
    assert.doesNotMatch(html, /enquete\.notx\.blue|trending\.notx\.blue/);
    const labels = html.match(/id="labels-title">([\s\S]*?)<\/section>/)[1];
    const bots = html.match(/id="bots-title">([\s\S]*?)<\/section>/)[1];
    assert.ok(labels.includes(translate('labels', language)) && labels.includes(translate('orkut', language)));
    assert.equal([...labels.matchAll(/<li>/g)].length, 1);
    assert.equal([...bots.matchAll(/<li>/g)].length, 4);
    assert.ok(bots.includes(translate('bots', language)));
    for (const key of ['scorigami', 'week', 'hours', 'bolsonaro']) assert.ok(bots.includes(translate(key, language)));
  }
});

test('privacy leaves out apps hidden from the home page', () => {
  const html = renderPage('privacy');
  for (const id of ['enquete', 'trending']) assert.ok(!html.includes(`id="privacy-${id}"`));
});
