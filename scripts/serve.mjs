import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const root = resolve('.');
const config = await readFile('netlify.toml', 'utf8');
const policy = config.match(/Content-Security-Policy = "([^"]+)"/)[1].replace('; upgrade-insecure-requests', '');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };
createServer(async (request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); } catch { response.writeHead(400).end(); return; }
  const file = pathname === '/' ? 'index.html' : pathname === '/privacy' ? 'privacy.html' : pathname.slice(1);
  const path = resolve(root, file);
  if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
  try {
    const content = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Content-Security-Policy': policy }).end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': types['.html'], 'Content-Security-Policy': policy }).end(await readFile('404.html'));
  }
}).listen(8765, '127.0.0.1', () => console.log('http://127.0.0.1:8765'));
