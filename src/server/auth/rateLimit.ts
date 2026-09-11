import { NextRequest } from 'next/server';
import { AppError } from '../errors/AppError';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale records periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (record.resetAt <= now) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function checkRateLimit(
  request: NextRequest,
  options: { maxRequests?: number; windowSeconds?: number } = {}
): void {
  const maxRequests = options.maxRequests ?? 15;
  const windowMs = (options.windowSeconds ?? 60) * 1000;

  // Extract client IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || '127.0.0.1';

  const now = Date.now();
  const existing = rateLimitMap.get(ip);

  if (!existing || existing.resetAt <= now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return;
  }

  if (existing.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    throw new AppError(
      429,
      'RATE_LIMIT_EXCEEDED',
      `Too many authentication attempts. Please try again in ${retryAfterSeconds} seconds.`
    );
  }

  existing.count += 1;
}
