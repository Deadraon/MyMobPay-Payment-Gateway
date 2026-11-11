import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  isRateLimitOrQuotaError,
  isProviderCircuitTripped,
  tripProviderLimit,
  resetProviderLimit,
  getProviderCircuitStatus,
  isEmailLabsConfigured,
  isMailerooConfigured,
  isUnitpostConfigured,
  isSendpulseConfigured,
  isBrevoConfigured,
  isResendConfigured,
} from '../lib/mailer.js';

describe('--- Mailer Smart Router Multi-Provider Configuration & Circuit Breaker Suite ---', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    // Reset circuit breakers
    resetProviderLimit('emaillabs');
    resetProviderLimit('unitpost');
    resetProviderLimit('maileroo');
    resetProviderLimit('sendpulse');
    resetProviderLimit('brevo');
    resetProviderLimit('resend');
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  test('1. Rate limit & quota error detector identifies 429, 550, 421 and message keywords', () => {
    assert.strictEqual(isRateLimitOrQuotaError(new Error('Rate limit exceeded')), true);
    assert.strictEqual(isRateLimitOrQuotaError(new Error('Daily limit reached')), true);
    assert.strictEqual(isRateLimitOrQuotaError(new Error('Sending limit reached for today')), true);
    assert.strictEqual(isRateLimitOrQuotaError(new Error('Plan limit exceeded')), true);
    assert.strictEqual(isRateLimitOrQuotaError(new Error('Credits exhausted')), true);
    assert.strictEqual(isRateLimitOrQuotaError({ code: '429', message: 'Too many requests' }), true);
    assert.strictEqual(isRateLimitOrQuotaError({ statusCode: 429, message: 'Too Many Requests' }), true);
    assert.strictEqual(isRateLimitOrQuotaError({ code: '550', message: 'Mailbox quota exceeded' }), true);
    assert.strictEqual(isRateLimitOrQuotaError({ code: '452', message: 'Too many recipients' }), true);

    // Regular errors should not trip quota logic
    assert.strictEqual(isRateLimitOrQuotaError(new Error('Invalid recipient address format')), false);
    assert.strictEqual(isRateLimitOrQuotaError(new Error('Connection timeout')), false);
  });

  test('2. Circuit breaker trips provider and automatically puts it in cooldown', () => {
    assert.strictEqual(isProviderCircuitTripped('emaillabs'), false);

    tripProviderLimit('emaillabs', '300/day daily limit exhausted', 10000);
    assert.strictEqual(isProviderCircuitTripped('emaillabs'), true);

    const status = getProviderCircuitStatus();
    assert.strictEqual(status.emaillabs.isLimited, true);
    assert.match(status.emaillabs.reason, /300\/day/);

    resetProviderLimit('emaillabs');
    assert.strictEqual(isProviderCircuitTripped('emaillabs'), false);
  });

  test('3. Environment checkers accurately detect configuration state for EmailLabs', () => {
    delete process.env.EMAILLABS_SMTP_USER;
    delete process.env.EMAILLABS_SMTP_PASS;
    assert.strictEqual(isEmailLabsConfigured(), false);

    process.env.EMAILLABS_SMTP_USER = 'app_test_user';
    process.env.EMAILLABS_SMTP_PASS = 'app_test_secret';
    assert.strictEqual(isEmailLabsConfigured(), true);
  });

  test('4. Environment checkers accurately detect configuration state for Unitpost', () => {
    delete process.env.UNITPOST_API_KEY;
    delete process.env.UNITPOST_SMTP_USER;
    delete process.env.UNITPOST_SMTP_PASS;
    assert.strictEqual(isUnitpostConfigured(), false);

    // Via API key
    process.env.UNITPOST_API_KEY = 'up_test_key_123';
    assert.strictEqual(isUnitpostConfigured(), true);

    // Via SMTP
    delete process.env.UNITPOST_API_KEY;
    process.env.UNITPOST_SMTP_USER = 'unitpost';
    process.env.UNITPOST_SMTP_PASS = 'secret_smtp_pass';
    assert.strictEqual(isUnitpostConfigured(), true);
  });

  test('5. Environment checkers accurately detect configuration state for Maileroo', () => {
    delete process.env.MAILEROO_SMTP_USER;
    delete process.env.MAILEROO_SMTP_PASS;
    delete process.env.MAILEROO_API_KEY;
    assert.strictEqual(isMailerooConfigured(), false);

    // Via API key
    process.env.MAILEROO_API_KEY = 'mr_test_key_123';
    assert.strictEqual(isMailerooConfigured(), true);

    // Via SMTP
    delete process.env.MAILEROO_API_KEY;
    process.env.MAILEROO_SMTP_USER = 'maileroo_user';
    process.env.MAILEROO_SMTP_PASS = 'maileroo_pass';
    assert.strictEqual(isMailerooConfigured(), true);
  });
});
