// Keep legacy hostname and root-relative callbacks, but only return HTTP(S) URLs.
export function parseCallbackUrl(value, baseUrl) {
  if (typeof value !== 'string' || !value.trim()) return null;

  // URL parsers ignore these characters, including when embedded in a scheme.
  let target = value.trim().replace(/[\t\r\n]/g, '');
  if (!/^[a-z][a-z\d+.-]*:/i.test(target) && !target.startsWith('/')) {
    target = `https://${target}`;
  }

  try {
    const url = new URL(target, baseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

export function navigateToCallback(value, params = {}, replace = false) {
  if (typeof window === 'undefined') return false;
  const url = parseCallbackUrl(value, window.location.origin);
  if (!url) return false;

  for (const [key, value] of Object.entries(params)) {
    if (value != null) url.searchParams.set(key, value);
  }
  if (replace) window.location.replace(url.href);
  else window.location.href = url.href;
  return true;
}
