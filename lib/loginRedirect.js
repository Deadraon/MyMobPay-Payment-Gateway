export function getLoginRedirect(search, origin) {
  const fallback = '/dashboard';

  try {
    // URLSearchParams decodes the query value once, before URL validation.
    const redirect = new URLSearchParams(search).get('redirect');
    if (!redirect) return fallback;

    const destination = new URL(redirect, origin);
    if (
      !['http:', 'https:'].includes(destination.protocol) ||
      destination.origin !== origin ||
      destination.pathname.startsWith('/login')
    ) {
      return fallback;
    }

    // Keep the canonical absolute URL so a path starting with // stays same-origin.
    return destination.href;
  } catch {
    return fallback;
  }
}
