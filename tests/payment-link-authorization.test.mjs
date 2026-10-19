import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { supabaseAdmin } from '../lib/supabase.js';
import { hashApiKey } from '../lib/merchantAuth.js';
import {
  syncOrderVerificationToPaymentLink,
  transitionLinkToPaid,
  processExpiredPaymentLinks
} from '../lib/paymentLinks.js';

// Background work must never fall back to a real database after a test ends.
supabaseAdmin.rest.fetch = async () => { throw new Error('Unexpected database request outside a fixture'); };

// Resolve Next's route imports without starting a server or contacting Supabase.
const require = createRequire(import.meta.url);
async function loadRoute(path, t) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const resolved = source.replace(/from (['"])([^'"]+)\1/g, (match, quote, specifier) => {
    if (specifier.startsWith('@/')) {
      return `from ${quote}${new URL(`../${specifier.slice(2)}.js`, import.meta.url).href}${quote}`;
    }
    if (specifier === 'next/server') {
      return `from ${quote}${pathToFileURL(require.resolve(specifier)).href}${quote}`;
    }
    return match;
  });
  // The in-memory rate limiter owns a cleanup interval; let tests exit normally.
  const setInterval = globalThis.setInterval;
  const timerMock = t.mock.method(globalThis, 'setInterval', (...args) => setInterval(...args).unref());
  try {
    return await import(`data:text/javascript;base64,${Buffer.from(resolved).toString('base64')}`);
  } finally {
    timerMock.mock.restore();
  }
}

function fixture(t, { link = {}, order = {}, includeOrder = true, beforeUpdate, failRequest } = {}) {
  const paymentLink = {
    id: 'link-victim', token: 'a'.repeat(48), merchant_id: 'merchant-victim',
    amount: 12550, status: 'active', order_id: 'order-linked',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    created_at: new Date().toISOString(), metadata: {}, ...link
  };
  const paymentOrder = {
    id: 'order-linked', merchant_id: 'merchant-victim', amount: '125.50',
    status: 'verified', mode: 'live', utr: '123456789012',
    external_ref: `pl_${paymentLink.token.slice(0, 12)}`, ...order
  };
  const tables = {
    payment_links: [paymentLink], orders: includeOrder ? [paymentOrder] : [],
    merchants: [{ id: 'merchant-victim', business_name: 'Victim', webhook_url: null }, {
      id: 'merchant-attacker', sandbox_mode: true,
      api_key_hash: hashApiKey('regression-key'), webhook_url: null
    }]
  };
  const requests = [];
  const writes = [];
  const matches = (row, column, expression) => {
    const separator = expression.indexOf('.');
    const operator = expression.slice(0, separator);
    const value = expression.slice(separator + 1);
    if (operator === 'eq') return String(row[column]) === value;
    if (operator === 'in') return value.slice(1, -1).split(',').includes(String(row[column]));
    if (operator === 'lt') return row[column] < value;
    if (operator === 'gt') return row[column] > value;
    if (operator === 'ilike') {
      const pattern = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('%', '.*').replaceAll('_', '.');
      return new RegExp(`^${pattern}$`, 'i').test(row[column] ?? '');
    }
    throw new Error(`Unexpected filter: ${expression}`);
  };

  // Keep the installed Supabase query builder; replace only its HTTP transport.
  t.mock.method(supabaseAdmin.rest, 'fetch', async (input, init) => {
    const url = new URL(input);
    const table = url.pathname.split('/').at(-1);
    assert.ok(Object.hasOwn(tables, table), `Unexpected table: ${table}`);
    const method = init.method;
    requests.push({ table, method, url });
    if (failRequest?.(table, method)) return Response.json({ message: 'Database failure' }, { status: 400 });
    if (method === 'PATCH' && beforeUpdate) beforeUpdate(tables, table);
    let rows = tables[table].filter(row => [...url.searchParams].every(([column, expression]) => {
      if (['select', 'limit', 'offset', 'order'].includes(column)) return true;
      if (column === 'or') {
        return expression.slice(1, -1).split(',').some(condition => {
          const separator = condition.indexOf('.');
          return matches(row, condition.slice(0, separator), condition.slice(separator + 1));
        });
      }
      return matches(row, column, expression);
    }));
    const total = rows.length;
    const offset = Number(url.searchParams.get('offset') || 0);
    rows = rows.slice(offset, offset + Number(url.searchParams.get('limit') || rows.length));
    if (method === 'PATCH') {
      const patch = JSON.parse(init.body);
      for (const row of rows) {
        writes.push({ table, patch });
        Object.assign(row, patch);
      }
    } else if (method === 'POST') {
      rows = [JSON.parse(init.body)].flat();
      tables[table].push(...rows);
    } else {
      assert.equal(method, 'GET');
    }
    const columns = url.searchParams.get('select');
    const data = rows.map(row => columns && columns !== '*'
      ? Object.fromEntries(columns.split(',').map(column => [column, row[column]]))
      : { ...row });
    const single = new Headers(init.headers).get('accept') === 'application/vnd.pgrst.object+json';
    if (single && data.length !== 1) {
      return Response.json({ code: 'PGRST116', message: 'Expected exactly one row' }, { status: 406 });
    }
    return Response.json(single ? data[0] : data, { headers: { 'content-range': `0-${data.length}/${total}` } });
  });
  return { paymentLink, paymentOrder, tables, requests, writes };
}

test('caller-controlled references cannot authorize payment-link synchronization', async t => {
  for (const externalRef of [`pl_${'a'.repeat(12)}`, 'a'.repeat(48), `pl_${'a'.repeat(8)}:metadata`, '________']) {
    await t.test(externalRef, async t => {
      const { paymentLink, writes } = fixture(t, { order: {
        id: 'order-attacker', merchant_id: 'merchant-attacker', external_ref: externalRef
      } });
      const original = structuredClone(paymentLink);
      assert.equal((await syncOrderVerificationToPaymentLink('order-attacker', 'forged-utr')).synced, false);
      assert.deepEqual(paymentLink, original);
      assert.equal(writes.length, 0);
    });
  }
});

test('caller-selected order IDs cannot select a link by token or filter syntax', async t => {
  for (const id of ['a'.repeat(48), 'pl_' + 'a'.repeat(48), `other,token.eq.${'a'.repeat(48)}`]) {
    await t.test(id, async t => {
      const { writes } = fixture(t, { order: { id } });
      assert.equal((await syncOrderVerificationToPaymentLink(id)).synced, false);
      assert.equal(writes.length, 0);
    });
  }
});

test('paid transition rejects orders that do not pay the linked merchant and amount in live mode', async t => {
  for (const [name, options] of [
    ['different order', { order: { id: 'order-other' } }],
    ['different merchant', { order: { merchant_id: 'merchant-attacker' } }],
    ['test payment', { order: { mode: 'test' } }],
    ['unknown mode', { order: { mode: null } }],
    ['underpayment', { order: { amount: '125.49' } }],
    ['overpayment', { order: { amount: '125.51' } }],
    ['invalid amount', { order: { amount: 'Infinity' }, link: { amount: Infinity } }],
    ['zero amount', { order: { amount: 0 }, link: { amount: 0 } }],
    ['pending payment', { order: { status: 'pending' } }],
    ['missing order', { includeOrder: false }],
    ['unbound link', { link: { order_id: null } }]
  ]) {
    await t.test(name, async t => {
      const { paymentLink, paymentOrder, writes } = fixture(t, options);
      const original = structuredClone(paymentLink);
      assert.equal((await transitionLinkToPaid(paymentLink.token, { orderId: paymentOrder.id })).success, false);
      assert.deepEqual(paymentLink, original);
      assert.equal(writes.length, 0);
    });
  }
});

test('verified live orders synchronize through the stored relationship and remain idempotent', async t => {
  for (const status of ['verified', 'paid', 'completed']) {
    await t.test(status, async t => {
      const { paymentLink, paymentOrder, writes } = fixture(t, {
        link: { status: 'expired', expires_at: new Date(Date.now() - 1000).toISOString() },
        order: { status, external_ref: null }
      });
      const result = await syncOrderVerificationToPaymentLink(paymentOrder.id, 'forged-utr');
      assert.equal(result.synced, true);
      assert.equal(result.latePaid, true);
      assert.equal(paymentLink.status, 'paid');
      assert.equal(paymentLink.order_id, paymentOrder.id);
      assert.equal(paymentLink.metadata.paid_utr, paymentOrder.utr);
      assert.equal(paymentLink.metadata.paid_via_order_id, paymentOrder.id);
      assert.equal(paymentLink.metadata.paid_after_expiry, true);
      const requestCount = writes.length;
      assert.equal((await syncOrderVerificationToPaymentLink(paymentOrder.id)).synced, true);
      assert.equal(writes.length, requestCount);
    });
  }
});

test('failed validation is not reported as a successful synchronization', async t => {
  fixture(t, { order: { mode: 'test' } });
  assert.equal((await syncOrderVerificationToPaymentLink('order-linked')).synced, false);
});

test('concurrent reassignment cannot be overwritten by a paid transition', async t => {
  const { paymentLink, writes } = fixture(t, { beforeUpdate(tables, table) {
    if (table === 'payment_links') tables.payment_links[0].order_id = 'order-new';
  } });
  assert.equal((await syncOrderVerificationToPaymentLink('order-linked')).synced, false);
  assert.equal(paymentLink.status, 'active');
  assert.equal(paymentLink.order_id, 'order-new');
  assert.equal(writes.length, 0);
});

test('database lookup and update failures cannot report payment or dispatch link webhooks', async t => {
  for (const [table, method] of [['payment_links', 'GET'], ['orders', 'GET'], ['payment_links', 'PATCH']]) {
    await t.test(`${method} ${table}`, async t => {
      const { paymentLink, writes, requests } = fixture(t, {
        failRequest: (requestTable, requestMethod) => requestTable === table && requestMethod === method
      });
      assert.equal((await syncOrderVerificationToPaymentLink('order-linked')).synced, false);
      assert.equal(paymentLink.status, 'active');
      assert.equal(writes.length, 0);
      assert.equal(requests.some(request => request.table === 'merchants'), false);
    });
  }
});

test('expiry recovery counts only payments that pass transition validation', async t => {
  for (const mode of ['test', 'live']) {
    await t.test(mode, async t => {
      const { paymentLink } = fixture(t, {
        link: { status: 'processing', processing_started_at: new Date(Date.now() - 660000).toISOString() },
        order: { mode }
      });
      const result = await processExpiredPaymentLinks();
      assert.equal(result.recoveredCount, mode === 'live' ? 1 : 0);
      assert.equal(result.errors.length, mode === 'live' ? 0 : 1);
      assert.equal(paymentLink.status, mode === 'live' ? 'paid' : 'processing');
    });
  }
});

test('public resolution ignores verified orders that only reference the link token', async t => {
  const { paymentLink } = fixture(t, {
    link: { order_id: null }, order: { id: 'unrelated-order' }
  });
  const { GET } = await loadRoute('../app/api/pay/[token]/route.js', t);
  const response = await GET(new Request(`http://localhost/api/pay/${paymentLink.token}`), {
    params: { token: paymentLink.token }
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'active');
  assert.equal(paymentLink.status, 'active');
});

test('public resolution and checkout do not report invalid linked payments as paid', async t => {
  const route = await loadRoute('../app/api/pay/[token]/route.js', t);
  for (const order of [{ mode: 'test' }, { merchant_id: 'merchant-attacker' }, { amount: 1 }]) {
    await t.test(JSON.stringify(order), async t => {
      const { paymentLink, writes } = fixture(t, { order });
      const request = new Request(`http://localhost/api/pay/${paymentLink.token}`);
      const context = { params: { token: paymentLink.token } };
      const view = await route.GET(request, context);
      assert.equal((await view.json()).status, 'active');
      const start = await route.POST(request, context);
      assert.equal(start.status, 409);
      assert.notEqual((await start.json()).status, 'paid');
      assert.equal(paymentLink.status, 'active');
      assert.equal(writes.length, 0);
    });
  }
});

test('merchant listing reconciles only valid server-bound orders', async t => {
  const { GET } = await loadRoute('../app/api/payment-links/route.js', t);
  for (const [name, options, expected] of [
    ['reference-only payment', { link: { order_id: null } }, 'active'],
    ['test payment', { order: { mode: 'test' } }, 'active'],
    ['underpayment', { order: { amount: 1 } }, 'active'],
    ['verified payment', {}, 'paid'],
    ['failed update', { failRequest: (table, method) => method === 'PATCH' }, 'active']
  ]) {
    await t.test(name, async t => {
      const { paymentLink } = fixture(t, {
        ...options,
        link: { merchant_id: 'merchant-attacker', ...options.link },
        order: { merchant_id: 'merchant-attacker', ...options.order }
      });
      const response = await GET(new Request('http://localhost/api/payment-links', {
        headers: { 'x-api-key': 'regression-key' }
      }));
      assert.equal(response.status, 200);
      assert.equal((await response.json()).data[0].status, expected);
      assert.equal(paymentLink.status, expected);
    });
  }
});

test('creating and verifying an attacker test order cannot pay another merchant link', async t => {
  const { paymentLink, tables } = fixture(t, { includeOrder: false });
  const original = structuredClone(paymentLink);
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_KEY']) {
    const originalValue = process.env[name];
    process.env[name] = name.endsWith('URL') ? 'https://example.invalid' : 'synthetic-test-key';
    t.after(() => {
      if (originalValue === undefined) delete process.env[name];
      else process.env[name] = originalValue;
    });
  }
  const create = await loadRoute('../app/api/orders/route.js', t);
  const created = await create.POST(new Request('http://localhost/api/orders', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: 'test_regression-key', amount: 1,
      external_ref: `pl_${paymentLink.token.slice(0, 12)}` })
  }));
  assert.equal(created.status, 201);
  const { orderId } = await created.json();
  const verify = await loadRoute('../app/api/orders/check-status/route.js', t);
  const verified = await verify.POST(new Request('http://localhost/api/orders/check-status', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order_id: orderId })
  }));
  assert.equal(verified.status, 200);
  assert.equal((await verified.json()).verified, true);
  assert.equal(tables.orders.find(order => order.id === orderId).status, 'verified');
  assert.deepEqual(paymentLink, original);
});

test('checkout establishes an order relationship that legitimate verification can reconcile', async t => {
  const { paymentLink, tables } = fixture(t, { link: { order_id: null, link_type: 'checkout' }, includeOrder: false });
  const { POST, GET } = await loadRoute('../app/api/pay/[token]/route.js', t);
  const request = new Request(`http://localhost/api/pay/${paymentLink.token}`, { method: 'POST' });
  const context = { params: { token: paymentLink.token } };
  const started = await POST(request, context);
  assert.equal(started.status, 200);
  const { order_id } = await started.json();
  assert.equal(paymentLink.order_id, order_id);
  assert.equal(paymentLink.status, 'processing');
  const order = tables.orders.find(order => order.id === order_id);
  assert.equal(order.merchant_id, paymentLink.merchant_id);
  assert.equal(order.mode, 'live');
  Object.assign(order, { status: 'verified', utr: '123456789012' });
  const resolved = await GET(request, context);
  assert.equal((await resolved.json()).status, 'paid');
  assert.equal(paymentLink.status, 'paid');
  assert.equal(paymentLink.order_id, order_id);
});
