// Resolve merchant returns using the browser's URL parser before navigation.
export function getPaymentReturnUrl(callback, baseUrl) {
  if (typeof callback !== 'string' || !callback.trim()) return null;
  try {
    const url = new URL(callback, baseUrl);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}
