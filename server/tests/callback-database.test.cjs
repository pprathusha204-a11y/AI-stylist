// Opt-in integration against a migrated test database. No company messages are sent.
require('dotenv').config();
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { callbackDatabase, saveCallback, allowCallbackRequest } = require('../dist/services/callback.service');
test('MySQL persistence, defaults, idempotency and durable rate limits', { skip: process.env.CALLBACK_DB_TEST !== 'true' }, async () => {
  const db = callbackDatabase(); const requestId = randomUUID(); const ip = `test-${randomUUID()}`;
  const details = { name: 'Callback Integration Test', phone: '+14155552671', service: 'Order Support', requestId };
  try {
    const first = await saveCallback(details); const retry = await saveCallback(details);
    assert.equal(first.created, true); assert.equal(retry.created, false); assert.equal(first.id, retry.id);
    const [rows] = await db.execute('SELECT * FROM callback_requests WHERE request_key = ?', [requestId]);
    assert.equal(rows.length, 1); assert.equal(rows[0].status, 'Pending'); assert.ok(rows[0].created_at); assert.equal(rows[0].notification_status, 'Pending');
    const results = await Promise.all(Array.from({ length: 6 }, () => allowCallbackRequest(ip)));
    assert.equal(results.filter(Boolean).length, 5);
  } finally {
    await db.execute('DELETE FROM callback_requests WHERE request_key = ?', [requestId]);
    await db.execute('DELETE FROM callback_rate_limits WHERE rate_key = SHA2(?, 256)', [ip]);
    await db.end();
  }
});
