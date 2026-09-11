import { NextRequest } from 'next/server';
import { requireRole } from '@/server/auth/middleware';
import { createRepairerProfileSchema } from '@/server/validators/repairer.validator';
import {
  createRepairerProfile,
  listRepairers,
} from '@/server/services/repairer.service';
import { parsePaginationParams } from '@/server/utils/pagination';
import { jsonResponse, paginatedResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pagination = parsePaginationParams(searchParams);
    const status = searchParams.get('verificationStatus') || undefined;

    const result = await listRepairers(pagination, status);

    return paginatedResponse(result.repairers, {
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
    const auth = requireRole(request, [UserRole.REPAIRER, UserRole.ADMIN]);
    const body = await request.json();
    const validated = createRepairerProfileSchema.parse(body);

    const profile = await createRepairerProfile(auth.userId, validated);
    return jsonResponse(profile, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
