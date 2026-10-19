import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

// Load the real handler with Next's aliases resolved and external effects isolated.
// Keep the real parser, merchant authentication and Supabase query builder.
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const dependenciesUrl = moduleUrl(`
  export let supabaseAdmin;
  export let supabase;
  export const effects = [];
  export function configure(client) {
    supabaseAdmin = supabase = client;
    effects.length = 0;
  }
  export async function checkAndProcessSubscription(...args) { effects.push(['subscription', ...args]); }
  export async function syncOrderVerificationToPaymentLink(...args) { effects.push(['payment-link', ...args]); }
  export async function triggerMerchantWebhook(...args) { effects.push(['webhook', ...args]); }
`);
const dependencies = await import(dependenciesUrl);
const configUrl = new URL('../lib/config.js', import.meta.url).href;
const authSource = await readFile(new URL('../lib/merchantAuth.js', import.meta.url), 'utf8');
const authUrl = moduleUrl(authSource
  .replace("'./supabase.js'", JSON.stringify(dependenciesUrl))
  .replace("'./config.js'", JSON.stringify(configUrl)));
const { hashApiKey } = await import(authUrl);
const imports = {
  'next/server': new URL('../node_modules/next/server.js', import.meta.url).href,
  '@/lib/parseSms': new URL('../lib/parseSms.js', import.meta.url).href,
  '@/lib/config': configUrl,
  '@/lib/merchantAuth': authUrl,
  '@/lib/supabase': dependenciesUrl,
  '@/lib/adminSettings': dependenciesUrl,
  '@/lib/webhook': dependenciesUrl,
  '@/lib/paymentLinks': dependenciesUrl,
};
const routeSource = await readFile(new URL('../app/api/webhook/notification/route.js', import.meta.url), 'utf8');
const { POST } = await import(moduleUrl(routeSource.replace(/from '([^']+)'/g, (match, specifier) => {
  assert.ok(imports[specifier], `Unexpected dependency: ${specifier}`);
  return `from ${JSON.stringify(imports[specifier])}`;
})));

const apiKey = 'notification-test-merchant-key';
const utr = '429102948192';

function order(overrides = {}) {
  return {
    id: 'order_notification_test', merchant_id: 'merchant-a', amount: '500.00',
    status: 'pending', customer_utr: utr, utr: null, mode: 'live',
    created_at: '2026-10-17T12:00:00.000Z', ...overrides,
  };
}

function fixture(orders, { beforeUpdate } = {}) {
  const tables = {
    orders: structuredClone(orders),
    merchants: [{ id: 'merchant-a', api_key_hash: hashApiKey(apiKey), api_key: apiKey }],
  };
  const updates = [];
  const client = createClient('https://notification-test.supabase.invalid', 'synthetic-test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, options) => {
        const url = new URL(input);
        const table = url.pathname.split('/').pop();
        assert.ok(tables[table], `Unexpected table: ${table}`);
        const isUpdate = options.method === 'PATCH';
        if (isUpdate) {
          updates.push(JSON.parse(options.body));
          beforeUpdate?.(tables.orders);
        }
        let rows = tables[table].filter((row) => [...url.searchParams].every(([field, filter]) => {
          if (['select', 'limit', 'order'].includes(field)) return true;
          const [operator, ...parts] = filter.split('.');
          const value = parts.join('.');
          if (operator === 'eq') return String(row[field]) === value;
          if (operator === 'gte') return Number(row[field]) >= Number(value);
          if (operator === 'lte') return Number(row[field]) <= Number(value);
          assert.fail(`Unexpected filter: ${filter}`);
        }));
        if (url.searchParams.has('order')) {
          rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
        }
        rows = rows.slice(0, Number(url.searchParams.get('limit') || rows.length));
        if (isUpdate) rows.forEach((row) => Object.assign(row, JSON.parse(options.body)));
        const single = new Headers(options.headers).get('accept')?.includes('application/vnd.pgrst.object+json');
        const missingSingle = single && rows.length !== 1;
        const data = missingSingle ? { code: 'PGRST116', message: 'Expected one row' } : single ? rows[0] : rows;
        return new Response(JSON.stringify(data), {
          status: missingSingle ? 406 : 200, headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  });
  dependencies.configure(client);
  return { orders: tables.orders, updates, effects: dependencies.effects };
}

async function notify(amount, { body = {}, headers = {} } = {}) {
  const request = new Request('https://payments.test/api/webhook/notification', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      secret: process.env.WEBHOOK_SECRET,
      api_key: apiKey,
      message: `INR ${amount} has been credited. UTR ${utr}`,
      ...body,
    }),
  });
  const response = await POST(request);
  return { status: response.status, body: await response.json() };
}

test('notification payment authorization', async (t) => {
  const previousSecret = process.env.WEBHOOK_SECRET;
  process.env.WEBHOOK_SECRET = 'synthetic-notification-secret';
  t.after(() => {
    if (previousSecret === undefined) delete process.env.WEBHOOK_SECRET;
    else process.env.WEBHOOK_SECRET = previousSecret;
  });

  for (const match of ['customer UTR', 'text reference', 'subscription amount fallback']) {
    await t.test(`rejects underpayment via ${match}`, async () => {
      const target = order(match === 'subscription amount fallback'
        ? { amount: '499.99', customer_utr: null } : match === 'text reference' ? { customer_utr: null } : {});
      const state = fixture([target]);
      const result = await notify(match === 'subscription amount fallback' ? '499.00' : '1.00', {
        body: match === 'text reference' ? { text: target.id } : {},
      });
      assert.equal(result.body.code, 'PAYMENT_MISMATCH');
      assert.equal(state.orders[0].status, 'pending');
      assert.deepEqual(state.updates, []);
      assert.deepEqual(state.effects, []);
    });
  }

  for (const match of ['customer UTR', 'text reference', 'amount fallback']) {
    await t.test(`isolates the receiving merchant for ${match}`, async () => {
      const foreignOrder = order({ merchant_id: 'merchant-b', customer_utr: match === 'customer UTR' ? utr : null });
      const state = fixture([foreignOrder]);
      const result = await notify('500.00', { body: match === 'text reference' ? { text: foreignOrder.id } : {} });
      assert.equal(result.body.code, 'ORDER_NOT_FOUND');
      assert.equal(state.orders[0].status, 'pending');
      assert.deepEqual(state.updates, []);
      assert.deepEqual(state.effects, []);
    });
  }

  for (const amount of ['500.00', '500.01']) {
    await t.test(`verifies a covering credit of ${amount} for the receiving merchant`, async () => {
      const state = fixture([order()]);
      const result = await notify(amount);
      assert.equal(result.status, 200);
      assert.equal(result.body.code, 'NOTIFICATION_VERIFIED');
      assert.equal(state.orders[0].status, 'verified');
      assert.equal(state.orders[0].utr, utr);
      assert.equal(state.effects.length, 3);
    });
  }

  for (const match of ['text reference', 'amount fallback']) {
    await t.test(`verifies a valid ${match} for the receiving merchant`, async () => {
      const target = order({ amount: '499.99', customer_utr: null });
      const state = fixture([target]);
      const result = await notify('499.99', { body: match === 'text reference' ? { text: target.id } : {} });
      assert.equal(result.body.code, 'NOTIFICATION_VERIFIED');
      assert.equal(state.orders[0].status, 'verified');
      assert.equal(state.effects.length, 3);
    });
  }

  await t.test('selects the receiving merchant when another merchant has the same UTR and amount', async () => {
    const state = fixture([
      order({ id: 'order_foreign', merchant_id: 'merchant-b' }),
      order({ id: 'order_receiver' }),
    ]);
    const result = await notify('500.00');
    assert.equal(result.body.order.id, 'order_receiver');
    assert.equal(state.orders[0].status, 'pending');
    assert.equal(state.orders[1].status, 'verified');
  });

  for (const key of [null, 'invalid-merchant-key']) {
    await t.test(`rejects ${key === null ? 'a missing' : 'an invalid'} receiving merchant key`, async () => {
      const state = fixture([order()]);
      const result = await notify('500.00', { body: { api_key: key } });
      assert.equal(result.status, 401);
      assert.deepEqual(state.updates, []);
      assert.deepEqual(state.effects, []);
    });
  }

  for (const header of ['x-api-key', 'X-MyMobPay-API-Key']) {
    await t.test(`accepts the receiving merchant key in ${header}`, async () => {
      fixture([order()]);
      const result = await notify('500.00', { body: { api_key: null }, headers: { [header]: apiKey } });
      assert.equal(result.body.code, 'NOTIFICATION_VERIFIED');
    });
  }

  await t.test('still requires the notification secret', async () => {
    const state = fixture([order()]);
    const result = await notify('500.00', { body: { secret: 'invalid-secret' } });
    assert.equal(result.status, 401);
    assert.deepEqual(state.updates, []);
    assert.deepEqual(state.effects, []);
  });

  for (const amount of [null, 'invalid', 'Infinity', '0', '-1']) {
    await t.test(`rejects an invalid required amount: ${amount}`, async () => {
      const state = fixture([order({ amount })]);
      const result = await notify('500.00');
      assert.equal(result.body.code, 'PAYMENT_MISMATCH');
      assert.deepEqual(state.updates, []);
      assert.deepEqual(state.effects, []);
    });
  }

  await t.test('still rejects a previously consumed UTR', async () => {
    const state = fixture([order(), order({ id: 'order_paid', status: 'verified', utr })]);
    const result = await notify('500.00');
    assert.equal(result.body.code, 'DUPLICATE_UTR');
    assert.deepEqual(state.updates, []);
    assert.deepEqual(state.effects, []);
  });

  for (const change of [{ amount: '1000.00' }, { merchant_id: 'merchant-b' }, { status: 'cancelled' }]) {
    await t.test(`does not verify an order changed before the update: ${JSON.stringify(change)}`, async (t) => {
      t.mock.method(console, 'error', () => {});
      const state = fixture([order()], { beforeUpdate: (orders) => Object.assign(orders[0], change) });
      const result = await notify('500.00');
      assert.equal(result.status, 500);
      assert.notEqual(state.orders[0].status, 'verified');
      assert.deepEqual(state.effects, []);
    });
  }
});
