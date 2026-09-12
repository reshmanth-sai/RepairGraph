import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import {
  createRepairJobSchema,
  listRepairJobsQuerySchema,
} from '@/server/validators/repairJob.validator';
import {
  createRepairJobFromQuote,
  listRepairJobs,
} from '@/server/services/repairJob.service';
import { parsePaginationParams } from '@/server/utils/pagination';
import { jsonResponse, paginatedResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const pagination = parsePaginationParams(searchParams);

    const statusParam = searchParams.get('status') || undefined;
    const validatedQuery = listRepairJobsQuerySchema.parse({
      status: statusParam,
    });

    const result = await listRepairJobs(
      auth.userId,
      auth.role,
      pagination,
      validatedQuery.status
    );

    return paginatedResponse(result.jobs, {
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
    const validated = createRepairJobSchema.parse(body);

    const job = await createRepairJobFromQuote(validated.quoteId, auth.userId, auth.role);
    return jsonResponse(job, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
