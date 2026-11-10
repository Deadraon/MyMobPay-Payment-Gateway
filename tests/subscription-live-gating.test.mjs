import test from 'node:test';
import assert from 'node:assert/strict';

test('--- Subscription Live Mode Gating & Expiry Security Suite ---', async (t) => {
  const PLATFORM_ADMIN_ID = '677d9312-a53f-4b96-815f-53e0eee1b292';

  function evaluateLiveStatus(merchant) {
    const isSubExpired = Boolean(
      merchant?.subscription_expires_at &&
      new Date(merchant.subscription_expires_at).getTime() < Date.now()
    );

    const isSubActive = merchant?.subscription_status === 'active' && !isSubExpired;
    const isLiveUnlocked = Boolean(isSubActive);
    const effectiveSandboxMode = !isLiveUnlocked ? true : (merchant?.sandbox_mode !== false);

    return {
      isSubExpired,
      isSubActive,
      isLiveUnlocked,
      effectiveSandboxMode
    };
  }

  function simulateCreatePaymentLinkAuth(merchant, candidateKey) {
    const isTestKey = candidateKey.startsWith('test_');
    const isLiveKey = candidateKey.startsWith('live_');
    const isLiveMode = isLiveKey || (merchant.sandbox_mode === false && !isTestKey);

    if (isLiveMode) {
      let isSubActive = merchant.subscription_status === 'active';
      if (isSubActive && merchant.subscription_expires_at) {
        if (new Date(merchant.subscription_expires_at).getTime() <= Date.now()) {
          isSubActive = false;
        }
      }

      if (!isSubActive) {
        return {
          allowed: false,
          status: 403,
          code: 'SUBSCRIPTION_EXPIRED',
          error: 'Your subscription has expired or is inactive. Live payment link generation is locked.'
        };
      }
    }

    return { allowed: true, isLiveMode };
  }

  await t.test('1. Expired subscription locks Live Mode and forces effectiveSandboxMode = true', () => {
    const expiredMerchant = {
      id: 'usr_test_merchant_1',
      subscription_status: 'expired',
      subscription_expires_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      sandbox_mode: false // was previously in live mode
    };

    const status = evaluateLiveStatus(expiredMerchant);
    assert.equal(status.isSubExpired, true);
    assert.equal(status.isSubActive, false);
    assert.equal(status.isLiveUnlocked, false);
    assert.equal(status.effectiveSandboxMode, true, 'Must force sandbox mode when subscription is expired');
  });

  await t.test('2. Expired subscription returns 403 SUBSCRIPTION_EXPIRED for live payment links', () => {
    const expiredMerchant = {
      id: 'usr_test_merchant_1',
      subscription_status: 'expired',
      subscription_expires_at: new Date(Date.now() - 3600 * 1000).toISOString(),
      sandbox_mode: false
    };

    // Attempting with live_ prefix key
    const resLiveKey = simulateCreatePaymentLinkAuth(expiredMerchant, 'live_abc123');
    assert.equal(resLiveKey.allowed, false);
    assert.equal(resLiveKey.status, 403);
    assert.equal(resLiveKey.code, 'SUBSCRIPTION_EXPIRED');

    // Attempting with test_ key should be allowed (sandbox testing remains permitted)
    const resTestKey = simulateCreatePaymentLinkAuth(expiredMerchant, 'test_abc123');
    assert.equal(resTestKey.allowed, true);
  });

  await t.test('3. Active subscription allows live mode and retains sandbox_mode selection', () => {
    const activeMerchant = {
      id: 'usr_test_merchant_2',
      subscription_status: 'active',
      subscription_expires_at: new Date(Date.now() + 86400 * 30 * 1000).toISOString(),
      sandbox_mode: false
    };

    const status = evaluateLiveStatus(activeMerchant);
    assert.equal(status.isSubExpired, false);
    assert.equal(status.isSubActive, true);
    assert.equal(status.isLiveUnlocked, true);
    assert.equal(status.effectiveSandboxMode, false);

    const res = simulateCreatePaymentLinkAuth(activeMerchant, 'live_active123');
    assert.equal(res.allowed, true);
    assert.equal(res.isLiveMode, true);
  });

  await t.test('4. Expired account (including platform admin) strictly locks Live Mode and forces sandbox', () => {
    const adminMerchant = {
      id: PLATFORM_ADMIN_ID,
      subscription_status: 'expired',
      subscription_expires_at: new Date(Date.now() - 10000).toISOString(),
      sandbox_mode: false
    };

    const status = evaluateLiveStatus(adminMerchant);
    assert.equal(status.isLiveUnlocked, false, 'Expired subscription must lock live mode without bypass');
    assert.equal(status.effectiveSandboxMode, true);

    const res = simulateCreatePaymentLinkAuth(adminMerchant, 'live_admin123');
    assert.equal(res.allowed, false);
    assert.equal(res.code, 'SUBSCRIPTION_EXPIRED');
  });
});
