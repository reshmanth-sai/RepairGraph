import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { updateDeviceSchema } from '@/server/validators/device.validator';
import {
  getDeviceById,
  updateDevice,
  deleteDevice,
} from '@/server/services/device.service';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;

    const device = await getDeviceById(id, auth.userId, auth.role);
    return jsonResponse(device);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateDeviceSchema.parse(body);

    const updated = await updateDevice(id, auth.userId, auth.role, validated);
    return jsonResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;

    const result = await deleteDevice(id, auth.userId, auth.role);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
