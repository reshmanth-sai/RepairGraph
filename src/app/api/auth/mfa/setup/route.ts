import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { generateBase32Secret, getTotpAuthUrl } from '@/server/auth/totp';
import QRCode from 'qrcode';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const secret = generateBase32Secret();
    const otpAuthUrl = getTotpAuthUrl(auth.email, secret, 'RepairGraph');
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

    return jsonResponse({
      success: true,
      data: {
        userId: auth.userId,
        email: auth.email,
        secret,
        otpAuthUrl,
        qrCodeDataUrl,
        instructions:
          'Scan this QR code with Google Authenticator or Microsoft Authenticator, or manually enter the base32 secret.',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

