/**
 * Sanitizes and validates internal redirect URLs to prevent Open Redirect (CWE-601).
 * Rejects external domains, protocol-relative URLs, schemes (javascript:, http:),
 * backslashes, and control characters.
 */
export function getSafeRedirect(raw: string | null | undefined): string {
  if (!raw) return '/';

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return '/';
  }

  // Must begin with a single slash
  if (!decoded.startsWith('/')) {
    return '/';
  }

  // Reject protocol-relative '//evil.com'
  if (decoded.startsWith('//')) {
    return '/';
  }

  // Reject backslash variations '/\evil.com' or '/\\evil.com'
  if (decoded.startsWith('/\\') || decoded.includes('\\')) {
    return '/';
  }

  // Reject colon before query/hash to prevent schema injection (/javascript:...)
  const pathPart = decoded.split(/[?#]/)[0];
  if (pathPart.includes(':')) {
    return '/';
  }

  // Prevent redirect loops to login/register
  if (pathPart === '/login' || pathPart === '/register') {
    return '/';
  }

  // Reject CRLF or control characters
  if (/[\r\n\t\0]/.test(decoded)) {
    return '/';
  }

  return decoded;
}
