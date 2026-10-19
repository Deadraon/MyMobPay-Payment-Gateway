import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { supabaseAdmin } from '../lib/supabase.js';
import {
  isSafeWebhookUrl,
  triggerMerchantWebhook,
  triggerPaymentLinkWebhook,
  processPendingWebhookRetries
} from '../lib/webhook.js';

// Resolve Next's aliases for the Node test runner; isolate the unrelated rate limiter.
const require = createRequire(import.meta.url);
const routeImports = {
  'next/server': pathToFileURL(require.resolve('next/server.js')).href,
  '@/lib/supabase': new URL('../lib/supabase.js', import.meta.url).href,
  '@/lib/webhook': new URL('../lib/webhook.js', import.meta.url).href,
  '@/lib/rateLimit': 'data:text/javascript,' + encodeURIComponent(`
    export const checkRateLimit = () => ({ allowed: true });
    export const getClientIp = () => '192.0.2.1';
  `)
};
const routeSource = (await readFile(
  new URL('../app/api/merchant/test-webhook/route.js', import.meta.url), 'utf8'
)).replace(/from '([^']+)'/g, (statement, specifier) =>
  routeImports[specifier] ? `from ${JSON.stringify(routeImports[specifier])}` : statement
);
const { POST } = await import('data:text/javascript;base64,' + Buffer.from(routeSource).toString('base64'));

test('webhook delivery never follows redirects to a forbidden destination', async (t) => {
  const nativeFetch = globalThis.fetch;
  const apiKey = 'synthetic-webhook-test-key';
  const requests = [];
  const updates = [];
  let internalRequests = 0;
  let targetUrl;

  const server = createServer(async (request, response) => {
    if (request.url === '/internal') {
      internalRequests++;
      response.end('synthetic internal secret');
      return;
    }
    let body = '';
    for await (const chunk of request) body += chunk;
    requests.push({ method: request.method, headers: request.headers, body });
    const status = Number(request.url.slice(1));
    response.writeHead(status, status === 200 ? {} : { Location: targetUrl });
    response.end('merchant endpoint response');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  const fixtureOrigin = `http://127.0.0.1:${server.address().port}`;
  targetUrl = `${fixtureOrigin}/internal`;
  assert.equal(isSafeWebhookUrl(targetUrl), false);

  // Only the initially approved public URL is routed to our local merchant fixture.
  // Redirects, if followed by native fetch, reach /internal without this wrapper.
  t.mock.method(globalThis, 'fetch', (url, options) => {
    assert.equal(new URL(url).origin, 'https://merchant.example');
    return nativeFetch(`${fixtureOrigin}${new URL(url).pathname}`, options);
  });

  const order = { id: 'order-1', merchant_id: 'merchant-1', amount: 100, status: 'verified' };
  const link = { id: 'link-1', merchant_id: 'merchant-1', amount: 10000, status: 'expired' };
  const merchant = { id: 'merchant-1', api_key: apiKey, webhook_url: '' };
  const retry = {
    id: 'log-1', target_url: '', payload: { event: 'payment_link.expired' },
    merchants: { api_key: apiKey }, event: 'payment_link.expired', attempts: 1
  };
  const records = { orders: order, payment_links: link, merchants: merchant, webhook_logs: { id: 'log-1' } };
  t.mock.method(supabaseAdmin, 'from', (table) => ({
    select() { return this; },
    eq() { return this; },
    lte() { return this; },
    insert() { return this; },
    update(values) { updates.push(values); return this; },
    async single() { return { data: records[table] }; },
    async limit() { return { data: [retry] }; }
  }));

  const deliveries = {
    order: () => triggerMerchantWebhook(order.id),
    'payment link': () => triggerPaymentLinkWebhook(link.id),
    retry: async () => {
      const result = await processPendingWebhookRetries();
      assert.equal(result.retried, 1);
      const update = updates.at(-1);
      assert.equal(update.attempts, 2);
      assert.equal(update.status, update.last_error ? 'pending' : 'delivered');
      assert.equal(update.next_retry_at === null, !update.last_error);
      return { success: update.status === 'delivered' };
    },
    'test endpoint': async () => {
      const response = await POST(new Request('https://gateway.example/api/merchant/test-webhook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, webhook_url: merchant.webhook_url })
      }));
      const result = await response.json();
      assert.ok(!JSON.stringify(result).includes('synthetic internal secret'));
      return result;
    }
  };

  for (const [name, deliver] of Object.entries(deliveries)) {
    for (const status of [301, 302, 303, 307, 308, 200]) {
      await t.test(`${name}: HTTP ${status}`, async () => {
        merchant.webhook_url = retry.target_url = `https://merchant.example/${status}`;
        const before = requests.length;
        const internalBefore = internalRequests;
        const result = await deliver();
        assert.equal(internalRequests, internalBefore, 'redirect destination must receive no request');
        assert.equal(result.success, status === 200);
        assert.equal(requests.length, before + 1, 'initial webhook must reach the merchant');
        const sent = requests.at(-1);
        assert.equal(sent.method, 'POST');
        assert.equal(sent.headers['x-mymobpay-signature'],
          crypto.createHmac('sha256', apiKey).update(sent.body).digest('hex'));
        if (name === 'test endpoint') {
          assert.equal(result.status, status);
          assert.equal(result.response, 'merchant endpoint response');
        }
      });
    }
  }

  for (const [name, deliver] of Object.entries(deliveries)) {
    if (name === 'retry') continue;
    await t.test(`${name}: initial private URL is rejected`, async () => {
      merchant.webhook_url = targetUrl;
      const before = requests.length;
      const internalBefore = internalRequests;
      const result = await deliver();
      assert.equal(Boolean(result.success), false);
      assert.equal(requests.length, before);
      assert.equal(internalRequests, internalBefore);
    });
  }

  await t.test('retry: initial private URL is rejected', async () => {
    retry.target_url = targetUrl;
    const before = requests.length;
    const internalBefore = internalRequests;
    const updatesBefore = updates.length;
    await processPendingWebhookRetries();
    assert.equal(requests.length, before);
    assert.equal(internalRequests, internalBefore);
    assert.equal(updates.length, updatesBefore, 'blocked retry must not be marked delivered');
  });
});
