import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Resolve Next.js aliases and replace outbound mail/rate limiting at the module
// boundary, leaving the handler and installed Supabase client unchanged.
const moduleUrl = (source) => `data:text/javascript,${encodeURIComponent(source)}`;
const mailerUrl = moduleUrl(`
  export const deliveries = [];
  export async function sendMonthlyStatementEmail(statement) {
    deliveries.push(statement);
    return { provider: 'test', id: 'statement-message' };
  }
`);
const rateLimitUrl = moduleUrl(`
  export function checkRateLimit() { return { allowed: true }; }
  export function getClientIp() { return '127.0.0.1'; }
`);
let source = await readFile(new URL('../app/api/merchant/statement/email/route.js', import.meta.url), 'utf8');
for (const [specifier, url] of [
  ['next/server', new URL('../node_modules/next/server.js', import.meta.url).href],
  ['@/lib/supabase', new URL('../lib/supabase.js', import.meta.url).href],
  ['@/lib/merchantId', new URL('../lib/merchantId.js', import.meta.url).href],
  ['@/lib/mailer', mailerUrl],
  ['@/lib/rateLimit', rateLimitUrl],
]) {
  source = source.replaceAll(`'${specifier}'`, JSON.stringify(url));
}
const { POST } = await import(moduleUrl(source));
const { deliveries } = await import(mailerUrl);

const merchantId = '11111111-1111-4111-8111-111111111111';
const otherMerchantId = '22222222-2222-4222-8222-222222222222';
const confirmedUser = {
  id: merchantId,
  email: 'owner@example.test',
  email_confirmed_at: '2026-01-01T00:00:00Z',
};
let user;
let requests;
let merchantExists;

beforeEach((t) => {
  user = { ...confirmedUser };
  requests = [];
  deliveries.length = 0;
  merchantExists = true;
  t.mock.method(globalThis, 'fetch', async (input, options) => {
    const url = new URL(input);
    requests.push(url);
    if (url.pathname === '/auth/v1/user') {
      assert.equal(new Headers(options.headers).get('authorization'), 'Bearer session-token');
      return user
        ? Response.json(user)
        : Response.json({ message: 'Invalid token' }, { status: 401 });
    }
    if (url.pathname === '/rest/v1/merchants') {
      return merchantExists
        ? Response.json({ id: merchantId, business_name: 'Owner Business', upi_id: 'owner@upi' })
        : Response.json({ message: 'No merchant found' }, { status: 406 });
    }
    if (url.pathname === '/rest/v1/orders') {
      const orders = [
        { id: 'paid-order', merchant_id: merchantId, amount: '125.50', status: 'paid' },
        { id: 'failed-order', merchant_id: merchantId, amount: '80', status: 'failed' },
        { id: 'foreign-order', merchant_id: otherMerchantId, project: merchantId, amount: '9000', status: 'paid' },
      ];
      const ownerFilter = url.searchParams.get('merchant_id');
      return Response.json(ownerFilter
        ? orders.filter(order => ownerFilter === `eq.${order.merchant_id}`)
        : orders);
    }
    assert.fail(`Unexpected outbound request: ${url.pathname}`);
  });
});

function request(body = {}, authorization = 'Bearer session-token') {
  return new Request('https://app.example.test/api/merchant/statement/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify({ month: 9, year: 2026, ...body }),
  });
}

test('unauthenticated callers cannot read records, send statements, or receive totals', async () => {
  for (const authorization of [null, 'Basic credentials', 'Bearer ']) {
    const response = await POST(request({ merchantId: otherMerchantId, toEmail: 'attacker@example.test' }, authorization));
    assert.equal(response.status, 401);
    assert.equal((await response.json()).totalVolume, undefined);
  }
  assert.equal(requests.length, 0);
  assert.equal(deliveries.length, 0);
});

test('invalid sessions are rejected before merchant and transaction retrieval', async () => {
  user = null;
  const response = await POST(request({ merchantId: otherMerchantId }));
  assert.equal(response.status, 401);
  assert.deepEqual(requests.map(url => url.pathname), ['/auth/v1/user']);
  assert.equal(deliveries.length, 0);
});

test('statements require a confirmed account email', async () => {
  for (const fields of [{ email_confirmed_at: null }, { email: '' }]) {
    user = { ...confirmedUser, ...fields };
    const response = await POST(request({ toEmail: 'attacker@example.test' }));
    assert.equal(response.status, 403);
    assert.equal((await response.json()).totalVolume, undefined);
  }
  assert.ok(requests.every(url => url.pathname === '/auth/v1/user'));
  assert.equal(deliveries.length, 0);
});

test('a signed-in user without a merchant account cannot obtain a statement', async () => {
  merchantExists = false;
  const response = await POST(request());
  assert.equal(response.status, 404);
  assert.ok(!requests.some(url => url.pathname === '/rest/v1/orders'));
  assert.equal(deliveries.length, 0);
});

test('caller-selected merchant and recipient cannot override the authenticated account', async () => {
  const response = await POST(request({ merchantId: otherMerchantId, toEmail: 'attacker@example.test' }));
  assert.equal(response.status, 200);
  const merchantQuery = requests.find(url => url.pathname === '/rest/v1/merchants');
  assert.equal(merchantQuery.searchParams.get('id'), `eq.${merchantId}`);
  const ordersQuery = requests.find(url => url.pathname === '/rest/v1/orders');
  assert.equal(ordersQuery.searchParams.get('merchant_id'), `eq.${merchantId}`);
  assert.equal(ordersQuery.searchParams.get('or'), null);
  assert.deepEqual(ordersQuery.searchParams.getAll('created_at'), [
    'gte.2026-09-01T00:00:00.000Z', 'lte.2026-09-30T23:59:59.999Z',
  ]);
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].to, confirmedUser.email);
  assert.equal(deliveries[0].totalVolume, 125.5);
  assert.equal(deliveries[0].transactionCount, 2);
  assert.equal(deliveries[0].successfulCount, 1);
  assert.equal(deliveries[0].failedCount, 1);
  const result = await response.json();
  assert.equal(result.recipientEmail, confirmedUser.email);
  assert.equal(result.totalVolume, 125.5);
  assert.equal(result.transactionCount, 2);
});

test('a matching project label does not authorize another merchant\'s order', async () => {
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(deliveries[0].recentOrders.map(order => order.id), ['paid-order', 'failed-order']);
  assert.equal((await response.json()).totalVolume, 125.5);
});

test('the dashboard request needs only the session and statement period', async () => {
  const response = await POST(request());
  assert.equal(response.status, 200);
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].to, confirmedUser.email);
});
