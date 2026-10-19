import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createClient } from '@supabase/supabase-js';
import { parseBankSms, parseTransactionText } from '../lib/parseSms.js';

const merchant = { id: 'merchant-a', subscription_status: 'active' };
const platformMerchant = { id: '677d9312-a53f-4b96-815f-53e0eee1b292' };
const utr = '123456789012';
const order = (overrides = {}) => ({
  id: 'order_target', merchant_id: merchant.id, amount: 42,
  status: 'pending', created_at: '2026-01-01T00:00:00Z', ...overrides,
});

async function webhook(kind, { orders = [], links = [], identity = merchant, authenticatedKey = 'merchant-key', beforeUpdate } = {}) {
  const effects = [];
  const queries = [];
  // Use the installed Supabase client to exercise the real filter serialization.
  // Only its HTTP transport and external side effects use synthetic fixtures.
  const supabaseAdmin = createClient('https://webhook.test', 'synthetic-service-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(input);
      const table = url.pathname.split('/').at(-1);
      const method = init.method;
      queries.push({ table, method, params: url.searchParams });
      if (table === 'email_logs' && method === 'POST') return new Response(null, { status: 201 });
      assert.ok(['orders', 'payment_links'].includes(table), `Unexpected table: ${table}`);
      assert.ok(['GET', 'PATCH'].includes(method), `Unexpected operation: ${method}`);
      if (method === 'PATCH') beforeUpdate?.(orders);
      let rows = (table === 'orders' ? orders : links).filter((row) => {
        return [...url.searchParams].every(([column, filter]) => {
          if (['select', 'order', 'limit'].includes(column)) return true;
          const dot = filter.indexOf('.');
          const op = filter.slice(0, dot);
          const value = filter.slice(dot + 1);
          if (op === 'eq') return String(row[column]) === value;
          if (op === 'in') return value.slice(1, -1).split(',').includes(row[column]);
          if (op === 'gte') return Number(row[column]) >= Number(value);
          if (op === 'lte') return Number(row[column]) <= Number(value);
          assert.fail(`Unexpected filter: ${filter}`);
        });
      });
      if (url.searchParams.has('order')) rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
      if (url.searchParams.has('limit')) rows = rows.slice(0, Number(url.searchParams.get('limit')));
      if (method === 'PATCH') rows.forEach((row) => Object.assign(row, JSON.parse(init.body)));
      const single = new Headers(init.headers).get('accept')?.includes('application/vnd.pgrst.object+json');
      if (single && rows.length !== 1) {
        return Response.json({ code: 'PGRST116', message: 'Expected one row' }, { status: 406 });
      }
      return Response.json(single ? rows[0] : rows);
    } },
  });

  // The routes use Next's @ alias. Evaluate their handler bodies with explicit
  // dependencies so tests run with node --test without starting Next or a database.
  const source = await readFile(new URL(`../app/api/webhook/${kind}/route.js`, import.meta.url), 'utf8');
  const handlerSource = source.replace(/^import .*;\r?\n/gm, '')
    .replace('export async function POST', 'async function POST');
  const POST = vm.runInNewContext(`${handlerSource}\nPOST`, {
    Buffer, crypto, supabaseAdmin, parseBankSms, parseTransactionText,
    NextResponse: { json: (body, options) => Response.json(body, options) },
    CONFIG: { platformApiKey: 'platform-key', webhookSecret: 'global-secret' },
    process: { env: { WEBHOOK_SECRET: 'global-secret' } },
    console: { log() {}, error() {}, warn() {} },
    findMerchantByApiKey: async (key) => key === authenticatedKey ? identity : null,
    checkRateLimit: () => ({ allowed: true }), getClientIp: () => '127.0.0.1',
    checkAndProcessSubscription: async (...args) => effects.push(['subscription', ...args]),
    triggerMerchantWebhook: async (...args) => effects.push(['webhook', ...args]),
    resolveMerchantIdToUuid: () => assert.fail('Unexpected subscription fallback'),
    generateOrderId: () => assert.fail('Unexpected order creation'),
  }, { filename: `app/api/webhook/${kind}/route.js` });

  return {
    effects, queries,
    async send({ text = `Rs. 42 credited UTR ${utr} for order_target`, credentials = { api_key: 'merchant-key' }, headers = {} } = {}) {
      const response = await POST(new Request(`https://app.test/api/webhook/${kind}`, {
        method: 'POST', headers: { 'content-type': 'application/json', ...headers },
        body: JSON.stringify({ ...credentials, [kind === 'email' ? 'body' : 'message']: text }),
      }));
      return { status: response.status, body: await response.json() };
    },
  };
}

for (const kind of ['email', 'sms']) {
  test(`${kind}: a merchant cannot verify or read another merchant's explicit order ID`, async () => {
    const victim = order({ merchant_id: 'merchant-b', customer_name: 'Private customer' });
    const app = await webhook(kind, { orders: [victim] });
    const result = await app.send();
    assert.equal(result.body.code, 'ORDER_NOT_FOUND');
    assert.equal(result.body.order, undefined);
    assert.equal(victim.status, 'pending');
    assert.equal(app.effects.length, 0);
  });

  test(`${kind}: the referenced owned order takes priority over the amount fallback`, async () => {
    const target = order();
    const newer = order({ id: 'order_newer', created_at: '2026-02-01T00:00:00Z' });
    const app = await webhook(kind, { orders: [target, newer] });
    const result = await app.send();
    assert.equal(result.body.code, 'ORDER_VERIFIED');
    assert.equal(result.body.order.id, target.id);
    assert.equal(target.status, 'verified');
    assert.equal(newer.status, 'pending');
    assert.equal(app.effects.length, 2);
  });

  for (const match of ['UTR', 'amount']) {
    test(`${kind}: ${match} matching stays scoped to the authenticated merchant`, async () => {
      const target = order({ customer_utr: match === 'UTR' ? utr : null });
      const victim = order({ ...target, id: 'order_victim', merchant_id: 'merchant-b', created_at: '2026-02-01T00:00:00Z' });
      const app = await webhook(kind, { orders: [target, victim] });
      const result = await app.send({ text: `Rs. 42 credited UTR ${utr}` });
      assert.equal(result.body.order.id, target.id);
      assert.equal(victim.status, 'pending');
    });
  }

  test(`${kind}: the final update rechecks ownership if the owner changes after matching`, async () => {
    const target = order();
    const app = await webhook(kind, { orders: [target], beforeUpdate: () => { target.merchant_id = 'merchant-b'; } });
    const result = await app.send();
    assert.equal(result.body.order, undefined);
    assert.equal(target.status, 'pending');
    assert.equal(app.effects.length, 0);
    const update = app.queries.find((query) => query.table === 'orders' && query.method === 'PATCH');
    assert.equal(update.params.get('merchant_id'), `eq.${merchant.id}`);
  });

  test(`${kind}: a payment link cannot authorize mutation of a foreign linked order`, async () => {
    const victim = order({ merchant_id: 'merchant-b', amount: 100 });
    const links = [{ id: 'link-a', merchant_id: merchant.id, order_id: victim.id, amount: 4200, status: 'processing', created_at: '2026-01-01T00:00:00Z' }];
    const app = await webhook(kind, { orders: [victim], links });
    const result = await app.send({ text: `Rs. 42 credited UTR ${utr}` });
    assert.equal(result.body.order, undefined);
    assert.equal(victim.status, 'pending');
    assert.equal(app.effects.length, 0);
  });

  test(`${kind}: authenticated platform merchants can reconcile another merchant's order`, async () => {
    const target = order({ merchant_id: 'merchant-b' });
    const app = await webhook(kind, { orders: [target], identity: platformMerchant });
    const result = await app.send();
    assert.equal(result.body.code, 'ORDER_VERIFIED');
    assert.equal(result.body.order.id, target.id);
    assert.equal(target.status, 'verified');
  });

  test(`${kind}: missing credentials cannot mutate an order`, async () => {
    const target = order();
    const app = await webhook(kind, { orders: [target] });
    const result = await app.send({ credentials: {} });
    assert.equal(result.status, kind === 'email' ? 400 : 401);
    assert.equal(target.status, 'pending');
    assert.equal(app.effects.length, 0);
  });

  test(`${kind}: a successfully authenticated configured platform key can reconcile orders`, async () => {
    const target = order({ merchant_id: 'merchant-b' });
    const app = await webhook(kind, { orders: [target], authenticatedKey: 'platform-key' });
    const result = await app.send({ credentials: { api_key: 'platform-key' } });
    assert.equal(result.body.code, 'ORDER_VERIFIED');
    assert.equal(target.status, 'verified');
  });
}

for (const credentials of [
  { api_key: 'merchant-key', secret: 'platform-key' },
  { api_key: 'platform-key', secret: 'merchant-key' },
  { secret: 'merchant-key' },
]) {
  test(`sms: only the authenticated credential grants platform privileges (${JSON.stringify(credentials)})`, async () => {
    const victim = order({ merchant_id: 'merchant-b' });
    const app = await webhook('sms', { orders: [victim] });
    const result = await app.send({ credentials });
    assert.equal(result.body.code, 'ORDER_NOT_FOUND');
    assert.equal(victim.status, 'pending');
    assert.equal(app.effects.length, 0);
  });
}

test('sms: API key headers retain merchant ownership restrictions', async () => {
  const victim = order({ merchant_id: 'merchant-b' });
  const app = await webhook('sms', { orders: [victim] });
  const result = await app.send({ credentials: {}, headers: { 'x-api-key': 'merchant-key' } });
  assert.equal(result.body.code, 'ORDER_NOT_FOUND');
  assert.equal(victim.status, 'pending');
});

test('sms: the authenticated global webhook secret retains cross-merchant reconciliation', async () => {
  const target = order({ merchant_id: 'merchant-b' });
  const app = await webhook('sms', { orders: [target] });
  const result = await app.send({ credentials: { secret: 'global-secret' } });
  assert.equal(result.body.code, 'ORDER_VERIFIED');
  assert.equal(target.status, 'verified');
});
