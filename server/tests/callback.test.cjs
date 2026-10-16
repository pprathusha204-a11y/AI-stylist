const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { randomUUID } = require('node:crypto');
const { createCallbackRouter } = require('../dist/routes/callback.routes');
const details = () => ({ name: 'Test Customer', phone: '+14155552671', service: 'Order Support', requestId: randomUUID(), website: '', startedAt: Date.now() - 3000 });
async function withServer(save, allow, run) {
  const app = express(); app.use('/api/callback', createCallbackRouter(save, allow));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}/api/callback`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
const post = (url, body, headers = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
test('valid requests are acknowledged only after saving, and retries reuse the key', async () => {
  const saved = new Map();
  await withServer(async data => { const created = !saved.has(data.requestId); saved.set(data.requestId, data); return { id: data.requestId, created }; }, async () => true, async url => {
    const body = details(); const response = await post(url, body);
    assert.equal(response.status, 201); assert.equal((await response.json()).success, true);
    assert.equal((await post(url, body)).status, 200); assert.equal(saved.size, 1);
    assert.equal(saved.get(body.requestId).phone, body.phone);
  });
});
test('rejects invalid fields, unsupported services, honeypot and too-fast submissions', async () => {
  let calls = 0;
  await withServer(async () => { calls++; throw new Error(); }, async () => true, async url => {
    for (const override of [{ name: '' }, { phone: '+123' }, { service: 'Unknown' }, { website: 'spam' }, { startedAt: Date.now() }, { requestId: 'bad' }]) assert.equal((await post(url, { ...details(), ...override })).status, 400);
    assert.equal(calls, 0);
  });
});
test('database failure never reports success; blocked origins and rate limits are enforced', async () => {
  await withServer(async () => { throw new Error('offline'); }, async () => true, async url => {
    const response = await post(url, details()); assert.equal(response.status, 503); assert.notEqual((await response.json()).success, true);
    assert.equal((await post(url, details(), { Origin: 'https://untrusted.example' })).status, 403);
  });
  await withServer(async () => { throw new Error('must not save'); }, async () => false, async url => {
    const response = await post(url, details()); assert.equal(response.status, 429); assert.equal(response.headers.get('retry-after'), '900');
  });
});
