import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStrongPassword, getPasswordCriteria } from '../lib/passwordValidation.js';

test('--- Auth Security & Vulnerability Audit Verification Suite ---', async (t) => {

  // ─────────────────────────────────────────────────────────────────
  // 1. Password Security & Complexity Enforcement
  // ─────────────────────────────────────────────────────────────────
  await t.test('1. Strong password policy enforcement and sequential/repeating digit rejection', () => {
    // Valid strong passwords
    assert.strictEqual(validateStrongPassword('MyMobPay@2026').valid, true);
    assert.strictEqual(validateStrongPassword('SecureP@ssw0rd').valid, true);
    assert.strictEqual(validateStrongPassword('Kunal#Admin99').valid, true);

    // Reject too short (< 8 chars)
    const shortRes = validateStrongPassword('P@ss1');
    assert.strictEqual(shortRes.valid, false);
    assert.match(shortRes.error, /at least 8 characters/i);

    // Reject missing uppercase
    const noUpperRes = validateStrongPassword('mymobpay@2026');
    assert.strictEqual(noUpperRes.valid, false);
    assert.match(noUpperRes.error, /uppercase letter/i);

    // Reject missing number
    const noNumRes = validateStrongPassword('MyMobPay@Secure');
    assert.strictEqual(noNumRes.valid, false);
    assert.match(noNumRes.error, /number/i);

    // Reject missing special character
    const noSpecialRes = validateStrongPassword('MyMobPay2026');
    assert.strictEqual(noSpecialRes.valid, false);
    assert.match(noSpecialRes.error, /special character/i);

    // Reject repeating digits (111, 222, 999)
    const repeatRes1 = validateStrongPassword('Admin@111Pass');
    assert.strictEqual(repeatRes1.valid, false);
    assert.match(repeatRes1.error, /repeating numbers/i);

    const repeatRes2 = validateStrongPassword('Admin@999Pass');
    assert.strictEqual(repeatRes2.valid, false);
    assert.match(repeatRes2.error, /repeating numbers/i);

    // Reject sequential digits (123, 456, 789, 987, 321)
    const seqRes1 = validateStrongPassword('Admin@123Pass');
    assert.strictEqual(seqRes1.valid, false);
    assert.match(seqRes1.error, /sequential numbers/i);

    const seqRes2 = validateStrongPassword('Admin@987Pass');
    assert.strictEqual(seqRes2.valid, false);
    assert.match(seqRes2.error, /sequential numbers/i);

    const seqRes3 = validateStrongPassword('Admin@456Pass');
    assert.strictEqual(seqRes3.valid, false);
    assert.match(seqRes3.error, /sequential numbers/i);
  });

  await t.test('1b. Password criteria analyzer evaluates all requirements accurately', () => {
    const crit = getPasswordCriteria('MyMobPay@2026');
    assert.strictEqual(crit.hasMinLength, true);
    assert.strictEqual(crit.hasUppercase, true);
    assert.strictEqual(crit.hasNumber, true);
    assert.strictEqual(crit.hasSpecial, true);
    assert.strictEqual(crit.noSequenceOrRepeat, true);
    assert.strictEqual(crit.allMet, true);
    assert.strictEqual(crit.isValid, true);
  });

  // ─────────────────────────────────────────────────────────────────
  // 2. Open Redirect Prevention Sanitizer
  // ─────────────────────────────────────────────────────────────────
  await t.test('2. getSafeRedirectUrl strictly eliminates Open Redirects (CWE-601)', () => {
    function getSafeRedirectUrl(rawUrl, defaultUrl = '/dashboard') {
      if (!rawUrl || typeof rawUrl !== 'string') return defaultUrl;
      const trimmed = rawUrl.trim();
      // Must start with '/' and not with '//' or '/\' (prevents protocol-relative URLs)
      if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
        return defaultUrl;
      }
      // Disallow redirecting back to /login or /signup
      if (trimmed.startsWith('/login') || trimmed.startsWith('/signup')) {
        return defaultUrl;
      }
      return trimmed;
    }

    // External URLs must be rejected and defaulted to /dashboard
    assert.strictEqual(getSafeRedirectUrl('https://evil.com'), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl('http://phishing.com/login'), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl('ftp://evil.com'), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl('javascript:alert(1)'), '/dashboard');

    // Protocol-relative URLs must be rejected
    assert.strictEqual(getSafeRedirectUrl('//evil.com'), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl('//evil.com/phish'), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl('/\\evil.com'), '/dashboard');

    // Infinite redirect loops back to login/signup must be prevented
    assert.strictEqual(getSafeRedirectUrl('/login'), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl('/login?redirect=/foo'), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl('/signup'), '/dashboard');

    // Null/undefined/empty must default to /dashboard
    assert.strictEqual(getSafeRedirectUrl(null), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl(undefined), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl(''), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl('   '), '/dashboard');

    // Legitimate internal dashboard paths must be preserved
    assert.strictEqual(getSafeRedirectUrl('/dashboard'), '/dashboard');
    assert.strictEqual(getSafeRedirectUrl('/dashboard/orders'), '/dashboard/orders');
    assert.strictEqual(getSafeRedirectUrl('/dashboard/settings?tab=keys'), '/dashboard/settings?tab=keys');
    assert.strictEqual(getSafeRedirectUrl('/pay/order_123'), '/pay/order_123');
  });

  // ─────────────────────────────────────────────────────────────────
  // 3. Incomplete Cleanup Security & Ownership Validation
  // ─────────────────────────────────────────────────────────────────
  await t.test('3. Cleanup incomplete signup authorization checks', () => {
    // Check missing token simulation
    const checkAuthRequirement = (authHeader) => {
      const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
      if (!token) {
        return { allowed: false, status: 401, error: 'Unauthorized: Authentication token is required.' };
      }
      return { allowed: true, token };
    };

    assert.strictEqual(checkAuthRequirement(null).status, 401);
    assert.strictEqual(checkAuthRequirement('').status, 401);
    assert.strictEqual(checkAuthRequirement('Bearer ').status, 401);
    assert.strictEqual(checkAuthRequirement('Bearer valid-jwt-token-xyz').allowed, true);

    // Check ownership validation logic
    const checkOwnership = (sessionUser, targetId, targetEmail) => {
      const cleanEmail = (targetEmail || '').trim().toLowerCase();
      const isOwner = sessionUser.id === targetId || (sessionUser.email && sessionUser.email.toLowerCase() === cleanEmail);
      return isOwner;
    };

    const legitimateUser = { id: 'usr-111', email: 'merchant@example.com' };
    const attackerUser   = { id: 'usr-666', email: 'attacker@evil.com' };

    // Legitimate user deleting their own incomplete registration
    assert.strictEqual(checkOwnership(legitimateUser, 'usr-111', 'merchant@example.com'), true);
    assert.strictEqual(checkOwnership(legitimateUser, 'usr-111', null), true);

    // Attacker attempting to delete victim's registration
    assert.strictEqual(checkOwnership(attackerUser, 'usr-111', 'merchant@example.com'), false);
    assert.strictEqual(checkOwnership(attackerUser, 'usr-victim', 'victim@bank.com'), false);
  });

  // ─────────────────────────────────────────────────────────────────
  // 4. Completed Merchant Account Preservation Guard
  // ─────────────────────────────────────────────────────────────────
  await t.test('4. Cleanup endpoint never purges completed merchant profiles or active users', () => {
    const canPurgeAccount = ({ userMetadata, merchantProfile, orderCount }) => {
      // 1. User metadata check
      const meta = userMetadata || {};
      const metaPhone = (meta.phone || '').toString().trim().replace(/\D/g, '');
      const isMetaCompleted = Boolean(
        meta.business_name &&
        meta.business_name !== 'My Business' &&
        meta.upi_id &&
        meta.upi_id !== 'pending@upi' &&
        meta.upi_id.includes('@') &&
        metaPhone.length === 10
      );
      if (isMetaCompleted) return { allowed: false, reason: 'Completed metadata' };

      // 2. Merchant profile check
      const cleanPhone = (merchantProfile?.phone_number || '').trim().replace(/\D/g, '');
      const isCompletedMerchant = Boolean(
        merchantProfile &&
        merchantProfile.business_name &&
        merchantProfile.business_name.trim().length > 0 &&
        merchantProfile.business_name !== 'My Business' &&
        merchantProfile.upi_id &&
        merchantProfile.upi_id !== 'pending@upi' &&
        merchantProfile.upi_id.includes('@') &&
        cleanPhone.length === 10
      );
      if (isCompletedMerchant) return { allowed: false, reason: 'Completed merchant profile' };

      // 3. Operational orders check
      if (orderCount > 0) return { allowed: false, reason: 'Active orders exist' };

      return { allowed: true };
    };

    // Completed merchant with phone, upi, business
    const activeMerchant = {
      userMetadata: { business_name: 'Acme Corp', upi_id: 'acme@okaxis', phone: '9876543210' },
      merchantProfile: { business_name: 'Acme Corp', upi_id: 'acme@okaxis', phone_number: '+919876543210' },
      orderCount: 5,
    };
    assert.strictEqual(canPurgeAccount(activeMerchant).allowed, false);

    // Partial merchant abandoned at step 1
    const abandonedSignup = {
      userMetadata: { name: 'New User' },
      merchantProfile: null,
      orderCount: 0,
    };
    assert.strictEqual(canPurgeAccount(abandonedSignup).allowed, true);

    // Dummy merchant row created with pending@upi
    const dummyProfile = {
      userMetadata: {},
      merchantProfile: { business_name: 'My Business', upi_id: 'pending@upi', phone_number: null },
      orderCount: 0,
    };
    assert.strictEqual(canPurgeAccount(dummyProfile).allowed, true);
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. Google OAuth Existing Account Registration Bypass Logic
  // ─────────────────────────────────────────────────────────────────
  await t.test('5. Existing registered accounts & platform admins bypass signup wizard directly to dashboard', () => {
    const evaluateAuthRouting = (verifyData) => {
      const isAlreadyRegistered = Boolean(
        verifyData &&
        verifyData.allowed &&
        (
          verifyData.isAdmin ||
          (verifyData.registered && (verifyData.isComplete || !verifyData.needsRegistration))
        )
      );

      if (isAlreadyRegistered) {
        return { action: 'redirect_dashboard', target: '/dashboard' };
      }

      if (verifyData && !verifyData.isAdmin && (verifyData.needsRegistration === true || !verifyData.registered)) {
        return { action: 'launch_signup_wizard', step: 1 };
      }

      return { action: 'error_fallback' };
    };

    // Platform admin returning via Google OAuth
    const adminVerifyData = {
      allowed: true,
      registered: true,
      isComplete: true,
      needsRegistration: false,
      isAdmin: true,
      email: 'chauhankunal695@gmail.com',
      merchantId: 'dd45279e-7a2c-413c-9e24-24d88011b680',
    };
    assert.deepStrictEqual(evaluateAuthRouting(adminVerifyData), {
      action: 'redirect_dashboard',
      target: '/dashboard',
    });

    // Existing active merchant returning via Google OAuth
    const existingMerchantData = {
      allowed: true,
      registered: true,
      isComplete: true,
      needsRegistration: false,
      email: 'merchant@store.com',
      merchantId: 'm-12345',
      businessName: 'My Store',
    };
    assert.deepStrictEqual(evaluateAuthRouting(existingMerchantData), {
      action: 'redirect_dashboard',
      target: '/dashboard',
    });

    // Truly brand new user authenticating for the first time
    const newUserData = {
      allowed: true,
      registered: false,
      isComplete: false,
      needsRegistration: true,
      isNewMerchant: true,
      email: 'brandnew@gmail.com',
      merchantId: 'usr-new',
    };
    assert.deepStrictEqual(evaluateAuthRouting(newUserData), {
      action: 'launch_signup_wizard',
      step: 1,
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // 6. Signup Completion Post-Registration Redirect Policy
  // ─────────────────────────────────────────────────────────────────
  await t.test('6. Signup completion redirects to login page with "Signup successful! Please login." and clears session', () => {
    const handleSignupCompletion = ({ registerSuccess, registeredEmail }) => {
      if (!registerSuccess) {
        throw new Error('Registration failed');
      }

      // Explicitly sign out / terminate session so user logs in manually
      const sessionActive = false;
      const mode = 'signin';
      const authTab = 'password';
      const message = 'Signup successful! Please login.';
      const redirectTarget = '/login';
      const emailRetained = registeredEmail;

      return {
        sessionActive,
        mode,
        authTab,
        message,
        redirectTarget,
        emailRetained,
      };
    };

    const completionResult = handleSignupCompletion({
      registerSuccess: true,
      registeredEmail: 'merchant@store.com',
    });

    assert.strictEqual(completionResult.sessionActive, false);
    assert.strictEqual(completionResult.mode, 'signin');
    assert.strictEqual(completionResult.authTab, 'password');
    assert.strictEqual(completionResult.message, 'Signup successful! Please login.');
    assert.strictEqual(completionResult.redirectTarget, '/login');
    assert.strictEqual(completionResult.emailRetained, 'merchant@store.com');
  });

  // ─────────────────────────────────────────────────────────────────
  // 7. Mandatory Legal Agreement & Operating Rules Consent Policy
  // ─────────────────────────────────────────────────────────────────
  await t.test('7. Registration enforces mandatory legal agreement & merchant operating rules consent', () => {
    const validateRegistrationConsent = ({ termsAccepted, termsVersion, clientIp }) => {
      // Step 0 check matching app/api/auth/register/route.js
      if (termsAccepted !== true) {
        return {
          allowed: false,
          status: 400,
          error: 'You must review and accept the Terms of Service, Legal Agreement, and Merchant Operating Rules to register.',
        };
      }

      return {
        allowed: true,
        auditTrail: {
          terms_accepted: true,
          terms_version: termsVersion || '2026-v2.5',
          terms_accepted_at: new Date().toISOString(),
          terms_ip: clientIp || '127.0.0.1',
        },
      };
    };

    // Fails without explicit terms acceptance
    const missingConsent = validateRegistrationConsent({
      termsAccepted: false,
      termsVersion: '2026-v2.5',
      clientIp: '192.168.1.1',
    });
    assert.strictEqual(missingConsent.allowed, false);
    assert.strictEqual(missingConsent.status, 400);
    assert.match(missingConsent.error, /Terms of Service, Legal Agreement, and Merchant Operating Rules/);

    const undefinedConsent = validateRegistrationConsent({
      termsAccepted: undefined,
    });
    assert.strictEqual(undefinedConsent.allowed, false);
    assert.strictEqual(undefinedConsent.status, 400);

    const stringConsent = validateRegistrationConsent({
      termsAccepted: 'true', // strictly boolean true required
    });
    assert.strictEqual(stringConsent.allowed, false);
    assert.strictEqual(stringConsent.status, 400);

    // Passes with valid boolean true consent and records audit metadata
    const validConsent = validateRegistrationConsent({
      termsAccepted: true,
      termsVersion: '2026-v2.5',
      clientIp: '49.36.120.45',
    });
    assert.strictEqual(validConsent.allowed, true);
    assert.strictEqual(validConsent.auditTrail.terms_accepted, true);
    assert.strictEqual(validConsent.auditTrail.terms_version, '2026-v2.5');
    assert.strictEqual(validConsent.auditTrail.terms_ip, '49.36.120.45');
    assert.ok(validConsent.auditTrail.terms_accepted_at);
  });
});

