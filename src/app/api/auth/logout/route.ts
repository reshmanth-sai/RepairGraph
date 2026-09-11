import { clearAuthCookie } from '@/server/auth/cookies';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function POST() {
  try {
    await clearAuthCookie();
    return jsonResponse({ message: 'Successfully logged out' });
  } catch (error) {
    return handleApiError(error);
  }
}
