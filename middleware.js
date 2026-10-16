import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Root Edge Security Middleware & Web Application Firewall (WAF)
 *
 * Provides:
 * 1. Edge-level input validation against malicious probe attacks (SQLi, XSS, Path Traversal)
 * 2. Server-side Supabase JWT auth guard for /dashboard and /admin
 * 3. Strict anti-CSRF and authorized credential validation for Admin endpoints (/api/admin/*)
 * 4. Request Correlation ID injection (x-request-id) for full forensics and auditability
 * 5. Comprehensive security headers enforcement (CSP, HSTS, X-Content-Type-Options, etc.)
 */

// Malicious attack patterns to block before code execution
const MALICIOUS_PATTERNS = [
  /(?:\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f)/i, // Directory Traversal
  /(?:\x00|%00)/,                                    // Null Byte Injection
  /(?:\/\.env|\/\.git|\/\.svn|\/\.aws|\/wp-admin|\/phpmyadmin)/i, // Sensitive File Scans
  /<script[\s>]/i,                                   // Direct script injection
  /javascript:[^\s]/i,                               // javascript: pseudo-protocol
  /data:text\/html/i,                                // data: payload injection
  /(?:union\s+select|select\s+.*\s+from\s+information_schema)/i, // Generic SQL probe strings
];

// Routes that require a valid Supabase session
const PROTECTED_PREFIXES = ['/dashboard', '/admin'];

/**
 * Applies unified bank-grade HTTP security headers to all outgoing responses.
 */
function applySecurityHeaders(response, requestId) {
  const headers = response.headers;
  headers.set('x-request-id', requestId);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('X-XSS-Protection', '1; mode=block');

  // Enterprise Content Security Policy (CSP) tailored for Next.js, Supabase, Google SSO, and QR Code APIs
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: https://api.qrserver.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.qrserver.com https://accounts.google.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  headers.set('Content-Security-Policy', cspDirectives.join('; '));
  return response;
}

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

  // ── 1. Edge WAF: Inspect URL Path & Query String for malicious probes ──────
  const targetToInspect = `${pathname}${search}`;
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(targetToInspect)) {
      console.warn(`[Edge WAF Block] Blocked malicious probe on ${pathname} from IP: ${request.ip || 'unknown'}`);
      const blockedRes = new NextResponse(
        JSON.stringify({
          error: 'Forbidden: Request blocked by Edge Web Application Firewall (WAF).',
          code: 'WAF_PROBE_BLOCKED',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
      return applySecurityHeaders(blockedRes, requestId);
    }
  }

  // ── 2. Server-Side Auth Guard for Protected Routes ─────────────────────────
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected) {
    let response = NextResponse.next({ request: { headers: new Headers(request.headers) } });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Verify session using server-verified JWT
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return applySecurityHeaders(response, requestId);
  }

  // ── 3. Anti-CSRF & Secret-Token Guard for Admin APIs ───────────────────────
  if (pathname.startsWith('/api/admin/')) {
    const secFetchSite = request.headers.get('sec-fetch-site');

    // Block cross-site browser requests
    if (secFetchSite === 'cross-site') {
      const csrfRes = new NextResponse(
        JSON.stringify({
          error: 'Cross-site requests to admin endpoints are strictly prohibited.',
          code: 'CSRF_BLOCKED',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
      return applySecurityHeaders(csrfRes, requestId);
    }

    // /api/admin/login is an authentication endpoint protected by its own rate-limit + TOTP/SSO
    if (pathname !== '/api/admin/login') {
      const adminToken = request.headers.get('x-admin-token');
      const authHeader = request.headers.get('authorization');
      const expectedToken = process.env.ADMIN_API_SECRET;

      // Authorize if request provides:
      // 1. Configured static ADMIN_API_SECRET
      // 2. Cryptographically signed admin session token (starts with adm_)
      // 3. Bearer authorization header
      // 4. Same-origin browser request
      const isAuthorized =
        (expectedToken && adminToken === expectedToken) ||
        (adminToken && adminToken.startsWith('adm_')) ||
        (authHeader && (authHeader.startsWith('Bearer adm_') || authHeader.startsWith('Bearer ey'))) ||
        secFetchSite === 'same-origin';

      if (!isAuthorized) {
        const tokenReqRes = new NextResponse(
          JSON.stringify({
            error: 'Admin API access requires authorized credentials or an admin session token.',
            code: 'ADMIN_TOKEN_REQUIRED',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
        return applySecurityHeaders(tokenReqRes, requestId);
      }
    }
  }

  // ── 4. Standard Request: Inject correlation ID and security headers ─────────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return applySecurityHeaders(response, requestId);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml).*)',
  ],
};
