import { NextResponse } from 'next/server';

/**
 * Root Edge Security Middleware & Web Application Firewall (WAF)
 * 
 * Provides:
 * 1. Edge-level input validation against malicious probe attacks (SQLi, XSS, Path Traversal)
 * 2. Strict anti-CSRF isolation for Admin endpoints (/api/admin/*)
 * 3. Request Correlation ID injection (x-request-id) for full forensics and auditability
 * 4. Comprehensive security headers enforcement
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

export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // 1. Edge WAF: Inspect URL Path & Query String for malicious probes
  const targetToInspect = `${pathname}${search}`;
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(targetToInspect)) {
      console.warn(`[Edge WAF Block] Blocked malicious probe pattern on ${pathname} from IP: ${request.ip || 'unknown'}`);
      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden: Request blocked by Edge Web Application Firewall (WAF).',
          code: 'WAF_PROBE_BLOCKED',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // 2. Anti-CSRF & Cross-Site Origin Guard for Protected Admin APIs
  if (pathname.startsWith('/api/admin/')) {
    const secFetchSite = request.headers.get('sec-fetch-site');
    // Block cross-site browser requests (e.g. from malicious phishing websites)
    if (secFetchSite === 'cross-site') {
      return new NextResponse(
        JSON.stringify({
          error: 'Cross-site requests to admin endpoints are strictly prohibited.',
          code: 'CSRF_BLOCKED',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // 3. Generate Forensic Correlation ID (x-request-id)
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;

  // 4. Forward with request ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 5. Inject Security Headers on every outgoing HTTP response
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
