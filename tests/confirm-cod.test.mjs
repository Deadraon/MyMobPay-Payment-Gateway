import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compileFunction } from 'node:vm';
import { createClient } from '@supabase/supabase-js';
import nextServer from 'next/server.js';

// Inject route dependencies without a Next.js server or its @/ import resolver.
const routeSource = readFileSync(new URL('../app/api/orders/confirm-cod/route.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?$/gm, '')
  .replace(/^export /gm, '');
const loadRoute = compileFunction(`${routeSource}\nreturn POST;`, [
  'NextResponse', 'supabaseAdmin', 'checkRateLimit', 'getClientIp', 'triggerMerchantWebhook'
]);

const delivery = {
  order_id: 'MMP_TEST_ORDER',
  customer_name: 'Test Buyer',
  customer_phone: '9876543210',
  delivery_address: '123 Test Street',
  pincode: '110001',
  city: 'Test City'
};

function setup(overrides = {}, beforeUpdate) {
  const order = {
    id: delivery.order_id,
    merchant_id: 'test-merchant',
    status: 'pending',
    mode: 'live',
    method: 'UPI',
    note: 'Prepaid order',
    utr: null,
    verified_at: null,
    ...overrides
  };
  const original = { ...order };
  const writes = [];
  const webhooks = [];
  // Exercise the installed Supabase query builder; only its HTTP transport is fake.
  const client = createClient('https://cod-test.supabase.co', 'synthetic-test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(input);
        assert.equal(url.pathname, '/rest/v1/orders');
        assert.equal(url.searchParams.get('id'), `eq.${order.id}`);
        if (init.method === 'GET') return Response.json({ ...order });
        assert.equal(init.method, 'PATCH');
        writes.push({ url, payload: JSON.parse(init.body) });
        beforeUpdate?.(order);
        const matches = [...url.searchParams].every(([key, value]) =>
          key === 'select' || value === `eq.${order[key]}`
        );
        if (!matches) return Response.json([]);
        Object.assign(order, writes.at(-1).payload);
        return Response.json([{ ...order }]);
      }
    }
  });
  const post = loadRoute(
    nextServer.NextResponse, client, () => ({ allowed: true }), () => 'test-ip',
    async (id) => webhooks.push(id)
  );
  const submit = (extra = {}) => post(new Request('https://checkout.test/api/orders/confirm-cod', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...delivery, ...extra })
  }));
  return { order, original, writes, webhooks, submit };
}

test('COD cannot verify live prepaid orders, even with spoofed mode and method', async () => {
  const fixture = setup();
  const response = await fixture.submit({ mode: 'test', method: 'COD' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'METHOD_UNAVAILABLE');
  assert.deepEqual(fixture.order, fixture.original);
  assert.equal(fixture.writes.length, 0);
  assert.equal(fixture.webhooks.length, 0);
});

test('COD fails closed for any stored mode other than test, including verified orders', async (t) => {
  for (const mode of ['live', null, undefined, '', 'TEST']) {
    await t.test(String(mode), async () => {
      const fixture = setup({ mode, status: 'verified' });
      const response = await fixture.submit();
      assert.equal(response.status, 400);
      assert.equal((await response.json()).code, 'METHOD_UNAVAILABLE');
      assert.deepEqual(fixture.order, fixture.original);
      assert.equal(fixture.writes.length, 0);
      assert.equal(fixture.webhooks.length, 0);
    });
  }
});

test('closed sandbox orders cannot be revived by COD', async (t) => {
  for (const status of ['expired', 'cancelled', 'failed', 'rejected', 'paid', 'completed']) {
    await t.test(status, async () => {
      const fixture = setup({ mode: 'test', status });
      const response = await fixture.submit();
      assert.equal(response.status, 409);
      assert.equal((await response.json()).code, 'ORDER_TERMINATED');
      assert.deepEqual(fixture.order, fixture.original);
      assert.equal(fixture.writes.length, 0);
      assert.equal(fixture.webhooks.length, 0);
    });
  }
});

test('pending sandbox orders retain COD simulation and retry without another write or webhook', async () => {
  const fixture = setup({ mode: 'test' });
  const response = await fixture.submit();
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.verified, true);
  assert.match(result.cod_ref, /^COD_/);
  assert.equal(fixture.order.status, 'verified');
  assert.ok(fixture.order.verified_at);
  assert.match(fixture.order.note, /COD Delivery to: Test Buyer/);
  assert.equal(fixture.writes.length, 1);
  assert.deepEqual(fixture.webhooks, [fixture.order.id]);

  const retry = await fixture.submit();
  assert.equal(retry.status, 200);
  assert.equal((await retry.json()).verified, true);
  assert.equal(fixture.writes.length, 1);
  assert.equal(fixture.webhooks.length, 1);
});

test('concurrent mode or status changes prevent COD updates and webhooks', async (t) => {
  for (const change of [{ mode: 'live' }, { status: 'expired' }, { status: 'verified', utr: 'BANK_REF' }]) {
    await t.test(JSON.stringify(change), async () => {
      const fixture = setup({ mode: 'test' }, (order) => Object.assign(order, change));
      const response = await fixture.submit();
      assert.equal(response.status, 409);
      assert.equal((await response.json()).code, 'ORDER_CHANGED');
      assert.deepEqual(fixture.order, { ...fixture.original, ...change });
      assert.equal(fixture.webhooks.length, 0);
    });
  }
});
