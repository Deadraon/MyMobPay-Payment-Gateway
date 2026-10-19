import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { NextResponse } from 'next/server.js';
import { parseTransactionText } from '../lib/parseSms.js';

const utr = '123456789012';
const routes = [
  ['payments/utr', { orderId: 'order_victim', utr }],
  ['orders/verify-utr', { order_id: 'order_victim', utr }],
  ['orders/check-status', { order_id: 'order_victim' }],
];

function fixture(overrides = {}) {
  const tables = {
    orders: [{ id: 'order_victim', merchant_id: 'victim', amount: '100.00',
      status: 'pending', mode: 'live', created_at: new Date().toISOString(), ...overrides }],
    email_logs: [], sms_logs: [],
  };
  const effects = [];
  const queries = [];
  const supabaseAdmin = {
    from(table) {
      queries.push(table);
      let filters = [], changes, inserted, limit = Infinity;
      const query = {
        select() { return query; },
        eq(key, value) { filters.push(row => row[key] === value); return query; },
        neq(key, value) { filters.push(row => row[key] !== value); return query; },
        gte(key, value) { filters.push(row => row[key] >= value); return query; },
        ilike(key, pattern) {
          const expression = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('%', '.*').replaceAll('_', '.');
          filters.push(row => new RegExp(`^${expression}$`, 'i').test(row[key] || ''));
          return query;
        },
        order() { return query; },
        limit(value) { limit = value; return query; },
        update(value) { changes = value; return query; },
        insert(value) { inserted = Array.isArray(value) ? value : [value]; return query; },
        single() { return execute(true); },
        maybeSingle() { return execute(true); },
        then(resolve, reject) { return execute(false).then(resolve, reject); },
      };
      async function execute(single) {
        assert.ok(tables[table], `Unexpected table: ${table}`);
        if (inserted) tables[table].push(...inserted);
        const rows = (inserted || tables[table].filter(row => filters.every(filter => filter(row)))).slice(0, limit);
        if (changes) rows.forEach(row => Object.assign(row, changes));
        return { data: single ? (rows[0] ? { ...rows[0] } : null) : rows.map(row => ({ ...row })), error: null };
      }
      return query;
    },
  };
  return { tables, queries, effects, dependencies: {
    NextResponse, supabaseAdmin, parseTransactionText,
    checkRateLimit: () => ({ allowed: true }), getClientIp: () => '127.0.0.1',
    findMerchantByApiKey: async key => key === 'attacker-key'
      ? { id: 'attacker', subscription_status: 'active' } : null,
    CONFIG: { platformApiKey: 'platform-key' },
    triggerMerchantWebhook: async () => { effects.push('webhook'); },
    checkAndProcessSubscription: async () => { effects.push('subscription'); },
    syncOrderVerificationToPaymentLink: async () => { effects.push('payment-link'); },
    console,
  } };
}

async function invoke(route, body, state) {
  // Execute the real route body with isolated database, rate limit and outbound effects.
  // Static imports are supplied through the VM context; dynamic external calls are not used by these fixtures.
  const source = await readFile(new URL(`../app/api/${route}/route.js`, import.meta.url), 'utf8');
  const script = source.replace(/^import .+ from .+;\r?\n/gm, '')
    .replace('export async function POST', 'async function POST');
  const post = new vm.Script(`${script}\nPOST;`, { filename: `${route}/route.js` })
    .runInNewContext(state.dependencies);
  return post(new Request(`http://localhost/api/${route}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  }));
}

for (const [route, body] of routes) {
  test(`${route}: an ignored merchant email cannot verify another merchant's live order`, async () => {
    const state = fixture({ customer_utr: utr });
    const emailBody = `UTR: ${utr} Rs. 100.00`;
    assert.equal(parseTransactionText(emailBody), null);
    const emailResponse = await invoke('webhook/email', { api_key: 'attacker-key', body: emailBody }, state);
    assert.equal((await emailResponse.json()).code, 'EMAIL_NOT_PARSED');
    assert.equal(state.tables.email_logs[0].status, 'ignored');
    assert.equal(state.tables.email_logs[0].merchant_id, 'attacker');

    const response = await invoke(route, body, state);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).verified, false);
    assert.equal(state.tables.orders[0].status, 'pending');
    assert.equal(state.tables.orders[0].utr, undefined);
    assert.deepEqual(state.effects, []);
  });
}

test('status polling cannot infer a payment from an ignored email without a customer UTR', async () => {
  const state = fixture();
  await invoke('webhook/email', { api_key: 'attacker-key', body: `UTR: ${utr} INR 100.00` }, state);
  state.tables.email_logs[0].created_at = new Date().toISOString();
  const response = await invoke('orders/check-status', { order_id: 'order_victim' }, state);
  assert.equal((await response.json()).verified, false);
  assert.equal(state.tables.orders[0].status, 'pending');
  assert.deepEqual(state.effects, []);
});

for (const [route, body] of routes) {
  test(`${route}: diagnostic logs never authorize live payments`, async t => {
    for (const [table, log] of [
      ['email_logs', { merchant_id: 'victim', status: 'parsed', body_snippet: `Rs. 100.00 credited. UTR: ${utr}` }],
      ['email_logs', { merchant_id: 'victim', status: 'matched', body_snippet: `Rs. 100.00 credited. UTR: ${utr}` }],
      ['email_logs', { merchant_id: 'attacker', status: 'parsed', body_snippet: `Rs. 100.99 credited. UTR: ${utr}9` }],
      ['sms_logs', { merchant_id: 'attacker', message: `Rs. 100.00 credited. UTR: ${utr}` }],
    ]) {
      await t.test(JSON.stringify(log), async () => {
        const state = fixture({ customer_utr: utr });
        state.tables[table].push({ ...log, created_at: new Date().toISOString() });
        const response = await invoke(route, body, state);
        assert.equal(response.status, 200);
        assert.equal((await response.json()).verified, false);
        assert.equal(state.tables.orders[0].status, 'pending');
        assert.equal(state.tables.orders[0].customer_utr, utr);
        assert.equal(state.tables.orders[0].utr, undefined);
        assert.equal(state.tables.orders[0].verified_at, undefined);
        assert.ok(state.queries.every(table => table === 'orders'));
        assert.deepEqual(state.effects, []);
      });
    }
  });

  test(`${route}: test orders still simulate verification`, async () => {
    const state = fixture({ mode: 'test' });
    const response = await invoke(route, body, state);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).verified, true);
    assert.equal(state.tables.orders[0].status, 'verified');
    assert.ok(state.effects.includes('webhook'));
    assert.ok(!state.effects.includes('subscription'));
  });

  test(`${route}: already verified live orders are reported without new effects`, async () => {
    const state = fixture({ status: 'verified', utr });
    const response = await invoke(route, body, state);
    assert.equal((await response.json()).verified, true);
    assert.deepEqual(state.effects, []);
  });

  test(`${route}: webhook confirmation is reflected in subsequent checkout requests`, async () => {
    const state = fixture({ merchant_id: 'attacker', amount: 100 });
    const response = await invoke('webhook/email', {
      api_key: 'attacker-key', body: `Rs. 100.00 credited. UTR: ${utr}`,
    }, state);
    assert.equal((await response.json()).code, 'ORDER_VERIFIED');
    assert.equal(state.tables.orders[0].status, 'verified');
    assert.equal(state.tables.email_logs[0].status, 'matched');
    const effectCount = state.effects.length;
    assert.equal((await (await invoke(route, body, state)).json()).verified, true);
    assert.equal(state.effects.length, effectCount);
  });
}

for (const [route, body] of routes.slice(0, 2)) {
  test(`${route}: an unconfirmed UTR is recorded as a customer claim only`, async () => {
    const state = fixture();
    const response = await invoke(route, body, state);
    assert.equal((await response.json()).verified, false);
    assert.equal(state.tables.orders[0].customer_utr, utr);
    assert.equal(state.tables.orders[0].status, 'pending');
    assert.equal(state.tables.orders[0].utr, undefined);
    assert.deepEqual(state.effects, []);
  });

  test(`${route}: terminated orders cannot be verified`, async () => {
    for (const status of ['cancelled', 'failed', 'expired']) {
      const state = fixture({ status });
      const response = await invoke(route, body, state);
      assert.equal(response.status, 400);
      assert.equal((await response.json()).code, 'ORDER_TERMINATED');
      assert.equal(state.tables.orders[0].status, status);
      assert.deepEqual(state.effects, []);
    }
  });
}
