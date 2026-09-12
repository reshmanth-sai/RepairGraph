/**
 * Sanitizes user-facing error messages to ensure internal database implementation details,
 * Prisma errors, SQL traces, and system exceptions are never exposed to clients.
 */
export function sanitizeErrorMessage(
  err: unknown,
  fallback: string = 'An unexpected error occurred. Please try again.'
): string {
  if (!err) return fallback;
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : fallback;

  // Patterns that indicate internal ORM/DB/Server stack or syntax leaks
  const internalPatterns = [
    /prisma/i,
    /invocation/i,
    /stack trace/i,
    /unique constraint/i,
    /foreign key constraint/i,
    /econnrefused/i,
    /pg_hba/i,
    /syntax error/i,
    /table.*does not exist/i,
    /column.*does not exist/i,
    /null value in column/i,
    /internal server error/i,
    /select.*from/i,
    /insert into/i,
    /update.*set/i,
    /delete from/i,
  ];

  if (internalPatterns.some((pattern) => pattern.test(message))) {
    return fallback;
  }

  return message;
}

/**
 * Extracts all actionable, sanitized error messages from an error object or API error details.
 */
export function extractActionableErrors(
  err: unknown,
  fallback: string = 'An unexpected error occurred. Please try again.'
): string[] {
  if (!err) return [fallback];

  // If err is an ApiClientError or contains validation details
  if (
    typeof err === 'object' &&
    err !== null &&
    'details' in err &&
    Array.isArray((err as { details?: unknown[] }).details)
  ) {
    const details = (err as { details: Array<{ message?: string }> }).details;
    const messages = details
      .map((d) => (typeof d?.message === 'string' ? d.message : ''))
      .filter(Boolean)
      .map((m) => sanitizeErrorMessage(m, fallback));

    if (messages.length > 0) {
      return messages;
    }
  }

  return [sanitizeErrorMessage(err, fallback)];
}

