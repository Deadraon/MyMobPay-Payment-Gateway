import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { compileFunction } from 'node:vm';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server.js';
import { CONFIG } from '../lib/config.js';
import { hashApiKey } from '../lib/merchantAuth.js';
import { parseBankSms } from '../lib/parseSms.js';

const merchantId = '11111111-1111-4111-8111-111111111111';
const victimId = '22222222-2222-4222-8222-222222222222';
const merchantKey = 'sms-test-merchant-key';
const platformSecret = 'sms-test-private-platform-secret';
const publicKey = CONFIG.platformApiKey;
const utr = '123456789012';
const message = `Rs. 499 credited. UTR ${utr}`;
const source = readFileSync(new URL('../app/api/webhook/sms/route.js', import.meta.url), 'utf8');

// Execute the actual handler with isolated dependencies, without starting Next or contacting Supabase.
function setup({ orders = [], links = [], merchant = {}, webhookSecret = platformSecret } = {}) {
  const tables = { orders: structuredClone(orders), payment_links: structuredClone(links) };
  const requests = [];
  const webhooks = [];
  const subscriptions = [];
  const credentials = [
    { id: merchantId, api_key: merchantKey, subscription_status: 'active', ...merchant },
    // Even when the public checkout key resolves to a platform merchant, it cannot authenticate SMS.
    { id: '677d9312-a53f-4b96-815f-53e0eee1b292', api_key: publicKey, subscription_status: 'active' }
  ];
  const supabaseAdmin = createClient('https://sms-test.invalid', 'synthetic-test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Use the installed Supabase query builder; emulate only its REST storage boundary.
      fetch: async (input, options) => {
        const url = new URL(input);
        const table = tables[url.pathname.split('/').at(-1)];
        assert.ok(table, `Unexpected database table: ${url.pathname}`);
        requests.push({ method: options.method, url });
        let rows = table.filter(row => [...url.searchParams].every(([column, filter]) => {
          if (['select', 'order', 'limit', 'columns'].includes(column)) return true;
          const dot = filter.indexOf('.');
          const operator = filter.slice(0, dot);
          const value = filter.slice(dot + 1);
          if (operator === 'eq') return String(row[column]) === value;
          if (operator === 'gte') return Number(row[column]) >= Number(value);
          if (operator === 'lte') return Number(row[column]) <= Number(value);
          if (operator === 'in') return value.slice(1, -1).split(',').includes(row[column]);
          assert.fail(`Unexpected filter: ${filter}`);
        }));
        if (url.searchParams.has('order')) {
          const [column, direction] = url.searchParams.get('order').split('.');
          rows.sort((a, b) => String(a[column]).localeCompare(String(b[column])) * (direction === 'desc' ? -1 : 1));
        }
        if (url.searchParams.has('limit')) rows = rows.slice(0, Number(url.searchParams.get('limit')));
        if (options.method === 'PATCH') {
          rows.forEach(row => Object.assign(row, JSON.parse(options.body)));
        } else if (options.method === 'POST') {
          rows = [{ id: 'generated-record', ...JSON.parse(options.body) }];
          table.push(...rows);
        } else {
          assert.equal(options.method, 'GET');
        }
        const single = new Headers(options.headers).get('accept') === 'application/vnd.pgrst.object+json';
        return Response.json(single ? rows[0] ?? null : rows);
      }
    }
  });
  const bindings = {
    NextResponse, crypto, supabaseAdmin, parseBankSms, CONFIG, hashApiKey,
    process: { env: { WEBHOOK_SECRET: webhookSecret } },
    checkRateLimit: () => ({ allowed: true }),
    getClientIp: () => '127.0.0.1',
    findMerchantByApiKey: async key => credentials.find(row => hashApiKey(row.api_key) === hashApiKey(key)) ?? null,
    triggerMerchantWebhook: async id => webhooks.push(id),
    checkAndProcessSubscription: async (order, key) => subscriptions.push({ order, key }),
    resolveMerchantIdToUuid: async id => id === victimId ? victimId : null,
    generateOrderId: () => 'order_generated'
  };
  const handlerSource = source.replace(/^import .*;\r?\n/gm, '').replace('export async function POST', 'async function POST');
  const POST = compileFunction(`${handlerSource}\nreturn POST;`, Object.keys(bindings))(...Object.values(bindings));
  return {
    tables, requests, webhooks, subscriptions,
    send: async (body, headers = {}) => {
      const response = await POST(new Request('https://sms-test.invalid/api/webhook/sms', {
        method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ message, ...body })
      }));
      return { status: response.status, body: await response.json() };
    }
  };
}

function order(owner = victimId, extra = {}) {
  return { id: 'order_target', merchant_id: owner, status: 'pending', amount: 499, ...extra };
}

function link(owner = victimId, extra = {}) {
  return { id: 'link_target', merchant_id: owner, token: 'synthetic-link-token', status: 'active', amount: 49900, ...extra };
}

test('SMS rejects missing, invalid, and public checkout credentials', async t => {
  const bodies = [{}, { api_key: 'invalid', secret: 'invalid' }];
  for (const key of [publicKey, `live_${publicKey}`, `test_${publicKey}`, ` live_${publicKey} `]) {
    bodies.push({ api_key: key }, { secret: key });
  }
  for (const body of bodies) {
    await t.test(JSON.stringify(body), async () => {
      const app = setup({ orders: [order()] });
      assert.equal((await app.send(body)).status, 401);
      assert.equal(app.requests.length, 0);
      assert.equal(app.webhooks.length, 0);
    });
  }
  const app = setup({ webhookSecret: publicKey });
  assert.equal((await app.send({ secret: publicKey })).status, 401);
});

test('unsuccessful credential fields cannot bypass subscription enforcement', async t => {
  for (const merchant of [
    { subscription_status: 'inactive' },
    { subscription_status: 'active', subscription_expires_at: '2000-01-01T00:00:00Z' },
    { id: 'dd45279e-7a2c-413c-9e24-24d88011b680', subscription_status: 'inactive' }
  ]) {
    for (const body of [
      { api_key: merchantKey, secret: publicKey },
      { api_key: publicKey, secret: merchantKey }
    ]) {
      await t.test(JSON.stringify({ merchant, body }), async () => {
        const app = setup({ merchant, orders: [order()] });
        assert.equal((await app.send(body)).status, 403);
        assert.equal(app.requests.length, 0);
        assert.equal(app.subscriptions.length, 0);
      });
    }
  }
});

const matchingPaths = [
  { name: 'customer UTR', orders: [order(victimId, { customer_utr: utr })] },
  { name: 'explicit order ID', orders: [order()], message: `${message} order_target` },
  { name: 'amount', orders: [order()] },
  { name: 'payment link', links: [link()] },
  { name: 'linked order', orders: [order(victimId, { amount: 100 })], links: [link(victimId, { order_id: 'order_target' })] }
];

test('merchant callbacks cannot verify another tenant through any matching path', async t => {
  for (const path of matchingPaths) {
    for (const body of [
      { api_key: merchantKey, secret: publicKey },
      { api_key: publicKey, secret: merchantKey },
      { api_key: merchantKey }
    ]) {
      await t.test(`${path.name}: ${JSON.stringify(body)}`, async () => {
        const app = setup(path);
        const before = structuredClone(app.tables);
        const result = await app.send({ ...body, message: path.message ?? message });
        assert.equal(result.status, 200);
        assert.equal(result.body.code, 'ORDER_NOT_FOUND');
        assert.deepEqual(app.tables, before);
        assert.equal(app.webhooks.length, 0);
        assert.equal(app.subscriptions.length, 0);
      });
    }
  }
});

test('active merchants can verify their own payments through every matching path', async t => {
  for (const path of matchingPaths) {
    await t.test(path.name, async () => {
      const app = setup({
        orders: path.orders?.map(row => ({ ...row, merchant_id: merchantId })),
        links: path.links?.map(row => ({ ...row, merchant_id: merchantId }))
      });
      const result = await app.send({ api_key: 'invalid', secret: `live_${merchantKey}`, message: path.message ?? message });
      assert.equal(result.status, 200);
      assert.equal(result.body.code, 'ORDER_VERIFIED');
      assert.equal(result.body.order.merchant_id, merchantId);
      assert.equal(result.body.order.utr, utr);
      assert.deepEqual(app.webhooks, [result.body.order.id]);
      assert.equal(app.subscriptions[0].key, `live_${merchantKey}`);
    });
  }
});

test('both supported API key headers authenticate tenant-scoped callbacks', async t => {
  for (const header of ['x-api-key', 'X-MyMobPay-API-Key']) {
    await t.test(header, async () => {
      const app = setup({ orders: [order(merchantId)] });
      const result = await app.send({ secret: publicKey }, { [header]: merchantKey });
      assert.equal(result.body.code, 'ORDER_VERIFIED');
      assert.equal(app.subscriptions[0].key, merchantKey);
    });
  }
});

test('a payment link cannot lead a merchant to another tenant\'s order', async () => {
  const app = setup({ orders: [order(victimId, { amount: 100 })], links: [link(merchantId, { order_id: 'order_target' })] });
  const result = await app.send({ api_key: merchantKey });
  assert.equal(result.body.code, 'ORDER_VERIFIED');
  assert.equal(result.body.order.merchant_id, merchantId);
  assert.equal(app.tables.orders.find(row => row.id === 'order_target').status, 'pending');
});

test('the private platform secret grants platform scope even with an unrelated merchant key', async t => {
  for (const path of matchingPaths) {
    await t.test(path.name, async () => {
      const app = setup({ ...path, merchant: { subscription_status: 'inactive' } });
      const result = await app.send({ api_key: merchantKey, secret: platformSecret, message: path.message ?? message });
      assert.equal(result.status, 200);
      assert.equal(result.body.code, 'ORDER_VERIFIED');
      assert.equal(result.body.order.merchant_id, victimId);
      assert.equal(app.subscriptions[0].key, undefined);
    });
  }
});

test('only the private platform callback can use the subscription fallback', async () => {
  const subscriptionMessage = `${message} Subscription_1m_${victimId}`;
  const merchantApp = setup();
  const denied = await merchantApp.send({ api_key: merchantKey, secret: publicKey, message: subscriptionMessage });
  assert.equal(denied.body.code, 'ORDER_NOT_FOUND');
  assert.equal(merchantApp.tables.orders.length, 0);
  assert.equal(merchantApp.subscriptions.length, 0);

  const platformApp = setup();
  const allowed = await platformApp.send({ secret: platformSecret, message: subscriptionMessage });
  assert.equal(allowed.body.code, 'ORDER_VERIFIED');
  assert.equal(allowed.body.order.merchant_id, victimId);
  assert.equal(platformApp.subscriptions.length, 1);
});

test('missing private platform configuration fails closed', async () => {
  const app = setup({ webhookSecret: '' });
  assert.equal((await app.send({ secret: platformSecret })).status, 401);
});
