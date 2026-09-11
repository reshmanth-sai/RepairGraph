import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { createRepairRequestSchema } from '@/server/validators/repairRequest.validator';
import {
  createRepairRequest,
  listRepairRequests,
} from '@/server/services/repairRequest.service';
import { parsePaginationParams } from '@/server/utils/pagination';
import { jsonResponse, paginatedResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const pagination = parsePaginationParams(searchParams);
    const status = searchParams.get('status') || undefined;

    const result = await listRepairRequests(auth.userId, auth.role, pagination, status);

    return paginatedResponse(result.requests, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const body = await request.json();
    const validated = createRepairRequestSchema.parse(body);

    const newRequest = await createRepairRequest(auth.userId, validated);
    return jsonResponse(newRequest, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
