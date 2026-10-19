import test from 'node:test';
import assert from 'node:assert/strict';
import { supabaseAdmin } from '../lib/supabase.js';
import { 
  createAdminSessionToken, 
  verifyAdminSessionToken, 
  verifyAdminAuth,
  isAuthorizedEmail,
  isAuthorizedAdminUser,
  DEFAULT_ADMIN_EMAILS,
  PLATFORM_ADMIN_USER_ID
} from '../lib/adminSettings.js';

test('--- Super Admin Security & Passwordless Auth Verification Suite ---', async (t) => {

  await t.test('1. Cryptographic admin session token generation & verification', () => {
    const token = createAdminSessionToken();
    assert.ok(token.startsWith('adm_'), 'Admin token must start with prefix adm_');
    assert.strictEqual(verifyAdminSessionToken(token), true, 'Valid token must verify successfully');
  });

  await t.test('2. Token tamper-resistance: Modified data or signature must fail', () => {
    const token = createAdminSessionToken();
    const tampered = token.slice(0, -5) + 'AAAAA';
    assert.strictEqual(verifyAdminSessionToken(tampered), false, 'Tampered token signature must fail verification');

    assert.strictEqual(verifyAdminSessionToken(''), false);
    assert.strictEqual(verifyAdminSessionToken(null), false);
    assert.strictEqual(verifyAdminSessionToken('admin123'), false);
    assert.strictEqual(verifyAdminSessionToken('adm_invalid.invalid'), false);
  });

  await t.test('3. Completely rejects legacy passwords (x-admin-password header)', async () => {
    // Request attempting to authenticate with legacy passwords
    const mockRequestWithPassword = {
      headers: new Headers({
        'x-admin-password': 'admin',
        'content-type': 'application/json'
      })
    };

    const isAuthorized = await verifyAdminAuth(mockRequestWithPassword);
    assert.strictEqual(isAuthorized, false, 'Legacy password in headers must NEVER grant admin access');
  });

  await t.test('4. Completely rejects unauthenticated requests (missing tokens)', async () => {
    const mockEmptyRequest = {
      headers: new Headers({
        'content-type': 'application/json'
      })
    };

    const isAuthorized = await verifyAdminAuth(mockEmptyRequest);
    assert.strictEqual(isAuthorized, false, 'Empty authentication headers must fail');
  });

  await t.test('5. Grants access with valid cryptographically signed session token (x-admin-token)', async () => {
    const validToken = createAdminSessionToken();
    const mockRequestWithToken = {
      headers: new Headers({
        'x-admin-token': validToken,
        'content-type': 'application/json'
      })
    };

    const isAuthorized = await verifyAdminAuth(mockRequestWithToken);
    assert.strictEqual(isAuthorized, true, 'Valid signed session token in x-admin-token must be authorized');
  });

  await t.test('6. Grants access with valid Bearer adm_... token', async () => {
    const validToken = createAdminSessionToken();
    const mockRequestWithBearer = {
      headers: new Headers({
        'authorization': `Bearer ${validToken}`,
        'content-type': 'application/json'
      })
    };

    const isAuthorized = await verifyAdminAuth(mockRequestWithBearer);
    assert.strictEqual(isAuthorized, true, 'Valid signed session token in Bearer authorization must be authorized');
  });

  await t.test('7. Authorized administrator email validation', () => {
    for (const email of DEFAULT_ADMIN_EMAILS) {
      assert.strictEqual(isAuthorizedEmail(email, ''), true, `${email} must be recognized as authorized admin`);
      assert.strictEqual(isAuthorizedEmail(email.toUpperCase(), ''), true, 'Case-insensitive email check');
    }

    assert.strictEqual(isAuthorizedEmail('attacker@evil.com', ''), false, 'Random attacker email must be rejected');
    assert.strictEqual(isAuthorizedEmail('notadmin@gmail.com', DEFAULT_ADMIN_EMAILS.join(',')), false);
  });

  await t.test('8. Platform Admin User ID authorization', () => {
    const adminUser = { id: PLATFORM_ADMIN_USER_ID, email: 'custom@domain.com' };
    assert.strictEqual(isAuthorizedAdminUser(adminUser, ''), true, 'Platform admin user ID must be authorized');

    const attackerUser = { id: '00000000-0000-0000-0000-000000000000', email: 'attacker@evil.com' };
    assert.strictEqual(isAuthorizedAdminUser(attackerUser, ''), false, 'Non-admin user ID and email must be rejected');
  });

  await t.test('9. Configured admin policies require complete email matches', () => {
    const originalEnv = { ADMIN_EMAIL: process.env.ADMIN_EMAIL, ADMIN_EMAILS: process.env.ADMIN_EMAILS };
    try {
      for (const source of ['ADMIN_EMAIL', 'ADMIN_EMAILS', 'database']) {
        delete process.env.ADMIN_EMAIL;
        delete process.env.ADMIN_EMAILS;
        const policy = ' , Other@Example.org, OWNER@Example.com , ';
        const configuredEmails = source === 'database' ? policy : '';
        if (source !== 'database') process.env[source] = policy;

        for (const email of ['owner@example.com', ' OWNER@EXAMPLE.COM ', 'other@example.org']) {
          assert.strictEqual(isAuthorizedEmail(email, configuredEmails), true, `${source}: exact normalized address ${email}`);
        }

        for (const email of ['owner@example.com.attacker.test', 'owner@example.comattacker.test', 'owner+attacker@example.com', 'owner@example.co', 'attacker@example.com', '', null]) {
          assert.strictEqual(isAuthorizedEmail(email, configuredEmails), false, `${source}: reject ${email}`);
        }

        const user = { id: 'non-admin-user', email: 'owner@example.com.attacker.test' };
        assert.strictEqual(isAuthorizedAdminUser(user, configuredEmails), false, `${source}: reject suffix mailbox in login authorization`);

        const partialPolicy = 'owner@';
        if (source !== 'database') process.env[source] = partialPolicy;
        assert.strictEqual(isAuthorizedEmail('owner@example.com', source === 'database' ? partialPolicy : ''), false, `${source}: prefixes must not authorize full addresses`);
      }
    } finally {
      for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  await t.test('10. Verified Supabase bearer identities still require an exact admin email', async (t) => {
    const originalEnv = { ADMIN_EMAIL: process.env.ADMIN_EMAIL, ADMIN_EMAILS: process.env.ADMIN_EMAILS };
    t.after(() => {
      for (const [key, value] of Object.entries(originalEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_EMAILS;
    let email = 'owner@example.com.attacker.test';
    t.mock.method(supabaseAdmin.auth, 'getUser', async (token) => {
      assert.strictEqual(token, 'verified-user-token');
      return { data: { user: { id: 'non-admin-user', email } }, error: null };
    });
    const query = {
      select() { return this; },
      eq() { return this; },
      async maybeSingle() {
        return { data: { id: PLATFORM_ADMIN_USER_ID, setup_progress: { admin_settings: { admin_email: 'owner@example.com' } } } };
      }
    };
    t.mock.method(supabaseAdmin, 'from', () => query);
    const request = { headers: new Headers({ authorization: 'Bearer verified-user-token' }) };

    assert.strictEqual(await verifyAdminAuth(request), false, 'A verified suffix mailbox must not gain admin route access');
    email = 'owner@example.com';
    assert.strictEqual(await verifyAdminAuth(request), true, 'The exact configured identity must retain admin route access');
  });

});
