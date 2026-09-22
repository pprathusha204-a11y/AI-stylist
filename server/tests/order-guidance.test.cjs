const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { extractOrderDetails, getOrderGuidance } = require('../dist/services/order-guidance.service');
const { getOrCreateSession, updateSession } = require('../dist/services/session.service');
const chatRouter = require('../dist/routes/chat.routes').default;

test('keeps exact fabric specifications and separates yarn count from thread count', () => {
  const details = extractOrderDetails('Fabric blend: 80% wool, 20% silk\nYarn count: Ne 100/2\nThread count: 200 per inch\nLining material: cupro\nDelivery destination: Delhi, India');
  assert.deepEqual(details, { fabricBlend: '80% wool, 20% silk', yarnCount: 'Ne 100/2', threadCount: '200 per inch', liningMaterial: 'cupro', deliveryDestination: 'Delhi, India' });
  assert.deepEqual(extractOrderDetails('category: suit\nFabric blend: '), {});
});

test('answers multiple customer questions without promising unverified card acceptance', () => {
  const reply = getOrderGuidance('How will I be measured? Can I upload a style? Can I specify my fabric blends and counts and lining? Can I use a credit card and ship to Delhi or the US?');
  assert.match(reply, /illustrated guide/);
  assert.match(reply, /JPG/);
  assert.match(reply, /yarn count/);
  assert.match(reply, /do not explicitly confirm US-issued card/);
  assert.match(reply, /three weeks/);
  assert.equal(getOrderGuidance('I prefer a navy suit'), null);
});

test('help and detailed requests preserve the shopping flow and can be undone', async () => {
  const app = express();
  app.use(express.json());
  app.use('/chat', chatRouter);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/chat`;
  const post = async (path, body) => {
    const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal(response.status, 200);
    return (await response.json()).data;
  };
  try {
    const initial = await post('', { message: 'Guide me through my first order' });
    const sessionId = initial.sessionId;
    const before = getOrCreateSession(sessionId);
    updateSession(sessionId, { requirements: { colour: 'navy', fabric: 'wool' } });
    const help = await post('', { sessionId, message: 'Can I use a credit card?' });
    assert.equal(help.workflow, before.workflow);
    assert.equal(help.expectedField, initial.expectedField);
    assert.equal(help.requirements.colour, 'navy');
    const saved = await post('', { sessionId, message: 'My detailed order requests:\nFabric blend: 80% wool, 20% silk\nLining construction: half lined\nDelivery destination: California, USA' });
    assert.equal(saved.requirements.fabricBlend, '80% wool, 20% silk');
    assert.equal(saved.requirements.liningConstruction, 'half lined');
    assert.equal(saved.requirements.deliveryDestination, 'California, USA');
    assert.equal(saved.requirements.fabric, 'wool');
    assert.equal(saved.expectedField, help.expectedField);
    const restored = await post('/restore', { sessionId, checkpointId: saved.checkpoint.id });
    assert.equal(restored.requirements.fabricBlend, null);
    assert.equal(restored.requirements.colour, 'navy');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
