/**
 * Lightweight sliding-window rate limiter for Next.js API routes.
 * Prevents credential brute-forcing, spam, and denial-of-service attempts.
 */

const tracker = new Map();

// Periodic cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (now > record.resetTime) {
        tracker.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Check if a request exceeds the allowed rate limit.
 * @param {string} identifier - Unique key, e.g. IP address or client identifier
 * @param {number} limit - Maximum allowed requests in window
 * @param {number} windowMs - Window duration in milliseconds (default 60s)
 * @returns {{ allowed: boolean, remaining: number, resetInSeconds: number }}
 */
export function checkRateLimit(identifier, limit = 20, windowMs = 60 * 1000) {
  const now = Date.now();
  const record = tracker.get(identifier);

  if (!record || now > record.resetTime) {
    tracker.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}

/**
 * Extract client IP address from incoming Next.js request headers.
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  // 1. Cloudflare True Client IP (Tamper-proof if behind Cloudflare)
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  // 2. Vercel Trusted Edge Proxy Client IP
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0].trim();

  // 3. Standard Reverse Proxy IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}
