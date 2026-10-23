import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../i18n.js';
import { bindTheme } from '../theme.js';

for (const blocked of [false, true]) {
  test(`theme button cycles light, dark, terminal and stops following the system (blocked=${blocked})`, () => {
    const previous = Object.fromEntries(['window', 'document', 'localStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    let systemChange;
    let click;
    const values = new Map();
    const name = {};
    const button = { hidden: true, dataset: {}, querySelector: () => name, setAttribute(attribute, value) { this[attribute] = value; }, addEventListener(event, handler) { click = handler; } };
    const document = { documentElement: { dataset: { theme: 'light' } } };
    const theme = () => document.documentElement.dataset.theme;
    try {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: { matchMedia: () => ({ addEventListener(event, handler) { systemChange = handler; } }) } });
      Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
        getItem(key) { if (blocked) throw Error('Denied'); return values.get(key); },
        setItem(key, value) { if (blocked) throw Error('Denied'); values.set(key, value); },
      } });
      let language = 'en';
      const update = bindTheme(button, key => translate(key, language));
      assert.equal(button.hidden, false);
      assert.equal(name.textContent, 'dark');
      assert.equal(button.dataset.nextTheme, 'dark');
      assert.equal(button['aria-label'], 'Theme: light, tap for dark');

      systemChange({ matches: true });
      assert.equal(theme(), 'dark');
      assert.equal(name.textContent, 'terminal');
      assert.equal(button['aria-label'], 'Theme: dark, tap for terminal');
      systemChange({ matches: false });
      assert.equal(theme(), 'light');

      language = 'pt-BR';
      update();
      assert.equal(name.textContent, 'escuro');
      assert.equal(button['aria-label'], 'Tema: claro, toque para escuro');

      click();
      assert.equal(theme(), 'dark');
      assert.equal(values.get('theme'), blocked ? undefined : 'dark');
      click();
      assert.equal(theme(), 'terminal');
      assert.equal(button.dataset.nextTheme, 'light');
      assert.equal(name.textContent, 'claro');
      assert.equal(button['aria-label'], 'Tema: terminal, toque para claro');
      click();
      assert.equal(theme(), 'light');
      assert.equal(values.get('theme'), blocked ? undefined : 'light');

      systemChange({ matches: true });
      assert.equal(theme(), 'light');
      assert.equal(button['aria-label'], 'Tema: claro, toque para escuro');
    } finally {
      for (const [key, descriptor] of Object.entries(previous)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  });
}
