import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Root Edge Security Middleware & Web Application Firewall (WAF)
 *
 * Provides:
 * 1. Edge-level input validation against malicious probe attacks (SQLi, XSS, Path Traversal)
 * 2. Server-side auth guard for /dashboard and /admin (VULN-01 / VULN-02 fix)
 * 3. Strict anti-CSRF isolation for Admin endpoints (/api/admin/*)
 *    — now requires secret x-admin-token header in addition to sec-fetch-site (VULN-05 fix)
 * 4. Request Correlation ID injection (x-request-id) for full forensics and auditability
 * 5. Comprehensive security headers enforcement
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

export async function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // ── 1. Edge WAF: Inspect URL Path & Query String for malicious probes ──────
  const targetToInspect = `${pathname}${search}`;
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(targetToInspect)) {
      console.warn(`[Edge WAF Block] Blocked malicious probe on ${pathname} from IP: ${request.ip || 'unknown'}`);
      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden: Request blocked by Edge Web Application Firewall (WAF).',
          code: 'WAF_PROBE_BLOCKED',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // ── 2. Server-Side Auth Guard for Protected Routes (VULN-01 & VULN-02 fix) ─
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected) {
    // We need a mutable response to allow @supabase/ssr to refresh session cookies
    let response = NextResponse.next({ request: { headers: new Headers(request.headers) } });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

    // IMPORTANT: Always use getUser() (server-verified JWT), never getSession()
    // getSession() only reads cookies without verifying the JWT with Supabase servers.
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
      // Redirect unauthenticated users to login, preserving the intended destination
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Valid session — inject security headers and continue
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return response;
  }

  // ── 3. Anti-CSRF & Secret-Token Guard for Admin APIs (VULN-05 fix) ──────────
  if (pathname.startsWith('/api/admin/')) {
    const secFetchSite = request.headers.get('sec-fetch-site');
    const adminToken = request.headers.get('x-admin-token');
    const expectedToken = process.env.ADMIN_API_SECRET;

    // Block cross-site browser requests
    if (secFetchSite === 'cross-site') {
      return new NextResponse(
        JSON.stringify({
          error: 'Cross-site requests to admin endpoints are strictly prohibited.',
          code: 'CSRF_BLOCKED',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Block non-browser clients (curl, Python, etc.) that omit the admin secret
    if (expectedToken && adminToken !== expectedToken) {
      return new NextResponse(
        JSON.stringify({
          error: 'Admin API access requires a valid x-admin-token header.',
          code: 'ADMIN_TOKEN_REQUIRED',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // ── 4. Generate Forensic Correlation ID (x-request-id) ──────────────────────
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // ── 5. Inject Security Headers on every outgoing HTTP response ───────────────
  response.headers.set('x-request-id', requestId);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
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
