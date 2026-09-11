import { NextRequest } from 'next/server';
import { registerSchema } from '@/server/validators/auth.validator';
import { registerUser } from '@/server/services/auth.service';
import { setAuthCookie } from '@/server/auth/cookies';
import { checkRateLimit } from '@/server/auth/rateLimit';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting on registration attempts
    checkRateLimit(request, { maxRequests: 5, windowSeconds: 60 });

    const body = await request.json();
    const validated = registerSchema.parse(body);

    const result = await registerUser(validated);
    await setAuthCookie(result.token);

    // Omit raw token from browser response unless explicitly requested
    const includeToken = request.nextUrl.searchParams.get('includeToken') === 'true';
    const responsePayload = includeToken ? result : { user: result.user };

    return jsonResponse(responsePayload, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
