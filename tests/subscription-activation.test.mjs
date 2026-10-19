import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { transform } from 'next/dist/build/swc/index.js';
import nextServer from 'next/server.js';

// Compile the real Next.js handler and substitute only its external dependencies.
const source = await readFile(new URL('../app/api/merchant/subscription/activate/route.js', import.meta.url), 'utf8');
const { code } = await transform(source, {
  filename: 'route.js',
  jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' },
  module: { type: 'commonjs' },
});

const merchantId = '11111111-1111-4111-8111-111111111111';
const otherMerchantId = '22222222-2222-4222-8222-222222222222';

function setup({ progress = {}, orderError = null, updateError = null } = {}) {
  const merchant = {
    id: merchantId,
    business_name: 'Test Merchant',
    subscription_status: 'inactive',
    subscription_expires_at: null,
    setup_progress: progress,
  };
  const orders = [
    { id: 'foreign-checkout', merchant_id: otherMerchantId, external_ref: 'customer-checkout', status: 'pending', amount: 1000 },
    { id: 'pending-subscription', merchant_id: merchantId, external_ref: merchantId, status: 'pending', amount: 499 },
    { id: 'verified-subscription', merchant_id: merchantId, external_ref: merchantId, status: 'verified', amount: 499 },
  ];
  const queries = [];
  const invoices = [];
  const supabaseAdmin = {
    from(table) {
      const query = { table, filters: [], operation: 'select' };
      queries.push(query);
      const builder = {
        select() { return builder; },
        eq(key, value) { query.filters.push([key, value]); return builder; },
        order() { return builder; },
        limit() { return builder; },
        single() { query.single = true; return builder; },
        maybeSingle() { query.single = true; return builder; },
        update(value) { query.operation = 'update'; query.value = value; return builder; },
        insert(value) { query.operation = 'insert'; query.value = value; return builder; },
        then(resolve, reject) {
          if (table === 'orders' && orderError) return Promise.reject(orderError).then(resolve, reject);
          const error = table === 'merchants' && query.operation === 'update' ? updateError : null;
          const rows = (table === 'merchants' ? [merchant] : orders)
            .filter(row => query.filters.every(([key, value]) => row[key] === value));
          if (!error && query.operation === 'update') rows.forEach(row => Object.assign(row, query.value));
          if (!error && query.operation === 'insert') orders.push(query.value);
          return Promise.resolve({ data: query.single ? rows[0] || null : rows, error }).then(resolve, reject);
        },
      };
      return builder;
    },
    auth: { admin: { getUserById: async () => ({ data: { user: { email: 'merchant@example.test' } } }) } },
  };
  const dependencies = {
    'next/server': nextServer,
    '@/lib/supabase': { supabaseAdmin },
    '@/lib/mailer': { sendSubscriptionInvoiceEmail: async invoice => invoices.push(invoice) },
    '@/lib/orderId': { generateOrderId: () => 'generated-order' },
    '@/lib/merchantId': { resolveMerchantIdToUuid: async id => id, formatMerchantId: id => id },
    '@/lib/adminSettings': { verifyAdminAuth: async () => false },
  };
  const exports = {};
  runInNewContext(code, {
    exports,
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    console: { log() {}, warn() {}, error() {} },
  });
  return {
    merchant, orders, queries, invoices,
    activate: body => exports.POST(new Request('http://localhost/api/merchant/subscription/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, ...body }),
    })),
  };
}

for (const planId of ['trial', 'trial_3day']) {
  for (const orderId of ['foreign-checkout', 'pending-subscription', undefined]) {
    test(`${planId} activation does not verify payments (orderId: ${orderId})`, async () => {
      const previousPayment = '2026-01-01T00:00:00.000Z';
      const state = setup({ progress: { last_payment_at: previousPayment, existing_setting: true } });
      const before = structuredClone(state.orders);
      const startedAt = Date.now();
      const response = await state.activate({ planId, orderId, amount: 0, durationDays: 999 });
      const body = await response.json();

      assert.equal(response.status, 200);
      assert.equal(body.success, true);
      assert.deepEqual(state.orders, before);
      assert.equal(state.queries.some(query => query.table === 'orders'), false);
      assert.equal(state.invoices.length, 0);
      assert.equal(body.invoiceRef, undefined);
      assert.equal(state.merchant.subscription_status, 'active');
      assert.equal(state.merchant.sandbox_mode, false);
      assert.equal(state.merchant.setup_progress.plan_type, 'trial_3day');
      assert.ok(Date.parse(state.merchant.setup_progress.trial_activated_at) >= startedAt);
      const expiry = Date.parse(body.subscription_expires_at);
      assert.ok(expiry >= startedAt + 3 * 86400000 && expiry <= Date.now() + 3 * 86400000);
      assert.equal(state.merchant.setup_progress.last_payment_at, previousPayment);
      assert.equal(state.merchant.setup_progress.subscription_activated_at, undefined);
      assert.equal(state.merchant.setup_progress.existing_setting, true);
    });
  }
}

test('a fresh trial ignores payment UTRs and does not require order services', async () => {
  const state = setup({ orderError: new Error('Order service unavailable') });
  const response = await state.activate({ planId: 'trial', utr: '123456789012', orderId: 'foreign-checkout' });
  assert.equal(response.status, 200);
  assert.equal(state.merchant.setup_progress.last_payment_at, undefined);
  assert.equal(state.queries.some(query => query.table === 'orders'), false);
});

test('a consumed trial cannot be activated again', async () => {
  const state = setup({ progress: { trial_activated_at: '2026-01-01T00:00:00.000Z' } });
  const response = await state.activate({ planId: 'trial', orderId: 'foreign-checkout' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'TRIAL_ALREADY_USED');
  assert.equal(state.queries.some(query => query.operation !== 'select'), false);
});

test('a failed merchant update does not report successful trial activation', async () => {
  const state = setup({ updateError: { message: 'Update failed' } });
  const response = await state.activate({ planId: 'trial' });
  assert.equal(response.status, 500);
  assert.equal(state.merchant.subscription_status, 'inactive');
  assert.equal(state.invoices.length, 0);
});

test('paid activation still rejects an unpaid order', async () => {
  const state = setup();
  const response = await state.activate({ planId: '1m', orderId: 'pending-subscription' });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).code, 'UNVERIFIED_PAYMENT');
  assert.equal(state.queries.some(query => query.operation !== 'select'), false);
});

test('paid activation still accepts a verified payment and sends its invoice', async () => {
  const state = setup();
  const response = await state.activate({ planId: '1m', orderId: 'verified-subscription', utr: '123456789012' });
  assert.equal(response.status, 200);
  assert.ok((await response.json()).invoiceRef);
  assert.ok(state.merchant.setup_progress.last_payment_at);
  assert.ok(state.merchant.setup_progress.subscription_activated_at);
  assert.equal(state.invoices.length, 1);
});
