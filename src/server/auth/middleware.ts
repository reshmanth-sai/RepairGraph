import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { verifyToken, TokenPayload } from './jwt';
import { AUTH_COOKIE_NAME } from './cookies';
import { AppError } from '../errors/AppError';

export function extractAuthToken(request: NextRequest): string | null {
  // 1. Check HTTP-only cookie
  const cookieToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // 2. Check Authorization header: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

export function requireAuth(request: NextRequest): TokenPayload {
  const token = extractAuthToken(request);
  if (!token) {
    throw AppError.unauthenticated('Authentication required. Missing authorization token.');
  }

  const payload = verifyToken(token);
  if (!payload) {
    throw AppError.unauthenticated('Invalid or expired authentication session.');
  }

  return payload;
}

export function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): TokenPayload {
  const user = requireAuth(request);

  if (!allowedRoles.includes(user.role)) {
    throw AppError.forbidden(
      `Access denied. Requires one of roles: ${allowedRoles.join(', ')}`
    );
  }

  return user;
}
