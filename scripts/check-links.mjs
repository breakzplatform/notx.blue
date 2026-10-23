import { externalUrls } from '../site-data.js';

async function check(url) {
  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(20000) });
    if (response.status >= 400) {
      response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    }
    await response.body?.cancel();
    const ok = response.status >= 200 && response.status < 400;
    console.log(`${ok ? 'OK' : 'FAIL'} ${response.status} ${url}${response.url !== url ? ` -> ${response.url}` : ''}`);
    return ok;
  } catch (error) {
    console.log(`FAIL ${url}: ${error.message}`);
    return false;
  }
}
const urls = externalUrls();
let failed = 0;
for (let index = 0; index < urls.length; index += 4) {
  const results = await Promise.all(urls.slice(index, index + 4).map(check));
  failed += results.filter(ok => !ok).length;
}
console.log(`${urls.length - failed}/${urls.length} URLs responded successfully.`);
if (failed) process.exitCode = 1;
