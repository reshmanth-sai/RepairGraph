import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { createDeviceSchema } from '@/server/validators/device.validator';
import { createDevice, listDevices } from '@/server/services/device.service';
import { parsePaginationParams } from '@/server/utils/pagination';
import { jsonResponse, paginatedResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    const pagination = parsePaginationParams(searchParams);
    const category = searchParams.get('category') || undefined;

    const result = await listDevices(auth.userId, auth.role, pagination, category);

    return paginatedResponse(result.devices, {
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
    const validated = createDeviceSchema.parse(body);

    const device = await createDevice(auth.userId, validated);
    return jsonResponse(device, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
