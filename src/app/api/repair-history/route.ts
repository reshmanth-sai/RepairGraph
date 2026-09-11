import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { listRepairHistory } from '@/server/services/repairHistory.service';
import { parsePaginationParams } from '@/server/utils/pagination';
import { paginatedResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const pagination = parsePaginationParams(searchParams);
    const deviceId = searchParams.get('deviceId') || undefined;

    const result = await listRepairHistory(auth.userId, auth.role, pagination, deviceId);

    return paginatedResponse(result.history, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
