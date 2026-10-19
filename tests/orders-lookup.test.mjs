import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server.js';

// Load the route with isolated dependencies: Node's test runner has no Next.js aliases.
const dependenciesUrl = `data:text/javascript,${encodeURIComponent(`
  export let supabaseAdmin;
  export function setClient(client) { supabaseAdmin = client; }
  export const CONFIG = {};
  export const checkRateLimit = () => ({ allowed: true });
  export const getClientIp = () => '127.0.0.1';
  export const generateOrderId = () => {};
  export const findMerchantByApiKey = async () => null;
  export const syncOrderVerificationToPaymentLink = async () => {};
`)}`;
const routeSource = await readFile(new URL('../app/api/orders/route.js', import.meta.url), 'utf8');
const isolatedSource = routeSource
  .replace(/from '@\/lib\/[^']+'/g, `from ${JSON.stringify(dependenciesUrl)}`)
  .replace("from 'next/server'", `from '${import.meta.resolve('next/server.js')}'`);
const { GET } = await import(`data:text/javascript,${encodeURIComponent(isolatedSource)}`);
const { setClient } = await import(dependenciesUrl);

const order = {
  id: 'order_AbC123',
  external_ref: 'pl_Secret123',
  merchant_id: 'merchant-a',
  amount: 125,
  status: 'expired',
  created_at: new Date().toISOString(),
  utr: '123456789012',
};
const merchant = { id: 'merchant-a', business_name: 'Fixture Merchant', upi_id: 'fixture@upi' };
const token = 'a'.repeat(48);

function configureLookup(orders = [order], links = []) {
  const queries = [];
  setClient(createClient('https://receipt-test.invalid', 'synthetic-test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(input);
        queries.push(url);
        const table = url.pathname.split('/').at(-1);
        let rows = { orders, merchants: [merchant], payment_links: links }[table];
        assert.ok(rows, `Unexpected table: ${table}`);
        for (const column of ['id', 'external_ref', 'token']) {
          const filter = url.searchParams.get(column);
          if (!filter) continue;
          // Only equality is supported by this fixture; inspect the actual SDK filters below.
          if (!filter.startsWith('eq.')) {
            return Response.json({ message: 'Nonliteral lookup' }, { status: 400 });
          }
          rows = rows.filter(row => row[column] === filter.slice(3));
        }
        if (url.searchParams.has('order')) {
          rows = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
        }
        if (url.searchParams.has('limit')) {
          rows = rows.slice(0, Number(url.searchParams.get('limit')));
        }
        return Response.json(new Headers(init.headers).get('accept') === 'application/vnd.pgrst.object+json' ? rows[0] : rows);
      },
    },
  }));
  return queries;
}

async function lookup(parameter, value) {
  const url = new URL('https://checkout.test/api/orders');
  if (parameter) url.searchParams.set(parameter, value);
  const response = await GET(new Request(url));
  assert.ok(response instanceof NextResponse);
  return { status: response.status, body: await response.json() };
}

test('public receipt lookup requires literal identifiers for every query alias', async () => {
  for (const parameter of ['id', 'order_id', 'ref']) {
    for (const value of ['%', '*', '_', 'order_%', 'pl_%', 'order_AbC12_', 'pl_Secret12_', 'pl\\_%']) {
      const queries = configureLookup();
      const result = await lookup(parameter, value);
      assert.equal(result.status, 404, `${parameter}=${value}`);
      assert.deepEqual(result.body, { error: 'Order not found' });
      for (const query of queries) {
        for (const column of ['id', 'external_ref', 'token']) {
          const filter = query.searchParams.get(column);
          if (filter) assert.equal(filter, `eq.${value}`, `${parameter}=${value}: ${column}`);
        }
      }
      assert.ok(queries.every(query => !query.pathname.endsWith('/merchants')));
    }
  }
});

test('canonical IDs, references, and existing display cleanup still resolve receipts', async () => {
  for (const parameter of ['id', 'order_id', 'ref']) {
    for (const value of [order.id, order.external_ref, `  #-${order.id}  `]) {
      configureLookup();
      const result = await lookup(parameter, value);
      assert.equal(result.status, 200, `${parameter}=${value}`);
      assert.equal(result.body.orderId, order.id);
      assert.equal(result.body.merchant.upi_id, merchant.upi_id);
    }
  }
});

test('literal references containing pattern characters select only their exact receipt', async () => {
  for (const external_ref of ['invoice_%', 'invoice_*', 'invoice_\\ref']) {
    const exactOrder = { ...order, id: 'order_literal', external_ref };
    configureLookup([order, exactOrder]);
    const result = await lookup('ref', external_ref);
    assert.equal(result.status, 200);
    assert.equal(result.body.orderId, exactOrder.id);
  }
});

test('repeated exact references retain the latest-order behavior', async () => {
  const olderOrder = { ...order, id: 'order_older', created_at: '2020-01-01T00:00:00.000Z' };
  configureLookup([olderOrder, order]);
  const result = await lookup('ref', order.external_ref);
  assert.equal(result.status, 200);
  assert.equal(result.body.orderId, order.id);
});

test('exact payment-link tokens still resolve their linked order', async () => {
  configureLookup([order], [{ token, order_id: order.id }]);
  const result = await lookup('id', token);
  assert.equal(result.status, 200);
  assert.equal(result.body.orderId, order.id);
});

test('missing and unknown identifiers do not return a receipt', async () => {
  configureLookup();
  assert.equal((await lookup()).status, 400);
  assert.equal((await lookup('id', 'unknown-order')).status, 404);
  assert.equal((await lookup('id', order.id.toLowerCase())).status, 404);
});
