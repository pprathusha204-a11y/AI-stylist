const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { notifyCallback } = require('../dist/services/callback.service');
test('configured SMTP receives notification content; missing configuration fails explicitly', async () => {
  let message = '';
  const server = net.createServer(socket => {
    socket.write('220 localhost test SMTP\r\n');
    let buffer = ''; let inData = false;
    socket.on('data', chunk => {
      buffer += chunk.toString();
      if (inData) {
        const end = buffer.indexOf('\r\n.\r\n');
        if (end < 0) return;
        message = buffer.slice(0, end); buffer = buffer.slice(end + 5); inData = false; socket.write('250 queued\r\n');
      }
      while (!inData && buffer.includes('\r\n')) {
        const index = buffer.indexOf('\r\n'); const line = buffer.slice(0, index); buffer = buffer.slice(index + 2);
        if (/^EHLO/.test(line)) socket.write('250 localhost\r\n');
        else if (/^DATA/.test(line)) { inData = true; socket.write('354 send data\r\n'); }
        else if (/^QUIT/.test(line)) socket.end('221 bye\r\n');
        else socket.write('250 ok\r\n');
      }
    });
  });
  server.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const vars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM', 'CALLBACK_NOTIFY_TO'];
  const previous = Object.fromEntries(vars.map(key => [key, process.env[key]]));
  try {
    process.env.SMTP_HOST = '127.0.0.1'; process.env.SMTP_PORT = String(server.address().port); process.env.SMTP_SECURE = 'false'; delete process.env.SMTP_USER;
    process.env.SMTP_FROM = 'callback@example.com'; process.env.CALLBACK_NOTIFY_TO = 'team@example.com';
    await notifyCallback({ name: 'Test Customer', phone: '+14155552671', service: 'Order Support', requestId: 'test' }, 'test-id');
    assert.match(message, /Test Customer/); assert.match(message, /Order Support/); assert.match(message, /Pending/); assert.match(message, /team@example.com/);
    delete process.env.SMTP_HOST;
    await assert.rejects(notifyCallback({ name: 'Test', phone: '+14155552671', service: 'Order Support', requestId: 'test' }, 'test-id'), /not configured/);
  } finally {
    for (const key of vars) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
    await new Promise(resolve => server.close(resolve));
  }
});
