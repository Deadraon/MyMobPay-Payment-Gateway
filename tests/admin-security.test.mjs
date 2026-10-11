import test from 'node:test';
import assert from 'node:assert/strict';
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

});
