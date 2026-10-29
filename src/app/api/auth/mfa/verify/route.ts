import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { verifyTotp } from '@/server/auth/totp';
import { signToken } from '@/server/auth/jwt';
import { setAuthCookie } from '@/server/auth/cookies';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';
import { AppError } from '@/server/errors/AppError';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const body = await request.json();
    const { code, secret } = body;

    if (!code || typeof code !== 'string') {
      throw AppError.badRequest('Missing 6-digit TOTP code from Google or Microsoft Authenticator');
    }

    if (!secret || typeof secret !== 'string') {
      throw AppError.badRequest('Missing TOTP secret key for validation');
    }

    const isValid = verifyTotp(secret, code);
    if (!isValid) {
      throw AppError.unauthenticated('Invalid or expired TOTP authenticator code. Codes rotate every 30 seconds.');
    }

    // Sign new JWT with elevated mfaVerified: true claim
    const updatedPayload = {
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
      name: auth.name,
      mfaVerified: true,
    };
    const newToken = signToken(updatedPayload);

    await setAuthCookie(newToken);

    return jsonResponse({
      success: true,
      data: {
        message: 'Multi-factor authentication (TOTP) verified successfully.',
        user: updatedPayload,
        token: newToken,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
