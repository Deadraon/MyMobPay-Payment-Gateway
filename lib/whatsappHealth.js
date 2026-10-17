/**
 * ─────────────────────────────────────────────────────────────
 * WhatsApp Delivery Health Monitor & Dynamic Circuit Breaker
 * ─────────────────────────────────────────────────────────────
 * Observes delivery failures across individual users and the entire
 * system. When multiple failures or single-user errors occur,
 * automatically switches the primary authentication rail on the
 * login screen to Email OTP until WhatsApp rail recovers.
 */

import { isWhatsAppConfigured } from './whatsapp.js';

const GLOBAL_FAILURE_THRESHOLD = 2; // 2 consecutive failures across users trips global switch
const USER_FAILURE_THRESHOLD = 1;   // 1 failure for a single user triggers instant email switch
const COOLDOWN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes cooldown before auto-recovering

let consecutiveFailures = 0;
let lastFailureTime = 0;
let lastFailureReason = '';
let isCircuitTripped = false;
let trippedUntil = 0;

const userFailures = new Map(); // cleanPhone -> { count, lastFailedAt }

// Auto-cleanup user failure records older than 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [phone, record] of userFailures.entries()) {
      if (now - record.lastFailedAt > 30 * 60 * 1000) {
        userFailures.delete(phone);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Record a successful WhatsApp OTP delivery
 */
export function recordWhatsAppSuccess(phone = '') {
  consecutiveFailures = 0;
  isCircuitTripped = false;
  trippedUntil = 0;
  if (phone) {
    userFailures.delete(phone.replace(/\D/g, ''));
  }
}

/**
 * Record a WhatsApp OTP delivery failure
 */
export function recordWhatsAppFailure(phone = '', errorReason = 'WhatsApp delivery failed') {
  const now = Date.now();
  consecutiveFailures += 1;
  lastFailureTime = now;
  lastFailureReason = String(errorReason || 'Gateway timeout / unreachable').slice(0, 150);

  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  let userCount = 1;
  if (cleanPhone) {
    const existing = userFailures.get(cleanPhone) || { count: 0, lastFailedAt: 0 };
    userCount = existing.count + 1;
    userFailures.set(cleanPhone, { count: userCount, lastFailedAt: now });
  }

  // Check if global failure threshold reached
  if (consecutiveFailures >= GLOBAL_FAILURE_THRESHOLD) {
    isCircuitTripped = true;
    trippedUntil = now + COOLDOWN_WINDOW_MS;
    console.warn(`[WA HEALTH CIRCUIT] 🚨 WhatsApp OTP marked DEGRADED globally (${consecutiveFailures} consecutive failures: ${lastFailureReason}). Defaulting login screen to Email OTP for 15 minutes.`);
  }

  return {
    consecutiveFailures,
    globalTripped: isCircuitTripped,
    userTripped: userCount >= USER_FAILURE_THRESHOLD,
    trippedUntil,
    reason: lastFailureReason,
  };
}

/**
 * Check current health of WhatsApp OTP rail
 */
export function getWhatsAppHealthStatus(phone = '') {
  const configured = isWhatsAppConfigured();
  if (!configured) {
    return {
      operational: false,
      isDegraded: true,
      primaryOption: 'email',
      reason: 'WhatsApp API not configured',
      consecutiveFailures,
    };
  }

  const now = Date.now();

  // Check global circuit breaker
  if (isCircuitTripped) {
    if (now < trippedUntil) {
      return {
        operational: false,
        isDegraded: true,
        primaryOption: 'email',
        reason: lastFailureReason || 'WhatsApp delivery experiencing service interruption',
        secondsRemaining: Math.ceil((trippedUntil - now) / 1000),
        consecutiveFailures,
      };
    }

    // Cooldown passed: attempt auto-recovery
    isCircuitTripped = false;
    consecutiveFailures = 0;
    console.log('[WA HEALTH CIRCUIT] 🔄 Cooldown expired. Testing recovery of WhatsApp OTP as primary option.');
  }

  // Check if specific user has had repeated failures
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  if (cleanPhone) {
    const userRec = userFailures.get(cleanPhone);
    if (userRec && (now - userRec.lastFailedAt < 15 * 60 * 1000) && userRec.count >= USER_FAILURE_THRESHOLD) {
      return {
        operational: true, // system is up, but this specific user has delivery issues
        isDegraded: false,
        userDegraded: true,
        primaryOption: 'email',
        reason: 'WhatsApp delivery failed previously for this number',
        consecutiveFailures,
      };
    }
  }

  return {
    operational: true,
    isDegraded: false,
    primaryOption: 'whatsapp',
    consecutiveFailures,
  };
}

/**
 * Manually reset health status
 */
export function resetWhatsAppHealth() {
  consecutiveFailures = 0;
  isCircuitTripped = false;
  trippedUntil = 0;
  lastFailureReason = '';
  userFailures.clear();
}
