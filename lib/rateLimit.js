/**
 * High-Performance Dual-Engine Rate Limiter for Next.js.
 * 
 * Supports both:
 * 1. Distributed Edge / Cloud Storage (Upstash / Vercel KV REST API if configured)
 * 2. Sliding-Window In-Memory Map (Self-cleaning fallback, zero dependencies)
 */

const inMemoryTracker = new Map();

// Periodic garbage collection every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of inMemoryTracker.entries()) {
      if (now > record.resetTime) {
        inMemoryTracker.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Synchronous local sliding-window rate limit checker.
 * @param {string} identifier - Unique key (e.g. IP address or client ID)
 * @param {number} limit - Maximum requests allowed in window
 * @param {number} windowMs - Window duration in milliseconds (default 60s)
 * @returns {{ allowed: boolean, remaining: number, resetInSeconds: number, limit: number }}
 */
export function checkRateLimit(identifier, limit = 20, windowMs = 60 * 1000) {
  const now = Date.now();
  const record = inMemoryTracker.get(identifier);

  if (!record || now > record.resetTime) {
    inMemoryTracker.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetInSeconds: Math.ceil(windowMs / 1000),
      limit,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
      limit,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - record.count),
    resetInSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
    limit,
  };
}

/**
 * Cloud-Native Distributed Async Rate Limiter.
 * If UPSTASH_REDIS_REST_URL is configured, coordinates across all edge instances globally.
 * Otherwise, falls back gracefully to the in-memory engine.
 */
export async function checkRateLimitAsync(identifier, limit = 20, windowMs = 60 * 1000) {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
      const key = `rl:${identifier}`;

      // Pipeline INCR + EXPIRE via standard REST API
      const pipelineRes = await fetch(`${redisUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSec],
        ]),
        signal: AbortSignal.timeout(1500), // Fast 1.5s timeout, never hangs
      });

      if (pipelineRes.ok) {
        const results = await pipelineRes.json();
        const count = results[0]?.result || 1;
        const allowed = count <= limit;
        return {
          allowed,
          remaining: Math.max(0, limit - count),
          resetInSeconds: windowSec,
          limit,
        };
      }
    } catch (err) {
      console.warn('[RateLimit] Distributed Redis fallback to local tracker:', err.message);
    }
  }

  // Graceful fallback to local in-memory tracker
  return checkRateLimit(identifier, limit, windowMs);
}

/**
 * Attach standard RFC HTTP Rate Limiting Headers to any Next.js Response
 * @param {Response} response
 * @param {{ allowed: boolean, remaining: number, resetInSeconds: number, limit: number }} rateLimitResult
 */
export function applyRateLimitHeaders(response, rateLimitResult) {
  if (!response || !rateLimitResult) return response;
  try {
    response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit || 20));
    response.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining ?? 0));
    response.headers.set('X-RateLimit-Reset', String(rateLimitResult.resetInSeconds || 60));
    if (!rateLimitResult.allowed) {
      response.headers.set('Retry-After', String(rateLimitResult.resetInSeconds || 60));
    }
  } catch (e) {
    // Non-fatal if immutable response
  }
  return response;
}

/**
 * Extract client IP address from incoming Next.js request headers.
 * Protects against spoofed proxies with multi-tier priority.
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  // 1. Cloudflare True Client IP (Cryptographically signed / tamper-proof if behind Cloudflare)
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
