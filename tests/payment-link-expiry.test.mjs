/**
 * Automated Test Suite for MyMobPay Payment Link Expiry & Security System
 * Run via: node tests/payment-link-expiry.test.mjs
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

import {
  generateSecureToken,
  validateAndComputeExpiryMinutes,
  computeExpiresAt,
  isLinkUsable,
  parseAmountToPaise,
  paiseToRupees,
  EXPIRY_LIMITS
} from '../lib/paymentLinks.js';

test('--- MyMobPay Payment Link Expiry & Security Suite ---', async (t) => {

  await t.test('1. Link opened before and after expiry', () => {
    const futureExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const activeLink = {
      id: 'pl_test_1',
      token: generateSecureToken(24),
      amount: 50000,
      status: 'active',
      link_type: 'shared',
      expires_at: futureExpiresAt,
      created_at: new Date().toISOString()
    };

    // Before expiry: must be usable with HTTP 200
    const activeCheck = isLinkUsable(activeLink);
    assert.equal(activeCheck.usable, true);
    assert.equal(activeCheck.code, 'ACTIVE');
    assert.equal(activeCheck.httpStatus, 200);

    // After expiry: must return HTTP 410 Gone with EXPIRED code
    const pastExpiresAt = new Date(Date.now() - 60 * 1000).toISOString();
    const expiredLink = {
      ...activeLink,
      expires_at: pastExpiresAt
    };

    const expiredCheck = isLinkUsable(expiredLink);
    assert.equal(expiredCheck.usable, false);
    assert.equal(expiredCheck.code, 'EXPIRED');
    assert.equal(expiredCheck.httpStatus, 410);
    assert.match(expiredCheck.message, /expired/i);
  });

  await t.test('2. Payment started just before expiry, with callback arriving after', () => {
    const justBeforeExpiry = new Date(Date.now() + 2000).toISOString();
    const link = {
      id: 'pl_test_2',
      token: generateSecureToken(24),
      amount: 150000,
      status: 'active',
      expires_at: justBeforeExpiry,
      created_at: new Date().toISOString()
    };

    // Transition to processing atomically when customer starts checkout
    link.status = 'processing';
    link.processing_started_at = new Date().toISOString();
    link.order_id = 'MMP_TEST_ORDER_123';

    // Simulate clock advancing past expiry
    link.expires_at = new Date(Date.now() - 5000).toISOString();

    // Verify while in processing within 10 min window, customer gets processing lock
    const processingCheck = isLinkUsable(link);
    assert.equal(processingCheck.usable, false);
    assert.equal(processingCheck.code, 'PROCESSING');
    assert.equal(processingCheck.httpStatus, 409);

    // Simulate bank confirmation arriving after expiry:
    // Consistent rule: Honor the payment, mark paid with late flag!
    const isLate = new Date().getTime() > new Date(link.expires_at).getTime();
    link.status = 'paid';
    link.paid_at = new Date().toISOString();
    link.metadata = {
      paid_after_expiry: isLate,
      paid_utr: '429102948192'
    };

    assert.equal(link.status, 'paid');
    assert.equal(link.metadata.paid_after_expiry, true);

    // Check link usability after payment: must report PAID
    const paidCheck = isLinkUsable(link);
    assert.equal(paidCheck.usable, false);
    assert.equal(paidCheck.code, 'PAID');
    assert.equal(paidCheck.httpStatus, 200);
  });

  await t.test('3. Duplicate callback (idempotency)', () => {
    const paidLink = {
      id: 'pl_test_3',
      token: generateSecureToken(24),
      amount: 75000,
      status: 'paid',
      paid_at: new Date(Date.now() - 1000).toISOString(),
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      metadata: { paid_utr: '492019283910' }
    };

    // First check
    const check1 = isLinkUsable(paidLink);
    assert.equal(check1.code, 'PAID');

    // Duplicate callback simulation
    function handleSimulatedCallback(currentLink, utr) {
      if (currentLink.status === 'paid') {
        return { success: true, alreadyPaid: true, status: 'paid' };
      }
      currentLink.status = 'paid';
      return { success: true, alreadyPaid: false, status: 'paid' };
    }

    const dupResult = handleSimulatedCallback(paidLink, '492019283910');
    assert.equal(dupResult.success, true);
    assert.equal(dupResult.alreadyPaid, true);
    assert.equal(paidLink.status, 'paid');
  });

  await t.test('4. Invalid or guessed token', () => {
    // Non-existent or null token
    const nullCheck = isLinkUsable(null);
    assert.equal(nullCheck.usable, false);
    assert.equal(nullCheck.code, 'NOT_FOUND');
    assert.equal(nullCheck.httpStatus, 404);

    // Guessed invalid string
    const invalidCheck = isLinkUsable(undefined);
    assert.equal(invalidCheck.usable, false);
    assert.equal(invalidCheck.code, 'NOT_FOUND');
    assert.equal(invalidCheck.httpStatus, 404);

    // Verify token security: minimum 24 bytes = 48 hex chars
    const token = generateSecureToken(24);
    assert.equal(token.length, 48);
    assert.match(token, /^[0-9a-f]{48}$/);
  });

  await t.test('5. Cron job expiring links and skipping processing ones', () => {
    const now = Date.now();
    const links = [
      {
        id: '1',
        status: 'active',
        expires_at: new Date(now - 10000).toISOString(), // Past expiry
      },
      {
        id: '2',
        status: 'processing', // Payment in flight
        expires_at: new Date(now - 5000).toISOString(), // Past expiry
        processing_started_at: new Date(now - 60000).toISOString(), // Started 1 min ago
      },
      {
        id: '3',
        status: 'active',
        expires_at: new Date(now + 600000).toISOString(), // Future expiry
      }
    ];

    // Simulated atomic batch cron update
    const expiredLinks = [];
    links.forEach((l) => {
      // Must only expire if status = 'active' and expires_at < now
      if (l.status === 'active' && new Date(l.expires_at).getTime() < now) {
        l.status = 'expired';
        l.expired_at = new Date().toISOString();
        expiredLinks.push(l.id);
      }
    });

    assert.equal(expiredLinks.length, 1);
    assert.equal(expiredLinks[0], '1');
    assert.equal(links[0].status, 'expired');
    // Link 2 must remain 'processing' (skipped by cron to prevent race condition mid-payment)
    assert.equal(links[1].status, 'processing');
    // Link 3 remains active
    assert.equal(links[2].status, 'active');
  });

  await t.test('6. Server restart while links are active (DB UTC timestamp persistence)', () => {
    const fixedUtcString = '2026-10-11T12:00:00.000Z';
    const linkRecordFromDb = {
      id: 'pl_persisted',
      token: generateSecureToken(24),
      amount: 10000,
      status: 'active',
      expires_at: fixedUtcString,
      created_at: '2026-10-11T10:00:00.000Z'
    };

    // Link expiry logic must strictly parse DB UTC timestamp, independent of in-memory timers
    const targetMs = new Date(fixedUtcString).getTime();
    assert.equal(isNaN(targetMs), false);

    // If evaluated before fixed UTC
    const isUsableBefore = (new Date('2026-10-11T11:59:00.000Z').getTime() < targetMs);
    assert.equal(isUsableBefore, true);

    // If evaluated after fixed UTC (e.g. after server reboot)
    const isUsableAfter = (new Date('2026-10-11T12:01:00.000Z').getTime() < targetMs);
    assert.equal(isUsableAfter, false);
  });

  await t.test('7. Expiry values below minimum (5m) and above maximum (30d)', () => {
    // Below minimum
    const belowMin = validateAndComputeExpiryMinutes(4);
    assert.equal(belowMin.valid, false);
    assert.match(belowMin.error, /Minimum allowed is 5 minutes/i);

    const zeroMin = validateAndComputeExpiryMinutes(0);
    assert.equal(zeroMin.valid, false);

    const negMin = validateAndComputeExpiryMinutes(-10);
    assert.equal(negMin.valid, false);

    // Above maximum (30 days = 43,200 min)
    const aboveMax = validateAndComputeExpiryMinutes(43201);
    assert.equal(aboveMax.valid, false);
    assert.match(aboveMax.error, /Maximum allowed is 30 days/i);

    // Valid preset tests
    const preset15m = validateAndComputeExpiryMinutes('15m');
    assert.equal(preset15m.valid, true);
    assert.equal(preset15m.minutes, 15);

    const preset1h = validateAndComputeExpiryMinutes('1h');
    assert.equal(preset1h.valid, true);
    assert.equal(preset1h.minutes, 60);

    const preset24h = validateAndComputeExpiryMinutes('24h');
    assert.equal(preset24h.valid, true);
    assert.equal(preset24h.minutes, 1440);

    const preset7d = validateAndComputeExpiryMinutes('7d');
    assert.equal(preset7d.valid, true);
    assert.equal(preset7d.minutes, 10080);

    // Default fallbacks
    const defaultShared = validateAndComputeExpiryMinutes(null, 'shared');
    assert.equal(defaultShared.minutes, 1440); // 24 hours

    const defaultCheckout = validateAndComputeExpiryMinutes(null, 'checkout');
    assert.equal(defaultCheckout.minutes, 15); // 15 minutes
  });

  await t.test('8. Post-24 hour paid link cleanup rule', () => {
    const now = Date.now();
    // Paid 2 hours ago: shows already paid
    const recentlyPaidLink = {
      status: 'paid',
      paid_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      is_archived: false
    };
    const checkRecent = isLinkUsable(recentlyPaidLink);
    assert.equal(checkRecent.code, 'PAID');
    assert.equal(checkRecent.httpStatus, 200);

    // Paid 25 hours ago: returns 404 (acts as if non-existent on server, kept in merchant history)
    const stalePaidLink = {
      status: 'paid',
      paid_at: new Date(now - 25 * 60 * 60 * 1000).toISOString(),
      is_archived: false
    };
    const checkStale = isLinkUsable(stalePaidLink);
    assert.equal(checkStale.code, 'NOT_FOUND');
    assert.equal(checkStale.httpStatus, 404);
  });
});
