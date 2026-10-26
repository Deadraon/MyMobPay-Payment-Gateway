import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(__dirname, '../.env.local');

if (existsSync(envLocalPath)) {
  const content = readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const { getAdminSettings, DEFAULT_ADMIN_EMAILS } = await import('../lib/adminSettings.js');
const { sendAdminNewSignupNotification } = await import('../lib/mailer.js');

test('--- Admin Signup Notification Deduplication & Single Recipient Suite ---', async (t) => {

  await t.test('1. Resolves single primary admin notification email instead of blasting all login accounts', async () => {
    const settings = await getAdminSettings();
    // Verify admin_notification_email is a single email (the primary)
    assert.ok(settings.admin_notification_email, 'admin_notification_email must be present');
    assert.strictEqual(
      settings.admin_notification_email.includes(','),
      false,
      'admin_notification_email should be a single primary recipient, not a list'
    );
    assert.strictEqual(
      settings.admin_notification_email.toLowerCase(),
      'chauhankunal695@gmail.com',
      'Primary notification email must default to chauhankunal695@gmail.com'
    );
  });

  await t.test('2. Multi-login accounts are preserved for authentication whitelist', async () => {
    const settings = await getAdminSettings();
    const authorizedLogins = settings.admin_email.split(',').map(e => e.trim().toLowerCase());
    assert.ok(authorizedLogins.includes('chauhankunal695@gmail.com'));
    assert.ok(authorizedLogins.includes('deadraon@gmail.com'));
  });

  await t.test('3. Deduplication suppresses subsequent notification calls for the same user within cooldown', async () => {
    const testUserId = `test_dedup_user_${Date.now()}`;
    const testEmail = `dedup_${Date.now()}@test.com`;

    // First call: gets processed with dryRun (no outbound network request)
    const res1 = await sendAdminNewSignupNotification({
      userEmail: testEmail,
      userId: testUserId,
      userName: 'Dedup Tester',
      businessName: 'Dedup Store',
      upiId: 'tester@upi',
      phone: '+91 9999999999',
      provider: 'Test',
      dryRun: true,
    });

    assert.strictEqual(res1.success, true);
    // Recipients list in res1 should only have 1 recipient (the primary email)
    assert.strictEqual(res1.recipients?.length, 1);
    assert.strictEqual(res1.recipients[0], 'chauhankunal695@gmail.com');

    // Second call with same userId and email: must be deduplicated
    const res2 = await sendAdminNewSignupNotification({
      userEmail: testEmail,
      userId: testUserId,
      userName: 'Dedup Tester',
      businessName: 'Dedup Store',
      upiId: 'tester@upi',
      phone: '+91 9999999999',
      provider: 'Test',
      dryRun: true,
    });

    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.deduplicated, true, 'Immediate duplicate call must have deduplicated flag set to true');
  });

});
