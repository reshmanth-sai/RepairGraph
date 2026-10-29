import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { generateBase32Secret, getTotpAuthUrl } from '@/server/auth/totp';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const secret = generateBase32Secret();
    const otpAuthUrl = getTotpAuthUrl(auth.email, secret, 'RepairGraph');

    return jsonResponse({
      success: true,
      data: {
        userId: auth.userId,
        email: auth.email,
        secret,
        otpAuthUrl,
        instructions:
          'Enter this secret key manually into Google Authenticator or Microsoft Authenticator, or use the otpAuthUrl.',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
