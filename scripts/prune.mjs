import { readdir, rm } from 'node:fs/promises';

// Deletes files irrecoverably, so it runs only in a Netlify build or when asked for explicitly.
if (process.env.NETLIFY !== 'true' && !process.argv.includes('--force')) {
  console.error('prune.mjs deletes every unpublished file in the current directory; run it in a throwaway export with --force');
  process.exit(1);
}

// An allowlist also excludes local-only notes from a CLI draft deployment.
const published = new Set([
  '.git', '.netlify', 'LICENSE', 'NOTICE', 'index.html', 'privacy.html', '404.html',
  'assets', 'i18n', 'i18n.js', 'main.js', 'theme.js', 'theme-boot.js',
  'favicon.svg', 'og.png', 'share.png', 'robots.txt', 'sitemap.xml',
]);
for (const entry of await readdir('.')) {
  if (!published.has(entry)) await rm(entry, { recursive: true, force: true });
}
