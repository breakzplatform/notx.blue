import test from 'node:test';
import assert from 'node:assert/strict';
import { bindTheme } from '../theme.js';

for (const blocked of [false, true]) {
  test(`theme toggle persists when possible and stops following the system (blocked=${blocked})`, () => {
    const previous = Object.fromEntries(['window', 'document', 'localStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    let systemChange;
    let click;
    const values = new Map();
    const button = { hidden: true, addEventListener(event, handler) { click = handler; } };
    const document = { documentElement: { dataset: { theme: 'light' } } };
    try {
      Object.defineProperty(globalThis, 'window', { configurable: true, value: { matchMedia: () => ({ addEventListener(event, handler) { systemChange = handler; } }) } });
      Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
        getItem(key) { if (blocked) throw Error('Denied'); return values.get(key); },
        setItem(key, value) { if (blocked) throw Error('Denied'); values.set(key, value); },
      } });
      bindTheme(button, key => key);
      assert.equal(button.hidden, false);
      assert.equal(button.textContent, 'dark');
      systemChange({ matches: true });
      assert.equal(document.documentElement.dataset.theme, 'dark');
      click();
      assert.equal(document.documentElement.dataset.theme, 'light');
      assert.equal(values.get('theme'), blocked ? undefined : 'light');
      systemChange({ matches: true });
      assert.equal(document.documentElement.dataset.theme, 'light');
    } finally {
      for (const [key, descriptor] of Object.entries(previous)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    }
  });
}
