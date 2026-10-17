import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const merchantId = '11111111-1111-4111-8111-111111111111';
const otherMerchantId = '22222222-2222-4222-8222-222222222222';
const moduleUrl = source => `data:text/javascript,${encodeURIComponent(source)}`;

// Resolve Next aliases for Node's test runner and capture email without sending it.
const dependenciesUrl = moduleUrl(`
  export const supabaseAdmin = {};
  export const statements = [];
  export async function sendMonthlyStatementEmail(statement) {
    statements.push(statement);
    return { provider: 'test' };
  }
  export async function resolveMerchantIdToUuid(id) { return id; }
  export function formatMerchantId(id) { return id; }
  export function checkRateLimit() { return { allowed: true }; }
  export function getClientIp() { return '127.0.0.1'; }
`);
const dependencies = await import(dependenciesUrl);
const routeSource = await readFile(new URL('../app/api/merchant/statement/email/route.js', import.meta.url), 'utf8');
const { POST } = await import(moduleUrl(routeSource.replace(
  /from '(next\/server|@\/lib\/(?:supabase|mailer|merchantId|rateLimit))'/g,
  (_, specifier) => `from ${JSON.stringify(specifier === 'next/server' ? import.meta.resolve('next/server.js') : dependenciesUrl)}`
)));

const order = (id, owner, project, status, amount, createdAt = '2026-09-15T12:00:00.000Z') => ({
  id, merchant_id: owner, project, status, amount, created_at: createdAt,
});
const poisonedOrders = [
  order('foreign-paid', otherMerchantId, merchantId, 'verified', '9999'),
  order('foreign-failed', otherMerchantId, merchantId, 'failed', '100'),
  order('unowned', null, merchantId, 'completed', '500'),
];

for (const [name, ownOrders, expectedVolume] of [
  ['includes owned orders regardless of project and excludes forged associations', [
    order('own-verified', merchantId, 'Storefront', 'verified', '10.50'),
    order('own-paid', merchantId, otherMerchantId, 'paid', '20'),
    order('own-completed', merchantId, null, 'completed', '30'),
    order('own-failed', merchantId, '', 'failed', '40'),
    order('own-pending', merchantId, 'Storefront', 'pending', '50'),
  ], 60.5],
  ['returns an empty statement when only forged associations exist', [], 0],
]) {
  test(name, async () => {
    const requests = [];
    const rows = [...ownOrders, ...poisonedOrders,
      order('previous-month', merchantId, '', 'paid', '1000', '2026-08-31T23:59:59.999Z'),
      order('next-month', merchantId, '', 'paid', '1000', '2026-10-01T00:00:00.000Z'),
    ];
    const client = createClient('https://statement-test.invalid', 'synthetic-test-key', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: async (input) => {
        const url = new URL(input);
        requests.push(url);
        if (url.pathname.endsWith('/merchants')) {
          return Response.json({ id: merchantId, business_name: 'Test Merchant', upi_id: 'test@upi' });
        }
        assert.ok(url.pathname.endsWith('/orders'));
        const params = url.searchParams;
        // Emulate the equality and date filters emitted by the installed SDK.
        const matches = (row, filter) => {
          const [column, operator, ...value] = filter.split('.');
          assert.equal(operator, 'eq');
          return row[column] === value.join('.');
        };
        const selected = rows.filter(row =>
          (!params.has('merchant_id') || matches(row, `merchant_id.${params.get('merchant_id')}`)) &&
          (!params.has('or') || params.get('or').slice(1, -1).split(',').some(filter => matches(row, filter))) &&
          params.getAll('created_at').every(filter => filter.startsWith('gte.')
            ? row.created_at >= filter.slice(4) : row.created_at <= filter.slice(4))
        );
        return Response.json(selected);
      } },
    });
    dependencies.supabaseAdmin.from = client.from.bind(client);
    dependencies.statements.length = 0;

    const response = await POST(new Request('https://statement-test.invalid/api/merchant/statement/email', {
      method: 'POST',
      body: JSON.stringify({ merchantId, month: 9, year: 2026, toEmail: 'merchant@example.invalid' }),
    }));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.totalVolume, expectedVolume);
    assert.equal(result.transactionCount, ownOrders.length);
    assert.equal(dependencies.statements.length, 1);
    const [statement] = dependencies.statements;
    assert.equal(statement.totalVolume, expectedVolume);
    assert.equal(statement.transactionCount, ownOrders.length);
    assert.equal(statement.successfulCount, ownOrders.length ? 3 : 0);
    assert.equal(statement.failedCount, ownOrders.length ? 1 : 0);
    assert.deepEqual(statement.recentOrders.map(row => row.id), ownOrders.map(row => row.id));
    const query = requests.find(url => url.pathname.endsWith('/orders')).searchParams;
    assert.equal(query.get('merchant_id'), `eq.${merchantId}`);
    assert.equal(query.has('or'), false);
    assert.deepEqual(query.getAll('created_at'), ['gte.2026-09-01T00:00:00.000Z', 'lte.2026-09-30T23:59:59.999Z']);
  });
}
