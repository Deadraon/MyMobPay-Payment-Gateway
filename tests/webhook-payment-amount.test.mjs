import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { parseBankSms, parseTransactionText } from '../lib/parseSms.js';

const require = createRequire(import.meta.url);
const asModuleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const mockUrl = asModuleUrl(`
  export { parseAmountToPaise } from '${new URL('../lib/paymentLinks.js', import.meta.url).href}';
  export const state = {};
  export const supabaseAdmin = { from: (table) => state.database.from(table) };
  export const CONFIG = { webhookSecret: 'local-secret', platformApiKey: 'local-platform-key' };
  export const findMerchantByApiKey = async (key) => key === 'local-key' ? state.merchant : null;
  export const checkRateLimit = () => ({ allowed: true });
  export const getClientIp = () => '127.0.0.1';
  export const checkAndProcessSubscription = async () => { state.effects.push('subscription'); };
  export const triggerMerchantWebhook = async () => { state.effects.push('webhook'); };
  export const syncOrderVerificationToPaymentLink = async () => { state.effects.push('link'); };
  export const resolveMerchantIdToUuid = async () => null;
  export const generateOrderId = () => 'order_generated';
`);
const { state } = await import(mockUrl);
const previousSecret = process.env.WEBHOOK_SECRET;
test.before(() => { process.env.WEBHOOK_SECRET = 'local-secret'; });
test.after(() => {
  if (previousSecret === undefined) delete process.env.WEBHOOK_SECRET;
  else process.env.WEBHOOK_SECRET = previousSecret;
});

// Resolve Next's aliases for Node while replacing only external boundaries.
// The actual handlers, alert parsers, amount conversion and NextResponse run unchanged.
async function loadRoute(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const resolved = source.replace(/from '([^']+)'/g, (statement, specifier) => {
    if (specifier === 'next/server') {
      return `from '${pathToFileURL(require.resolve('next/server.js')).href}'`;
    }
    if (specifier === '@/lib/parseSms') {
      return `from '${new URL(`../${specifier.slice(2)}.js`, import.meta.url).href}'`;
    }
    return specifier.startsWith('@/') ? `from '${mockUrl}'` : statement;
  });
  return import(asModuleUrl(resolved));
}

const submitUtr = await loadRoute('../app/api/payments/utr/route.js');
const handlers = {};
for (const channel of ['email', 'sms', 'notification']) {
  handlers[channel] = await loadRoute(`../app/api/webhook/${channel}/route.js`);
}

function database(tables) {
  return {
    from(table) {
      const filters = [];
      let update;
      let insertion;
      let count;
      let descending = false;
      let single = false;
      const query = {
        select: () => query,
        eq: (key, value) => {
          filters.push((row) => key === 'amount'
            ? Number(row[key]) === Number(value)
            : row[key] === value);
          return query;
        },
        neq: (key, value) => { filters.push((row) => row[key] !== value); return query; },
        gte: (key, value) => { filters.push((row) => Number(row[key]) >= value); return query; },
        lte: (key, value) => { filters.push((row) => Number(row[key]) <= value); return query; },
        in: (key, values) => { filters.push((row) => values.includes(row[key])); return query; },
        ilike: (key, pattern) => {
          filters.push((row) => String(row[key] || '').includes(pattern.replaceAll('%', '')));
          return query;
        },
        order: () => { descending = true; return query; },
        limit: (value) => { count = value; return query; },
        update: (values) => { update = values; return query; },
        insert: (values) => { insertion = values; return query; },
        single: () => { single = true; return query; },
        maybeSingle: () => { single = true; return query; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            const rows = tables[table] ||= [];
            let selected = rows.filter((row) => filters.every((filter) => filter(row)));
            if (descending) selected.reverse();
            if (count !== undefined) selected = selected.slice(0, count);
            if (insertion) {
              selected = [insertion];
              rows.push(insertion);
            }
            if (update) selected.forEach((row) => Object.assign(row, update));
            return { data: single ? selected[0] || null : selected, error: null };
          }).then(resolve, reject);
        }
      };
      return query;
    }
  };
}

const utr = '123456789012';
const request = (body) => new Request('http://localhost/api/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

function setup(amount = '1000.00', platform = false) {
  const order = { id: 'order_target', merchant_id: 'merchant_test', amount, status: 'pending', mode: 'live' };
  const tables = { orders: [order], email_logs: [], sms_logs: [], payment_links: [] };
  state.merchant = {
    id: platform ? '677d9312-a53f-4b96-815f-53e0eee1b292' : order.merchant_id,
    subscription_status: 'active'
  };
  state.database = database(tables);
  state.effects = [];
  return { order, tables };
}

async function alert(channel, amount, suffix = '', authorized = true) {
  const message = `Rs. ${amount} credited to A/c XX1234 via UPI Ref ${utr} ${suffix}`;
  const body = channel === 'email'
    ? { api_key: authorized ? 'local-key' : 'invalid', body: message }
    : { secret: authorized ? 'local-secret' : 'invalid', message, ...(channel === 'sms' ? { api_key: 'local-key' } : {}) };
  if (!authorized) delete body.api_key;
  return handlers[channel].POST(request(body));
}

for (const channel of Object.keys(handlers)) {
  test(`${channel}: submitted UTR cannot settle an underpaid order`, async () => {
    const { order } = setup();
    const submitted = await submitUtr.POST(request({ orderId: order.id, utr }));
    assert.equal((await submitted.json()).verified, false);
    assert.equal(order.customer_utr, utr);
    assert.equal(order.status, 'pending');
    const response = await alert(channel, '1.00');
    assert.equal(response.status, 200);
    assert.equal((await response.json()).code, 'PAYMENT_AMOUNT_MISMATCH');
    assert.equal(order.status, 'pending');
    assert.equal(order.utr, undefined);
    assert.equal(order.verified_at, undefined);
    assert.deepEqual(state.effects, []);
  });

  test(`${channel}: order ID cannot bypass the amount check`, async () => {
    const { order } = setup();
    const response = await alert(channel, '1.00', order.id);
    assert.equal((await response.json()).code, 'PAYMENT_AMOUNT_MISMATCH');
    assert.equal(order.status, 'pending');
    assert.deepEqual(state.effects, []);
  });

  test(`${channel}: exact UTR and decimal amount still verify`, async () => {
    const { order } = setup('1000.01');
    order.customer_utr = utr;
    const response = await alert(channel, '1,000.01');
    assert.equal((await response.json()).success, true);
    assert.equal(order.status, 'verified');
    assert.equal(order.utr, utr);
    assert.ok(order.verified_at);
    assert.ok(state.effects.includes('subscription'));
    assert.ok(state.effects.includes('webhook'));
  });

  for (const paid of ['499.00', '499.02']) {
    test(`${channel}: ${paid} does not settle a 499.01 order by UTR`, async () => {
      const { order } = setup('499.01', true);
      order.customer_utr = utr;
      const response = await alert(channel, paid);
      assert.equal((await response.json()).code, 'PAYMENT_AMOUNT_MISMATCH');
      assert.equal(order.status, 'pending');
      assert.deepEqual(state.effects, []);
    });
  }

  test(`${channel}: amount fallback selects the exact paise offset`, async () => {
    const { order, tables } = setup('499.01', true);
    const other = { ...order, id: 'order_other', amount: '499.02' };
    tables.orders.push(other);
    const response = await alert(channel, '499.01');
    assert.equal((await response.json()).success, true);
    assert.equal(order.status, 'verified');
    assert.equal(other.status, 'pending');
  });

  test(`${channel}: duplicate UTR remains blocked with an exact amount`, async () => {
    const { order, tables } = setup();
    order.customer_utr = utr;
    tables.orders.push({ id: 'order_paid', status: 'verified', utr });
    const response = await alert(channel, '1000.00');
    assert.equal((await response.json()).code, 'DUPLICATE_UTR');
    assert.equal(order.status, 'pending');
    assert.deepEqual(state.effects, []);
  });

  test(`${channel}: unauthenticated alerts remain blocked`, async () => {
    const { order } = setup();
    order.customer_utr = utr;
    const response = await alert(channel, '1000.00', '', false);
    assert.ok([400, 401].includes(response.status));
    assert.equal(order.status, 'pending');
    assert.deepEqual(state.effects, []);
  });
}

for (const channel of ['email', 'sms']) {
  test(`${channel}: payment link cannot bypass its linked order amount`, async () => {
    const { order, tables } = setup();
    tables.payment_links.push({ id: 'link_test', merchant_id: order.merchant_id, amount: 100, status: 'processing', order_id: order.id });
    const response = await alert(channel, '1.00');
    assert.equal((await response.json()).code, 'PAYMENT_AMOUNT_MISMATCH');
    assert.equal(order.status, 'pending');
    assert.deepEqual(state.effects, []);
  });
}

test('alert parsers extract the credited amount and reference used in the regression', () => {
  const text = `Rs. 1.00 credited to A/c XX1234 via UPI Ref ${utr}`;
  assert.deepEqual(parseBankSms(text), { amount: 1, utr });
  assert.deepEqual(parseTransactionText(text), { amount: 1, utr });
});
