'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { handleMessage } = require('./handler');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY = 10 * 1024;
const RATE_LIMIT = { windowMs: 60_000, max: 30 };
const hits = new Map();

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
// Solo se sirve el frontend; nunca server/, test/, docs/ ni .git
const STATIC_OK = /^\/(index\.html|assistant\.html|css\/|js\/|assets\/)/;

function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RATE_LIMIT.max;
}

function send(res, status, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, {
    'x-content-type-options': 'nosniff',
    ...(process.env.ALLOWED_ORIGIN ? { 'access-control-allow-origin': process.env.ALLOWED_ORIGIN } : {}),
    ...(isObj ? { 'content-type': 'application/json; charset=utf-8' } : {}),
    ...headers
  });
  res.end(isObj ? JSON.stringify(body) : body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new Error('too_large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/v1/assistant/messages') {
    if (req.method === 'OPTIONS') return send(res, 204, '', { 'access-control-allow-methods': 'POST', 'access-control-allow-headers': 'content-type' });
    if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' }, { allow: 'POST' });
    if (!(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'unsupported_media_type' });
    if (limited(req.socket.remoteAddress)) return send(res, 429, { error: 'rate_limited' }, { 'retry-after': '60' });
    let payload;
    try { payload = JSON.parse(await readBody(req)); }
    catch (e) { return send(res, e.message === 'too_large' ? 413 : 400, { error: e.message === 'too_large' ? 'payload_too_large' : 'invalid_json' }); }
    const { status, body } = await handleMessage(payload);
    // Privacidad: solo se registra la categoría, nunca el texto del usuario
    console.log(`[assistant] ${status} ${body.category || body.error}`);
    return send(res, status, body);
  }

  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  const rel = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep) || !STATIC_OK.test(rel)) return send(res, 404, { error: 'not_found' });
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, { error: 'not_found' });
    send(res, 200, data, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  });
});

if (require.main === module) {
  server.listen(PORT, () => console.log(`MediCore en http://localhost:${PORT}  (asistente: /assistant.html)`));
}
module.exports = { server };
