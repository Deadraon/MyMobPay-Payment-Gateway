import crypto from 'crypto';
import { supabaseAdmin } from './supabase.js';
import { CONFIG } from './config.js';
import { sendSubscriptionInvoiceEmail } from './mailer.js';
import { formatMerchantId } from './merchantId.js';

// Base32 Decoding for TOTP (RFC 6238/4226)
function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let clean = base32.replace(/=+$/, '').toUpperCase().replace(/\s/g, '');
  let len = clean.length;
  let val = 0;
  let count = 0;
  let bytes = [];

  for (let i = 0; i < len; i++) {
    const idx = alphabet.indexOf(clean[i]);
    if (idx === -1) throw new Error('Invalid base32 character');
    val = (val << 5) | idx;
    count += 5;
    if (count >= 8) {
      bytes.push((val >>> (count - 8)) & 255);
      count -= 8;
    }
  }
  return Buffer.from(bytes);
}

// Generate standard 16-character Base32 Secret Key for Authenticator apps
export function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Verify a 6-digit TOTP code against the secret (with time window offset)
export function verifyTOTP(secret, code, window = 2) {
  if (!secret || !code) return false;
  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);

    for (let i = -window; i <= window; i++) {
      const c = counter + i;
      // Convert counter to 8-byte buffer
      const buf = Buffer.alloc(8);
      buf.writeUInt32BE(0, 0); // High 32 bits
      buf.writeUInt32BE(c, 4); // Low 32 bits

      const hmac = crypto.createHmac('sha1', key).update(buf).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const binary = ((hmac[offset] & 0x7f) << 24) |
                     ((hmac[offset + 1] & 0xff) << 16) |
                     ((hmac[offset + 2] & 0xff) << 8) |
                     (hmac[offset + 3] & 0xff);

      const calculatedCode = String(binary % 1000000).padStart(6, '0');
      if (calculatedCode === code.trim()) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('TOTP verification error:', err);
    return false;
  }
}

// Cache admin merchant record in memory for 30s to prevent roundtrip DB spikes
let cachedAdminMerchant = null;
let cacheExpiry = 0;

// Ensure Platform Admin Merchant row exists in the database
export async function ensureAdminMerchant(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedAdminMerchant && now < cacheExpiry) {
    return cachedAdminMerchant;
  }

  try {
    // 1. Try finding by PLATFORM_ADMIN_USER_ID
    if (PLATFORM_ADMIN_USER_ID) {
      const { data: byId } = await supabaseAdmin
        .from('merchants')
        .select('*')
        .eq('id', PLATFORM_ADMIN_USER_ID)
        .maybeSingle();
      if (byId) {
        cachedAdminMerchant = byId;
        cacheExpiry = now + 30000;
        return byId;
      }
    }

    // 2. Try by platformApiKey
    const { data: existing } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('api_key', CONFIG.platformApiKey)
      .maybeSingle();

    if (existing) {
      cachedAdminMerchant = existing;
      cacheExpiry = now + 30000;
      return existing;
    }

    // 3. Fallback: try finding first active merchant or any with Admin in name
    const { data: fallbackAdmin } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .ilike('business_name', '%Admin%')
      .maybeSingle();

    if (fallbackAdmin) {
      cachedAdminMerchant = fallbackAdmin;
      cacheExpiry = now + 30000;
      return fallbackAdmin;
    }

    return null;
  } catch (err) {
    console.error('ensureAdminMerchant error:', err);
    return cachedAdminMerchant || null;
  }
}

export const DEFAULT_ADMIN_EMAILS = [
  'chauhankunal695@gmail.com',
  'deadraon@gmail.com',
  'deadraon1@gmail.com'
];

export const PLATFORM_ADMIN_USER_ID = 'dd45279e-7a2c-413c-9e24-24d88011b680';

export const DEFAULT_ADMIN_TOTP_SECRET = 'MYMOBPAYADMINSEC';

// Fetch Admin configurations stored inside setup_progress JSONB field
export async function getAdminSettings() {
  const adminMerchant = await ensureAdminMerchant();
  const fallbackSecret = process.env.ADMIN_TOTP_SECRET || DEFAULT_ADMIN_TOTP_SECRET;

  if (!adminMerchant) {
    return {
      totp_secret: fallbackSecret,
      totp_enabled: true,
      admin_email: DEFAULT_ADMIN_EMAILS.join(', '),
      admin_notification_email: DEFAULT_ADMIN_EMAILS[0],
      gift_codes: []
    };
  }

  const setupProgress = adminMerchant.setup_progress || {};
  const settings = setupProgress.admin_settings || {};
  const primaryLoginEmail = (settings.admin_email ? settings.admin_email.split(',')[0].trim() : '') || DEFAULT_ADMIN_EMAILS[0];

  return {
    totp_secret: settings.totp_secret || fallbackSecret,
    totp_enabled: true, // Always active for passwordless Authenticator App mode
    admin_email: settings.admin_email || DEFAULT_ADMIN_EMAILS.join(', '),
    admin_notification_email: settings.admin_notification_email || primaryLoginEmail,
    gift_codes: Array.isArray(settings.gift_codes) ? settings.gift_codes : []
  };
}

// Update Admin settings inside setup_progress JSONB field
export async function updateAdminSettings(updates) {
  const adminMerchant = await ensureAdminMerchant(true);
  if (!adminMerchant) return false;

  const setupProgress = adminMerchant.setup_progress || {};
  const currentSettings = setupProgress.admin_settings || {};
  
  const updatedSettings = {
    ...currentSettings,
    ...updates
  };

  const newSetupProgress = {
    ...setupProgress,
    admin_settings: updatedSettings
  };

  // Perform database update
  const { error } = await supabaseAdmin
    .from('merchants')
    .update({ setup_progress: newSetupProgress })
    .eq('id', adminMerchant.id);

  if (error) {
    console.error('Failed to update admin settings:', error);
    return false;
  }

  // Update memory cache
  cachedAdminMerchant = {
    ...adminMerchant,
    setup_progress: newSetupProgress
  };
  cacheExpiry = Date.now() + 30000;

  return true;
}

// Helper to check if a user email matches configured admin email list (comma-separated, matches prefixes or exact)
export function isAuthorizedEmail(userEmail, configuredAdminEmails) {
  if (!userEmail) return false;
  const emailLower = userEmail.toLowerCase().trim();

  // 1. Check default owner emails
  if (DEFAULT_ADMIN_EMAILS.some(e => e.toLowerCase() === emailLower)) {
    return true;
  }

  // 2. Check environment variable ADMIN_EMAIL or ADMIN_EMAILS
  const envEmails = (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || '');
  if (envEmails) {
    const envList = envEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (envList.some(allowed => emailLower === allowed || emailLower.startsWith(allowed))) {
      return true;
    }
  }

  // 3. Check dynamically configured emails in database
  if (configuredAdminEmails) {
    const allowedList = configuredAdminEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    if (allowedList.some(allowed => emailLower === allowed || emailLower.startsWith(allowed))) {
      return true;
    }
  }

  return false;
}

// Helper to check if a Supabase user is an authorized platform administrator
export function isAuthorizedAdminUser(user, configuredAdminEmails) {
  if (!user) return false;
  if (user.id === PLATFORM_ADMIN_USER_ID) {
    return true;
  }
  return isAuthorizedEmail(user.email, configuredAdminEmails);
}

const _fallbackAdminSecret = crypto.randomBytes(32).toString('hex');
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || _fallbackAdminSecret;

// Cryptographically sign a stateless 24-hour admin session token
export function createAdminSessionToken() {
  const payload = {
    role: 'admin',
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24-hour validity
    nonce: crypto.randomBytes(16).toString('hex')
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(data).digest('base64url');
  return `adm_${data}.${signature}`;
}

// Verify signature and expiration of an admin session token (constant-time comparison)
export function verifyAdminSessionToken(token) {
  if (!token || typeof token !== 'string' || !token.startsWith('adm_')) return false;
  try {
    const raw = token.slice(4);
    const [data, signature] = raw.split('.');
    if (!data || !signature) return false;

    const expectedSig = crypto.createHmac('sha256', ADMIN_SESSION_SECRET).update(data).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);

    if (sigBuf.length !== expectedBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload && payload.role === 'admin' && payload.exp > Date.now()) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

// Verify Admin Request Authorization (from signed session token or authorized Google OAuth token)
export async function verifyAdminAuth(request) {
  try {
    // 0. Direct Admin Session Token or Secret header check
    const adminToken = request.headers.get('x-admin-token');
    if (adminToken && (
      (process.env.ADMIN_API_SECRET && adminToken === process.env.ADMIN_API_SECRET) ||
      verifyAdminSessionToken(adminToken)
    )) {
      return true;
    }

    // 1. Bearer Token Verification
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      // Fast-path: Check signed Admin Session Token (in-memory crypto verification)
      if (token && token.startsWith('adm_') && verifyAdminSessionToken(token)) {
        return true;
      }

      // Supabase Google OAuth Session Verification
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (!error && user) {
        // Fast-path: Check default admin emails or admin ID directly BEFORE calling DB
        if (
          user.id === PLATFORM_ADMIN_USER_ID ||
          DEFAULT_ADMIN_EMAILS.some(e => e.toLowerCase() === user.email?.toLowerCase()?.trim())
        ) {
          return true;
        }

        const settings = await getAdminSettings();
        if (isAuthorizedAdminUser(user, settings?.admin_email)) {
          return true;
        }
      }
    }

    return false;
  } catch (e) {
    console.error('verifyAdminAuth failed:', e);
    return false;
  }
}


// Centralized Subscription Processing on verification
export async function checkAndProcessSubscription(order, apiKey) {
  try {
    if (!order || !order.external_ref) return;

    // SECURITY CHECK: Test mode or unverified orders MUST NEVER activate live subscriptions
    if (order.mode === 'test' || order.status !== 'verified') {
      console.warn(`[Security Warning] Blocked subscription activation attempt for non-live or unverified order ${order.id} (mode: ${order.mode}, status: ${order.status})`);
      return;
    }

    // SECURITY CHECK: Mock or invalid UTRs MUST NEVER activate live subscriptions
    if (order.utr && (order.utr.startsWith('TS_MOCK_') || order.utr.startsWith('TEST_'))) {
      console.warn(`[Security Warning] Blocked subscription activation attempt for mock order ${order.id} (utr: ${order.utr})`);
      return;
    }

    const isSubNote = order.note?.startsWith('Subscription_');

    if (!isSubNote) return;

    let isPlatformMerchant = apiKey === CONFIG.platformApiKey || 
                             order.merchant_id === '677d9312-a53f-4b96-815f-53e0eee1b292' ||
                             order.merchant_id === 'dd45279e-7a2c-413c-9e24-24d88011b680';
    
    if (!isPlatformMerchant && order.merchant_id) {
      const { data: merchantRecord } = await supabaseAdmin
        .from('merchants')
        .select('api_key')
        .eq('id', order.merchant_id)
        .single();
      if (merchantRecord && merchantRecord.api_key === CONFIG.platformApiKey) {
        isPlatformMerchant = true;
      }
    }
    
    // As long as it is an authentic subscription note with a target merchant ID, process it
    const targetMerchantId = order.external_ref;
    let months = 1;
    const monthsMatch = order.note?.match(/Subscription_(\d+)\s*month/i);
    months = monthsMatch ? parseInt(monthsMatch[1]) : 1;

    // Get current merchant subscription and progress
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('subscription_expires_at, subscription_status, setup_progress')
      .eq('id', targetMerchantId)
      .single();

    let baseDate = new Date();
    if (merchant && merchant.subscription_status === 'active' && merchant.subscription_expires_at) {
      const expiry = new Date(merchant.subscription_expires_at);
      if (expiry > baseDate) {
        baseDate = expiry;
      }
    }

    // Add months
    const newExpiry = new Date(baseDate);
    newExpiry.setMonth(newExpiry.getMonth() + months);

    const nowIso = new Date().toISOString();
    const currentProgress = merchant?.setup_progress || {};
    const updatedProgress = {
      ...currentProgress,
      subscription_activated_at: nowIso,
      plan_type: `${months}month`,
      last_payment_at: nowIso,
      last_order_id: order.id
    };

    const { error } = await supabaseAdmin
      .from('merchants')
      .update({
        subscription_status: 'active',
        subscription_expires_at: newExpiry.toISOString(),
        setup_progress: updatedProgress
      })
      .eq('id', targetMerchantId);

    if (error) {
      console.error(`Failed to renew subscription for ${targetMerchantId}:`, error);
    } else {
      console.log(`Successfully activated/renewed subscription for ${targetMerchantId} (${months} month(s)) until ${newExpiry.toISOString()}.`);

      // Dispatch official GST Tax Invoice and Subscription Confirmation Email
      try {
        const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(targetMerchantId);
        const recipientEmail = authUserData?.user?.email;
        if (recipientEmail) {
          const invRef = `INV-${Date.now().toString().slice(-6)}-${(order?.id || '').slice(0, 4).toUpperCase()}`;
          const durationDays = months * 30;
          const planTitle = `${months} Month${months > 1 ? 's' : ''} Platform License`;

          await sendSubscriptionInvoiceEmail({
            to: recipientEmail,
            businessName: merchant?.business_name || 'Merchant Partner',
            mid: formatMerchantId(targetMerchantId),
            planName: planTitle,
            amount: order?.amount || (months * 499),
            durationDays,
            expiryDate: newExpiry,
            invoiceRef: invRef,
            paymentMethod: 'Direct UPI Settlement (NPCI)',
            utr: order?.utr || order?.customer_utr || 'NPCI-VERIFIED'
          });
        }
      } catch (invErr) {
        console.warn('Subscription invoice email dispatch notice:', invErr?.message);
      }
    }
  } catch (err) {
    console.error('checkAndProcessSubscription failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Gift & Promo Codes Engine
// ─────────────────────────────────────────────────────────────

// Get all active and configured gift codes from admin settings
export async function getGiftCodes() {
  try {
    const settings = await getAdminSettings();
    return Array.isArray(settings.gift_codes) ? settings.gift_codes : [];
  } catch (err) {
    console.error('getGiftCodes error:', err);
    return [];
  }
}

// Create or update a gift/promo code
export async function saveGiftCode(codeData) {
  try {
    if (!codeData || !codeData.code) {
      throw new Error('Code name is required');
    }

    const cleanCode = codeData.code.trim().toUpperCase().replace(/\s+/g, '');
    const currentCodes = await getGiftCodes();

    // Check if code already exists
    const existingIndex = currentCodes.findIndex(c => c.code === cleanCode);

    const newCodeObj = {
      code: cleanCode,
      discount_type: codeData.discount_type || 'free', // 'free' (100% off) or 'flat' (₹ off)
      discount_value: parseFloat(codeData.discount_value || 0),
      plan_duration_days: parseInt(codeData.plan_duration_days || 30),
      plan_type: codeData.plan_type || 'gift_subscription',
      max_uses: codeData.max_uses ? parseInt(codeData.max_uses) : null,
      times_used: existingIndex >= 0 ? (currentCodes[existingIndex].times_used || 0) : 0,
      active: codeData.active !== false,
      created_at: existingIndex >= 0 ? currentCodes[existingIndex].created_at : new Date().toISOString(),
      expires_at: codeData.expires_at || null,
      description: codeData.description || 'Gift Subscription Code'
    };

    let updatedCodes;
    if (existingIndex >= 0) {
      updatedCodes = [...currentCodes];
      updatedCodes[existingIndex] = newCodeObj;
    } else {
      updatedCodes = [newCodeObj, ...currentCodes];
    }

    await updateAdminSettings({ gift_codes: updatedCodes });
    return newCodeObj;
  } catch (err) {
    console.error('saveGiftCode error:', err);
    throw err;
  }
}

// Delete or disable a gift/promo code
export async function deleteGiftCode(codeString) {
  try {
    const cleanCode = codeString.trim().toUpperCase();
    const currentCodes = await getGiftCodes();
    const filtered = currentCodes.filter(c => c.code !== cleanCode);
    await updateAdminSettings({ gift_codes: filtered });
    return true;
  } catch (err) {
    console.error('deleteGiftCode error:', err);
    return false;
  }
}

// Validate and apply a gift or promo code
export async function validateAndApplyGiftCode(codeString, targetMerchantId = null, targetOrderId = null, originalAmount = 499) {
  try {
    if (!codeString) return { valid: false, message: 'Please enter a code' };
    const cleanCode = codeString.trim().toUpperCase().replace(/\s+/g, '');
    const codes = await getGiftCodes();
    const codeObj = codes.find(c => c.code === cleanCode);

    if (!codeObj) {
      return { valid: false, message: 'Invalid gift or promo code' };
    }

    if (!codeObj.active) {
      return { valid: false, message: 'This code is no longer active' };
    }

    if (codeObj.expires_at && new Date(codeObj.expires_at) < new Date()) {
      return { valid: false, message: 'This code has expired' };
    }

    if (codeObj.max_uses && codeObj.times_used >= codeObj.max_uses) {
      return { valid: false, message: 'This code has reached its maximum redemption limit' };
    }

    const isFree = codeObj.discount_type === 'free' || codeObj.discount_value >= originalAmount;
    let discountedAmount = originalAmount;
    let discount = 0;

    if (isFree) {
      discountedAmount = 0;
      discount = originalAmount;
    } else {
      discount = Math.min(originalAmount, codeObj.discount_value);
      discountedAmount = Math.max(0, originalAmount - discount);
    }

    // If 100% free and merchantId is provided, activate subscription immediately!
    if (isFree && targetMerchantId) {
      const days = codeObj.plan_duration_days || 30;
      await modifyMerchantSubscription(targetMerchantId, {
        action: 'extend',
        days,
        planType: codeObj.plan_type || `gift_${days}day`,
        note: `Gift code ${cleanCode} redeemed`
      });

      // Increment times_used on code
      codeObj.times_used = (codeObj.times_used || 0) + 1;
      const updatedCodes = codes.map(c => c.code === cleanCode ? codeObj : c);
      await updateAdminSettings({ gift_codes: updatedCodes });

      // If order ID provided, mark order as verified
      if (targetOrderId) {
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'verified',
            amount: 0,
            note: `GiftCode_${cleanCode}`,
            verified_at: new Date().toISOString()
          })
          .eq('id', targetOrderId);
      }

      return {
        valid: true,
        isFree: true,
        discountedAmount: 0,
        discount: originalAmount,
        code: codeObj,
        daysGranted: days,
        message: `Success! Gift code redeemed. ${days} days subscription activated!`
      };
    }

    return {
      valid: true,
      isFree,
      discountedAmount,
      discount,
      code: codeObj,
      daysGranted: codeObj.plan_duration_days || 30,
      message: isFree 
        ? `100% Gift Code applied! Click activate to claim ${codeObj.plan_duration_days || 30} days free.` 
        : `Promo code applied! ₹${discount} discount granted.`
    };
  } catch (err) {
    console.error('validateAndApplyGiftCode error:', err);
    return { valid: false, message: err.message || 'Error verifying code' };
  }
}

// ─────────────────────────────────────────────────────────────
// Merchant Subscription Management
// ─────────────────────────────────────────────────────────────

export async function modifyMerchantSubscription(merchantId, { action, days = 30, status = 'active', planType = null, customExpiry = null, note = '' }) {
  try {
    if (!merchantId) throw new Error('Merchant ID is required');

    const { data: merchant, error: fetchErr } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, subscription_status, subscription_expires_at, setup_progress')
      .eq('id', merchantId)
      .single();

    if (fetchErr || !merchant) throw new Error('Merchant record not found');

    let baseDate = new Date();
    if (merchant.subscription_status === 'active' && merchant.subscription_expires_at) {
      const currentExp = new Date(merchant.subscription_expires_at);
      if (currentExp > baseDate) {
        baseDate = currentExp;
      }
    }

    let newExpiry;
    if (customExpiry) {
      newExpiry = new Date(customExpiry);
    } else {
      newExpiry = new Date(baseDate);
      newExpiry.setDate(newExpiry.getDate() + parseInt(days));
    }

    const nowIso = new Date().toISOString();
    const currentProgress = merchant.setup_progress || {};
    const updatedProgress = {
      ...currentProgress,
      subscription_activated_at: currentProgress.subscription_activated_at || nowIso,
      plan_type: planType || currentProgress.plan_type || `${days}day_extended`,
      last_modified_by_admin: nowIso,
      admin_note: note || `Extended by ${days} days`
    };

    let targetStatus = status;
    if (action === 'toggle_status') {
      targetStatus = merchant.subscription_status === 'active' ? 'inactive' : 'active';
    } else if (action === 'cancel') {
      targetStatus = 'inactive';
    } else if (action === 'extend' || action === 'activate') {
      targetStatus = 'active';
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('merchants')
      .update({
        subscription_status: targetStatus,
        subscription_expires_at: newExpiry.toISOString(),
        setup_progress: updatedProgress
      })
      .eq('id', merchantId)
      .select()
      .single();

    if (updateErr) throw updateErr;
    return updated;
  } catch (err) {
    console.error('modifyMerchantSubscription error:', err);
    throw err;
  }
}

