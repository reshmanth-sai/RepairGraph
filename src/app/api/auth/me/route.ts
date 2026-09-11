import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { getCurrentUser } from '@/server/services/auth.service';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const user = await getCurrentUser(auth.userId);
    return jsonResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}
