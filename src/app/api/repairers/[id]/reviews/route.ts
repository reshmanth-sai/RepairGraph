import { NextRequest } from 'next/server';
import { listReviewsForRepairer } from '@/server/services/review.service';
import { parsePaginationParams } from '@/server/utils/pagination';
import { paginatedResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: repairerId } = await context.params;
    const pagination = parsePaginationParams(request.nextUrl.searchParams);

    const result = await listReviewsForRepairer(repairerId, pagination);

    return paginatedResponse(result.reviews, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
