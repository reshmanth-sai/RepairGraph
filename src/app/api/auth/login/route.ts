import { NextRequest } from 'next/server';
import { loginSchema } from '@/server/validators/auth.validator';
import { loginUser } from '@/server/services/auth.service';
import { setAuthCookie } from '@/server/auth/cookies';
import { checkRateLimit } from '@/server/auth/rateLimit';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting on authentication attempts
    checkRateLimit(request, { maxRequests: 10, windowSeconds: 60 });

    const body = await request.json();
    const validated = loginSchema.parse(body);

    const result = await loginUser(validated);
    await setAuthCookie(result.token);

    // Browser session uses the secure HTTP-only cookie.
    // Omit raw JWT token unless client explicitly requested programmatic token access.
    const includeToken = request.nextUrl.searchParams.get('includeToken') === 'true';
    const responsePayload = includeToken ? result : { user: result.user };

    return jsonResponse(responsePayload, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
