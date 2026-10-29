import { NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/middleware';
import { UserRole } from '@prisma/client';
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
    // Restrict Update API to authorized domain roles: ADMIN (Supervisor) or REPAIRER (Technician)
    const auth = requireRole(request, [UserRole.ADMIN, UserRole.REPAIRER]);
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
    // Restrict Delete API strictly to ADMIN (Fleet Supervisor / Compliance Officer)
    const auth = requireRole(request, [UserRole.ADMIN]);
    const { id } = await context.params;

    const result = await deleteDevice(id, auth.userId, auth.role);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
