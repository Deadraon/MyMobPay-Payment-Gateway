import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const routes = [
  ['orders/verify-utr', 'order_id'],
  ['payments/utr', 'orderId'],
  ['orders/check-status', 'order_id'],
];

// Execute the route handlers with isolated database and notification dependencies.
// Only static imports are substituted; the handler bodies run unchanged.
async function loadRoute(path, database) {
  const source = await readFile(new URL(`../app/api/${path}/route.js`, import.meta.url), 'utf8');
  const calls = [];
  const dependencies = {
    NextResponse: Response,
    supabaseAdmin: database,
    checkRateLimit: () => ({ allowed: true }),
    getClientIp: () => '127.0.0.1',
    triggerMerchantWebhook: async (...args) => calls.push(['webhook', ...args]),
    checkAndProcessSubscription: async (...args) => calls.push(['subscription', ...args]),
    syncOrderVerificationToPaymentLink: async (...args) => calls.push(['payment-link', ...args]),
    generateOrderId: () => 'order_generated',
  };
  const handler = new Function(...Object.keys(dependencies), source
    .replace(/^import .* from .*;\r?\n/gm, '')
    .replace('export async function POST', 'return async function POST'))(...Object.values(dependencies));
  return { handler, calls };
}

function databaseFor(order, { email = [], sms = [], updateError = null } = {}) {
  const tables = { orders: [order], email_logs: email, sms_logs: sms };
  const reads = [];
  const writes = [];
  return {
    reads,
    writes,
    from(table) {
      reads.push(table);
      assert.ok(table in tables, `Unexpected table ${table}`);
      let rows = tables[table];
      let values;
      let single = false;
      const query = {
        select() { return query; },
        eq(key, value) { rows = rows.filter(row => row[key] === value); return query; },
        neq(key, value) { rows = rows.filter(row => row[key] !== value); return query; },
        gte(key, value) { rows = rows.filter(row => row[key] >= value); return query; },
        ilike(key, pattern) {
          const regex = new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.')}$`, 'i');
          rows = rows.filter(row => regex.test(row[key] || ''));
          return query;
        },
        order() { return query; },
        limit(count) { rows = rows.slice(0, count); return query; },
        single() { single = true; return query; },
        maybeSingle() { single = true; return query; },
        update(update) { values = update; return query; },
        then(resolve, reject) {
          if (values) {
            writes.push({ table, values: { ...values }, ids: rows.map(row => row.id) });
            if (updateError) return Promise.resolve({ data: null, error: updateError }).then(resolve, reject);
            rows.forEach(row => Object.assign(row, values));
          }
          return Promise.resolve({ data: single ? rows[0] || null : rows, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
}

function pendingOrder(overrides = {}) {
  return {
    id: 'order_unpaid', merchant_id: 'merchant_customer', amount: 100,
    mode: 'live', status: 'pending', created_at: new Date().toISOString(),
    ...overrides,
  };
}

function requestFor(idKey, utr = '123456789012') {
  return new Request('http://localhost/api', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ [idKey]: 'order_unpaid', utr }),
  });
}

for (const [path, idKey] of routes) {
  for (const scenario of [
    { name: 'wildcard reference', utr: '%%%%%%%%%%%%', amount: 100 },
    { name: 'underscore wildcard', utr: '____________', amount: 100 },
    { name: 'partial reference', utr: '1234567890', amount: 100 },
    { name: 'amount substring', utr: '123456789012', amount: 1100 },
    { name: 'another merchant', utr: '123456789012', amount: 100, merchant: 'merchant_other' },
    { name: 'same merchant diagnostic log', utr: '123456789012', amount: 100 },
  ]) {
    test(`${path}: ${scenario.name} cannot authorize a live payment`, async () => {
      const order = pendingOrder({ customer_utr: scenario.utr });
      const alert = {
        merchant_id: scenario.merchant || order.merchant_id,
        body_snippet: `[UTR: 123456789012 | AMT: ${scenario.amount}] INR ${scenario.amount}.00 credited. UPI/123456789012`,
        message: `INR ${scenario.amount}.00 credited. UPI/123456789012`,
        created_at: new Date().toISOString(),
      };
      const database = databaseFor(order, { email: [alert], sms: [alert] });
      const { handler, calls } = await loadRoute(path, database);
      const response = await handler(requestFor(idKey, scenario.utr));
      const body = await response.json();
      assert.ok([200, 400].includes(response.status));
      assert.notEqual(body.verified, true);
      assert.equal(order.status, 'pending');
      assert.equal(order.utr, undefined);
      assert.ok(database.writes.every(write => write.values.status !== 'verified'));
      assert.deepEqual(calls, []);
      assert.ok(database.reads.every(table => table === 'orders'), 'Public verification must not trust alert logs');
    });
  }

  test(`${path}: test mode still verifies without live subscription activation`, async () => {
    const order = pendingOrder({ mode: 'test' });
    const { handler, calls } = await loadRoute(path, databaseFor(order));
    const response = await handler(requestFor(idKey));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).verified, true);
    assert.equal(order.status, 'verified');
    assert.ok(calls.some(([name]) => name === 'webhook'));
    assert.ok(calls.every(([name]) => name !== 'subscription'));
  });

  test(`${path}: returns existing trusted verification`, async () => {
    const order = pendingOrder({ status: 'verified', utr: '123456789012' });
    const database = databaseFor(order);
    const { handler, calls } = await loadRoute(path, database);
    const response = await handler(requestFor(idKey));
    assert.equal((await response.json()).verified, true);
    assert.deepEqual(database.writes, []);
    assert.deepEqual(calls, []);
  });
}

for (const [path, idKey] of routes.slice(0, 2)) {
  test(`${path}: records a valid live reference without marking paid`, async () => {
    const order = pendingOrder();
    const database = databaseFor(order);
    const { handler } = await loadRoute(path, database);
    const response = await handler(requestFor(idKey, '  AB1234567890  '));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).verified, false);
    assert.equal(order.customer_utr, 'AB1234567890');
    assert.equal(order.status, 'pending');
  });

  for (const status of ['cancelled', 'failed', 'expired']) {
    test(`${path}: does not alter ${status} orders`, async () => {
      const order = pendingOrder({ status });
      const database = databaseFor(order);
      const { handler } = await loadRoute(path, database);
      const response = await handler(requestFor(idKey));
      assert.equal(response.status, 400);
      assert.deepEqual(database.writes, []);
    });
  }

  test(`${path}: rejects pattern characters before database access`, async () => {
    for (const utr of ['%%%%%%%%%%%%', '____________', '12345678\\90', '12345*67890']) {
      const database = databaseFor(pendingOrder());
      const { handler } = await loadRoute(path, database);
      const response = await handler(requestFor(idKey, utr));
      assert.equal(response.status, 400);
      assert.deepEqual(database.reads, []);
    }
  });
}
