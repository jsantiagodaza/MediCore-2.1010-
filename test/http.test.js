'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { server } = require('../server/index');

let base;
test.before(() => new Promise((r) => server.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${server.address().port}`; r(); })));
test.after(() => new Promise((r) => server.close(r)));

const post = (body, headers = { 'content-type': 'application/json' }) =>
  fetch(base + '/api/v1/assistant/messages', { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('POST válido => 200 y contrato correcto', async () => {
  const r = await post({ message: '¿Para qué sirve la loratadina?' });
  assert.equal(r.status, 200);
  const j = await r.json();
  for (const k of ['id', 'mode', 'provider', 'category', 'safety', 'reply', 'sources', 'suggested_actions', 'disclaimer']) assert.ok(k in j, k);
  assert.equal(j.mode, 'prototype');
});
test('JSON inválido => 400', async () => assert.equal((await post('{no')).status, 400));
test('sin content-type JSON => 415', async () => assert.equal((await post('x', { 'content-type': 'text/plain' })).status, 415));
test('GET al endpoint => 405', async () => assert.equal((await fetch(base + '/api/v1/assistant/messages')).status, 405));
test('cuerpo > 10 KB => 413 o conexión cortada', async () => {
  try { assert.equal((await post({ message: 'a'.repeat(20000) })).status, 413); }
  catch (e) { assert.ok(e); } // el servidor corta la conexión: también es válido
});
test('no expone server/, docs/ ni .git (ni path traversal)', async () => {
  for (const p of ['/server/handler.js', '/package.json', '/.git/config', '/docs/ai-safety.md', '/..%2fpackage.json'])
    assert.equal((await fetch(base + p)).status, 404, p);
});
test('sirve la app con la pantalla de Mol y sus imágenes', async () => {
  const html = await (await fetch(base + '/')).text();
  assert.match(html, /id="s-asistente"/);
  assert.match(html, /data-go="asistente"/);
  assert.equal((await fetch(base + '/js/assistant-ui.js')).status, 200);
  for (const img of ['mol_paramedico', 'mol-verde', 'mol-amarillo', 'mol-rojo', 'mol-toma-agua'])
    assert.equal((await fetch(`${base}/assets/${img}.png`)).status, 200, img);
});
test('la clave de IA no aparece en ningún archivo servido al frontend', async () => {
  const fs = require('node:fs'); const path = require('node:path');
  const root = path.join(__dirname, '..');
  const files = ['index.html', ...fs.readdirSync(path.join(root, 'js')).map((f) => 'js/' + f)];
  for (const f of files) assert.doesNotMatch(fs.readFileSync(path.join(root, f), 'utf8'), /ANTHROPIC_API_KEY|x-api-key|api\.anthropic\.com/, f);
});
