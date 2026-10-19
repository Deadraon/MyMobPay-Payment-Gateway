import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { NextResponse } from 'next/server.js';
import { transformSync } from 'next/dist/build/swc/index.js';

// Compile the real handler with Next's compiler; isolate external services only.
const routeSource = readFileSync(new URL('../app/api/auth/register/route.js', import.meta.url), 'utf8');
const { code } = transformSync(routeSource, {
  filename: 'route.js',
  jsc: { parser: { syntax: 'ecmascript' }, target: 'es2022' },
  module: { type: 'commonjs' },
});

const verifiedUser = {
  id: 'verified-user-id',
  email: 'merchant@example.test',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  user_metadata: { owner_name: 'Original Owner' },
};
const registration = {
  email: verifiedUser.email,
  password: 'new-password',
  businessName: 'Test Store',
  upiId: 'store@upi',
  phone: '9876543210',
};

function createHandler({
  user = verifiedUser,
  authError = null,
  verifiedPhone = true,
  existingMerchant = null,
  phoneConflict = null,
  upiConflict = null,
} = {}) {
  const calls = { tokens: [], queries: [], updates: [], profiles: [], emails: [], lists: 0 };
  const supabaseAdmin = {
    auth: {
      async getUser(token) {
        calls.tokens.push(token);
        return { data: { user }, error: authError };
      },
      admin: {
        async listUsers() {
          calls.lists += 1;
          return { data: { users: [verifiedUser] }, error: null };
        },
        async updateUserById(id, attributes) {
          calls.updates.push({ id, attributes: structuredClone(attributes) });
          return { error: null };
        },
      },
    },
    from(table) {
      const query = { table, filters: [] };
      calls.queries.push(query);
      const builder = {
        async maybeSingle() {
          const data = table === 'whatsapp_otps'
            ? (verifiedPhone ? { id: 'verified-otp', verified: true } : null)
            : query.filters.some(([method]) => method === 'or')
              ? phoneConflict
              : query.filters.some(([method]) => method === 'ilike')
                ? upiConflict
                : existingMerchant;
          return { data, error: null };
        },
        async upsert(profile) {
          calls.profiles.push(structuredClone(profile));
          return { error: null };
        },
      };
      for (const method of ['select', 'eq', 'neq', 'gte', 'order', 'limit', 'or', 'ilike']) {
        builder[method] = (...args) => {
          query.filters.push([method, ...args]);
          return builder;
        };
      }
      return builder;
    },
  };
  const dependencies = {
    'next/server': { NextResponse },
    '@/lib/supabase': { supabaseAdmin },
    '@/lib/mailer': { sendWelcomeEmail: async (email) => calls.emails.push(email) },
    '@/lib/merchantId': { formatMerchantId: (id) => id },
    '@/lib/rateLimit': {
      getClientIp: () => '127.0.0.1',
      checkRateLimit: () => ({ allowed: true }),
    },
  };
  const exports = {};
  runInNewContext(code, {
    exports,
    require(id) {
      assert.ok(Object.hasOwn(dependencies, id), `Unexpected dependency: ${id}`);
      return dependencies[id];
    },
    console,
  });
  return {
    calls,
    post(authorization, body = registration) {
      const headers = { 'Content-Type': 'application/json' };
      if (authorization !== undefined) headers.Authorization = authorization;
      return exports.POST(new Request('http://localhost/api/auth/register', {
        method: 'POST', headers, body: JSON.stringify(body),
      }));
    },
  };
}

function assertNoWrites(calls) {
  assert.equal(calls.updates.length, 0);
  assert.equal(calls.profiles.length, 0);
  assert.equal(calls.emails.length, 0);
}

test('historically verified email and phone do not authorize unauthenticated registration', async () => {
  const { post, calls } = createHandler();
  const response = await post();
  assert.equal(response.status, 401);
  assert.deepEqual(calls.tokens, []);
  assert.deepEqual(calls.queries, []);
  assert.equal(calls.lists, 0);
  assertNoWrites(calls);
});

test('missing or malformed bearer credentials cannot use an ambient server session', async () => {
  for (const authorization of ['', 'Basic token', 'Bearer', 'Bearer   ', 'Bearer one two']) {
    const { post, calls } = createHandler();
    assert.equal((await post(authorization)).status, 401, authorization);
    assert.deepEqual(calls.tokens, []);
    assertNoWrites(calls);
  }
});

test('invalid, expired, or unresolved sessions cannot change credentials or profiles', async () => {
  for (const options of [
    { user: null, authError: { message: 'Invalid JWT' } },
    { user: null, authError: { message: 'JWT expired' } },
    { user: null },
    { authError: { message: 'Authentication failed' } },
  ]) {
    const { post, calls } = createHandler(options);
    assert.equal((await post('Bearer rejected-token')).status, 401);
    assert.deepEqual(calls.tokens, ['rejected-token']);
    assert.deepEqual(calls.queries, []);
    assertNoWrites(calls);
  }
});

test('email confirmation must come from Auth, not editable user metadata', async () => {
  for (const user of [
    { ...verifiedUser, email_confirmed_at: null, user_metadata: { email_verified: true } },
    { ...verifiedUser, email: null },
  ]) {
    const { post, calls } = createHandler({ user });
    assert.equal((await post('Bearer valid-token')).status, 403);
    assert.deepEqual(calls.queries, []);
    assertNoWrites(calls);
  }
});

test('a verified session for another account cannot select the victim by email', async () => {
  const { post, calls } = createHandler({
    user: { ...verifiedUser, id: 'attacker-id', email: 'attacker@example.test' },
  });
  assert.equal((await post('Bearer attacker-token')).status, 403);
  assert.deepEqual(calls.tokens, ['attacker-token']);
  assert.deepEqual(calls.queries, []);
  assertNoWrites(calls);
});

test('verified owner completes registration using only the authenticated user ID', async () => {
  const { post, calls } = createHandler();
  const response = await post('Bearer owner-token', {
    ...registration, email: ' MERCHANT@EXAMPLE.TEST ', userId: 'other-account-id',
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).userId, verifiedUser.id);
  assert.deepEqual(calls.tokens, ['owner-token']);
  assert.equal(calls.lists, 0);
  assert.equal(calls.updates.length, 1);
  assert.equal(calls.updates[0].id, verifiedUser.id);
  assert.equal(calls.updates[0].attributes.password, registration.password);
  assert.equal(calls.updates[0].attributes.user_metadata.owner_name, 'Original Owner');
  assert.equal(calls.updates[0].attributes.user_metadata.upi_id, registration.upiId);
  assert.equal(calls.profiles.length, 1);
  assert.equal(calls.profiles[0].id, verifiedUser.id);
  assert.equal(calls.profiles[0].phone_number, registration.phone);
  assert.equal(calls.emails.length, 1);
  assert.equal(calls.emails[0].to, verifiedUser.email);
  for (const query of calls.queries.filter(({ table }) => table === 'merchants')) {
    if (query.filters.length) {
      assert.ok(query.filters.some(([method, field, value]) =>
        ['eq', 'neq'].includes(method) && field === 'id' && value === verifiedUser.id));
    }
  }
});

test('verified session still requires phone OTP verification', async () => {
  const { post, calls } = createHandler({ verifiedPhone: false });
  assert.equal((await post('Bearer owner-token')).status, 400);
  assertNoWrites(calls);
});

test('completed merchants and phone or UPI conflicts still block registration', async () => {
  for (const [options, status] of [
    [{ existingMerchant: { id: verifiedUser.id, business_name: 'Active Store', upi_id: 'active@upi' } }, 400],
    [{ phoneConflict: { id: 'other-account' } }, 409],
    [{ upiConflict: { id: 'other-account' } }, 409],
  ]) {
    const { post, calls } = createHandler(options);
    assert.equal((await post('Bearer owner-token')).status, status);
    assertNoWrites(calls);
  }
});
