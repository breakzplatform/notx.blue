import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

test('deployment prune removes development files and keeps published pages', async () => {
  await mkdir('.browser', { recursive: true });
  const directory = await mkdtemp(resolve('.browser/prune-'));
  try {
    for (const name of ['index.html', 'privacy.html', '404.html', 'theme-boot.js', 'README.md', 'package.json', 'netlify.toml', '.run-prompt.txt']) await writeFile(resolve(directory, name), 'fixture');
    for (const name of ['scripts', 'test', 'assets', 'i18n', '.netlify', '.git']) await mkdir(resolve(directory, name));
    execFileSync(process.execPath, [resolve('scripts/prune.mjs')], { cwd: directory });
    assert.deepEqual((await readdir(directory)).sort(), ['.git', '.netlify', '404.html', 'assets', 'i18n', 'index.html', 'privacy.html', 'theme-boot.js'].sort());
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('social previews are matching 1200 by 630 PNGs', async () => {
  const original = await readFile('og.png');
  assert.deepEqual(await readFile('share.png'), original);
  assert.equal(original.subarray(1, 4).toString(), 'PNG');
  assert.equal(original.readUInt32BE(16), 1200);
  assert.equal(original.readUInt32BE(20), 630);
});
