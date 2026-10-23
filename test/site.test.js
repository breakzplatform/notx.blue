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
  for (const property of ['name', 'id', 'url', 'ink']) {
    assert.equal(new Set(apps.map(app => app[property])).size, apps.length);
  }
  for (const app of apps) {
    assert.ok(app.name);
    assert.equal(new URL(app.url).protocol, 'https:');
    assert.ok(html.includes(`href="${escape(app.url)}"`));
    for (const language of Object.keys(dictionaries)) assert.ok(translate(app.description, language));
  }
  assert.equal(apps.find(app => app.id === 'links').source, undefined);
  assert.equal(apps.find(app => app.id === 'down').ink, 'down');
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
    for (const app of apps) {
      assert.ok(html.includes(`id="privacy-${app.id}"`));
      assert.ok(html.includes(escape(translate(`privacy.${app.id}`, language))));
    }
  }
  assert.match(await read('netlify.toml'), /publish = "\."/);
  assert.match(await read('netlify.toml'), /pretty_urls = true/);
  assert.match(await read('sitemap.xml'), /<loc>https:\/\/notx.blue\/privacy<\/loc>/);
});

test('every footer has contact, privacy and four support chips', async () => {
  for (const page of pages) {
    const footer = (await read(page)).match(/<footer>([\s\S]*?)<\/footer>/)[1];
    assert.match(footer, /mailto:abuse@notx.blue/);
    assert.match(footer, /href="\/privacy"/);
    assert.equal([...footer.matchAll(/class="db-chip /g)].length, 4);
    for (const entry of support) assert.ok(footer.includes(entry.url));
  }
});

test('language selection, safe text rendering and metadata updates', () => {
  assert.equal(detectLanguage('en', 'pt-BR'), 'en');
  assert.equal(detectLanguage(null, 'en-US'), 'en');
  assert.equal(detectLanguage('invalid', 'fr'), 'pt-BR');
  assert.equal(detectLanguage('toString', 'pt-BR'), 'pt-BR');
  const text = { dataset: { i18n: 'hero' } };
  const meta = { dataset: { i18nContent: 'homeDescription' }, setAttribute(name, value) { this[name] = value; } };
  const document = { documentElement: {}, querySelectorAll(selector) { return selector === '[data-i18n]' ? [text] : selector === '[data-i18n-content]' ? [meta] : []; } };
  applyLanguage(document, 'en');
  assert.equal(document.documentElement.lang, 'en');
  assert.equal(text.textContent, translate('hero', 'en'));
  assert.equal(meta.content, translate('homeDescription', 'en'));
  assert.equal(escape('<script>"&'), '&lt;script&gt;&quot;&amp;');
});

test('theme boot follows the system, honors choices and tolerates blocked storage', async () => {
  const source = await read('theme-boot.js');
  for (const [saved, dark, expected] of [[null, true, 'dark'], [null, false, 'light'], ['light', true, 'light'], ['dark', false, 'dark'], ['terminal', true, 'dark'], ['throws', true, 'dark']]) {
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

test('used ink pairs meet 4.5:1 in light and dark', async () => {
  const luminance = hex => {
    const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
  };
  for (const file of ['colors', 'dark']) {
    const tokens = Object.fromEntries([...(await read(`scripts/ds/tokens/${file}.css`)).matchAll(/--([\w-]+):\s*(#[a-f\d]{6});/gi)].map(([, key, value]) => [key, value]));
    for (const ink of new Set(['blue', 'pix', 'sponsors', ...apps.map(app => app.ink)])) {
      const values = [luminance(tokens[`ink-${ink}`]), luminance(tokens[`on-${ink}`])].sort((a, b) => b - a);
      assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${file}/${ink}`);
    }
  }
});

test('app aliases are linked inside their cards in both languages', () => {
  for (const language of Object.keys(dictionaries)) {
    const html = renderPage('home', language);
    for (const app of apps.filter(app => app.aliases)) {
      const card = html.match(new RegExp('<article[^>]*id="' + app.id + '"[^>]*>([\\s\\S]*?)</article>'))[1];
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

test('pre-rendered theme buttons describe the current theme and action', () => {
  for (const language of Object.keys(dictionaries)) {
    for (const page of ['home', 'privacy', '404']) {
      const button = renderPage(page, language).match(/<button id="theme-toggle"[^>]*>/)[0];
      assert.ok(button.includes(`aria-label="${translate('themeButtonLabelLight', language)}"`));
    }
  }
});

test('labels and bots have separate headings and lists', () => {
  for (const language of Object.keys(dictionaries)) {
    const html = renderPage('home', language);
    const labels = html.match(/<section class="secondary" aria-labelledby="labels-title">([\s\S]*?)<\/section>/)?.[1];
    const bots = html.match(/<section class="secondary" aria-labelledby="bots-title">([\s\S]*?)<\/section>/)?.[1];
    assert.ok(labels);
    assert.ok(bots);
    assert.ok(labels.includes(translate('labels', language)));
    assert.ok(bots.includes(translate('bots', language)));
    assert.equal([...labels.matchAll(/<li>/g)].length, 1);
    assert.equal([...bots.matchAll(/<li>/g)].length, 4);
    assert.ok(labels.includes(translate('orkut', language)));
    for (const key of ['scorigami', 'week', 'hours', 'bolsonaro']) {
      assert.ok(bots.includes(translate(key, language)));
    }
  }
});
