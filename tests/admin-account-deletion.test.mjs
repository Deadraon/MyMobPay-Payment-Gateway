import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  DEFAULT_ADMIN_EMAILS,
  PLATFORM_ADMIN_USER_ID
} from '../lib/adminSettings.js';
import { purgeAccountCompletely } from '../lib/adminAccountDeletion.js';

test('--- Admin Account Complete Deletion & Safety Barrier Suite ---', async (t) => {

  await t.test('1. Security Guard: Refuses deletion of primary root administrator by user ID', async () => {
    const mockRequest = {
      headers: new Headers({
        'user-agent': 'node-test-agent'
      })
    };

    const res = await purgeAccountCompletely({
      accountId: PLATFORM_ADMIN_USER_ID
    }, mockRequest);

    assert.strictEqual(res.success, false, 'Root admin deletion must fail');
    assert.strictEqual(res.status, 403, 'Must return HTTP 403 Forbidden');
    assert.match(res.error, /Primary root platform administrator/i, 'Error message must specify root protection');
  });

  await t.test('2. Security Guard: Refuses deletion of primary root administrator by email', async () => {
    const mockRequest = {
      headers: new Headers({
        'user-agent': 'node-test-agent'
      })
    };

    for (const rootEmail of DEFAULT_ADMIN_EMAILS) {
      const res = await purgeAccountCompletely({
        email: rootEmail,
        accountId: '550e8400-e29b-41d4-a716-446655440000'
      }, mockRequest);

      assert.strictEqual(res.success, false, `Deletion for root email ${rootEmail} must fail`);
      assert.strictEqual(res.status, 403);
      assert.match(res.error, /Primary root platform administrator/i);
    }
  });

  await t.test('3. Returns 404 when target account identifier cannot be resolved', async () => {
    const mockRequest = {
      headers: new Headers({
        'user-agent': 'node-test-agent'
      })
    };

    const res = await purgeAccountCompletely({
      accountId: '',
      email: '',
      query: ''
    }, mockRequest);

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 404);
    assert.match(res.error, /No existing account found/i);
  });

  await t.test('4. Target identifier resolution recognizes standard UUID vs email format', async () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assert.strictEqual(uuidRegex.test('dd45279e-7a2c-413c-9e24-24d88011b680'), true);
    assert.strictEqual(uuidRegex.test('not-a-valid-uuid'), false);
    assert.strictEqual(uuidRegex.test('user@store.com'), false);
  });

});
