import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { state, reset } from './helpers/verification-fixtures.mjs';

const root = new URL('../', import.meta.url);
const fixtures = new URL('./helpers/verification-fixtures.mjs', import.meta.url).href;
const mocked = new Set(['lib/supabase.js', 'lib/rateLimit.js', 'lib/webhook.js', 'lib/adminSettings.js', 'lib/paymentLinks.js'].map(path => new URL(path, root).href));
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') return nextResolve('next/server.js', context);
    const target = specifier.startsWith('@/')
      ? new URL(`${specifier.slice(2)}.js`, root).href
      : specifier.startsWith('.') ? new URL(specifier, context.parentURL).href : specifier;
    if (mocked.has(target)) return { url: fixtures, shortCircuit: true };
    return nextResolve(specifier.startsWith('@/') ? target : specifier, context);
  }
});
const { POST: verifyUtr } = await import('../app/api/orders/verify-utr/route.js');
const { POST: paymentsUtr } = await import('../app/api/payments/utr/route.js');
const { POST: checkStatus } = await import('../app/api/orders/check-status/route.js');
const { POST: emailWebhook } = await import('../app/api/webhook/email/route.js');
const { POST: smsWebhook } = await import('../app/api/webhook/sms/route.js');

const reference = '426123456789';
const order = {
  id: 'order_victim', merchant_id: 'victim', amount: 499.99,
  status: 'pending', mode: 'live', created_at: new Date().toISOString()
};
const merchant = { id: 'attacker', api_key: 'attacker-key', subscription_status: 'active' };
const routes = [
  ['orders/verify-utr', verifyUtr, { order_id: order.id, utr: reference }],
  ['payments/utr', paymentsUtr, { orderId: order.id, utr: reference }],
  ['orders/check-status', checkStatus, { order_id: order.id }]
];

async function post(handler, body) {
  const response = await handler(new Request('http://localhost/api/test', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  }));
  assert.equal(response.status, 200);
  return response.json();
}

// Each request executes the production handler; only database and outbound effects are replaced.
test('merchant email logs cannot authorize public live payment verification', async t => {
  for (const [name, handler, body] of routes) {
    await t.test(`${name}: ignored email planted using another merchant API key`, async () => {
      reset({ orders: [{ ...order, customer_utr: reference }], merchants: [merchant] });
      const planted = await post(emailWebhook, {
        api_key: merchant.api_key, from: 'untrusted@example.test',
        body: `UTR: ${reference} INR 499.99`
      });
      assert.equal(planted.code, 'EMAIL_NOT_PARSED');
      assert.equal(state.tables.email_logs[0].status, 'ignored');
      assert.equal(state.tables.email_logs[0].merchant_id, merchant.id);

      const result = await post(handler, body);
      assert.equal(result.verified, false);
      assert.equal(state.tables.orders[0].status, 'pending');
      assert.equal(state.tables.orders[0].customer_utr, reference);
      assert.deepEqual(state.effects, []);
    });

    for (const status of ['ignored', 'parsed', 'matched']) {
      await t.test(`${name}: ${status} email and SMS text are not payment authority`, async () => {
        reset({
          orders: [{ ...order, customer_utr: reference }],
          email_logs: [{ merchant_id: order.merchant_id, status, body_snippet: `UTR: ${reference} INR 499.99`, created_at: new Date().toISOString() }],
          sms_logs: [{ merchant_id: order.merchant_id, message: `UTR: ${reference} INR 499.99` }]
        });
        const result = await post(handler, body);
        assert.equal(result.verified, false);
        assert.equal(state.tables.orders[0].status, 'pending');
        assert.deepEqual(state.effects, []);
        assert.ok(!state.reads.includes('email_logs') && !state.reads.includes('sms_logs'));
      });
    }

    await t.test(`${name}: test payments can still be simulated`, async () => {
      reset({ orders: [{ ...order, mode: 'test' }] });
      const result = await post(handler, body);
      assert.equal(result.verified, true);
      assert.equal(state.tables.orders[0].status, 'verified');
      assert.ok(state.effects.some(([effect]) => effect === 'webhook'));
      assert.ok(!state.effects.some(([effect]) => effect === 'subscription'));
    });

    await t.test(`${name}: already verified live orders remain verified`, async () => {
      reset({ orders: [{ ...order, status: 'verified', utr: reference }] });
      assert.equal((await post(handler, body)).verified, true);
      assert.deepEqual(state.effects, []);
    });
  }

  await t.test('status polling without a submitted UTR cannot turn amount-only log text into payment', async () => {
    reset({
      orders: [order],
      email_logs: [{ merchant_id: merchant.id, status: 'ignored', body_snippet: `UTR: ${reference} INR 499.99`, created_at: new Date().toISOString() }]
    });
    assert.equal((await post(checkStatus, { order_id: order.id })).verified, false);
    assert.equal(state.tables.orders[0].status, 'pending');
    assert.deepEqual(state.effects, []);
  });

  for (const [name, handler, body] of routes.slice(0, 2)) {
    await t.test(`${name}: a live UTR is recorded for later webhook processing`, async () => {
      reset({ orders: [order] });
      assert.equal((await post(handler, body)).verified, false);
      assert.equal(state.tables.orders[0].customer_utr, reference);
      assert.equal(state.tables.orders[0].status, 'pending');
      assert.deepEqual(state.effects, []);
    });
  }

  for (const [name, handler, field] of [['email', emailWebhook, 'body'], ['sms', smsWebhook, 'message']]) {
    await t.test(`${name}: merchant credit cannot verify another merchant's explicitly named order`, async () => {
      reset({ orders: [{ ...order, customer_utr: reference }], merchants: [merchant] });
      const result = await post(handler, {
        api_key: merchant.api_key,
        [field]: `INR 499.99 credited to your account. UTR: ${reference} ${order.id}`
      });
      assert.equal(result.code, 'ORDER_NOT_FOUND');
      assert.equal(state.tables.orders[0].status, 'pending');
      assert.deepEqual(state.effects, []);
    });

    for (const match of ['reference', 'order-id']) {
      await t.test(`${name}: ${match} match requires the exact credited amount`, async () => {
        reset({ orders: [{ ...order, merchant_id: merchant.id, customer_utr: match === 'reference' ? reference : null }], merchants: [merchant] });
        const result = await post(handler, {
          api_key: merchant.api_key,
          [field]: `INR 499.00 credited to your account. UTR: ${reference} ${match === 'order-id' ? order.id : ''}`
        });
        assert.equal(result.code, 'ORDER_NOT_FOUND');
        assert.equal(state.tables.orders[0].status, 'pending');
        assert.deepEqual(state.effects, []);
      });

      await t.test(`${name}: authenticated ${match} credit still verifies the merchant's pending order`, async () => {
        reset({ orders: [{ ...order, merchant_id: merchant.id, customer_utr: match === 'reference' ? reference : null }], merchants: [merchant] });
        const result = await post(handler, {
          api_key: merchant.api_key,
          [field]: `INR 499.99 credited to your account. UTR: ${reference} ${match === 'order-id' ? order.id : ''}`
        });
        assert.equal(result.code, 'ORDER_VERIFIED');
        assert.equal(state.tables.orders[0].status, 'verified');
        assert.equal(state.tables.orders[0].utr, reference);
      });
    }
  }
});

test.after(() => hooks.deregister());
