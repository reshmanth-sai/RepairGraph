import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { updateRepairerProfileSchema } from '@/server/validators/repairer.validator';
import {
  getRepairerById,
  updateRepairerProfile,
  deleteRepairerProfile,
} from '@/server/services/repairer.service';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const repairer = await getRepairerById(id);
    return jsonResponse(repairer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateRepairerProfileSchema.parse(body);

    const updated = await updateRepairerProfile(id, auth.userId, auth.role, validated);
    return jsonResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;

    const result = await deleteRepairerProfile(id, auth.userId, auth.role);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
