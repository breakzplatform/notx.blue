import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../i18n.js';
import { bindTheme } from '../theme.js';

for (const blocked of [false, true]) {
  test(`theme toggle persists when possible and stops following the system (blocked=${blocked})`, () => {
    const previous = Object.fromEntries(['window', 'document', 'localStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    let systemChange;
    let click;
    const values = new Map();
    const button = { hidden: true, setAttribute(name, value) { this[name] = value; }, addEventListener(event, handler) { click = handler; } };
    const document = { documentElement: { dataset: { theme: 'light' } } };
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
      assert.equal(button.textContent, 'Dark theme');
      assert.equal(button['aria-label'], 'Current theme: light. Switch to dark theme.');
      systemChange({ matches: true });
      assert.equal(document.documentElement.dataset.theme, 'dark');
      assert.equal(button['aria-label'], 'Current theme: dark. Switch to light theme.');
      language = 'pt-BR';
      update();
      assert.equal(button['aria-label'], 'Tema atual: escuro. Mudar para tema claro.');
      click();
      assert.equal(button['aria-label'], 'Tema atual: claro. Mudar para tema escuro.');
      assert.equal(document.documentElement.dataset.theme, 'light');
      assert.equal(values.get('theme'), blocked ? undefined : 'light');
      systemChange({ matches: true });
      assert.equal(document.documentElement.dataset.theme, 'light');
      assert.equal(button['aria-label'], 'Tema atual: claro. Mudar para tema escuro.');
    } finally {
      for (const [key, descriptor] of Object.entries(previous)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  });
}
