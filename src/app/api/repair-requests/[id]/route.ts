import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { updateRepairRequestSchema } from '@/server/validators/repairRequest.validator';
import {
  getRepairRequestById,
  updateRepairRequest,
  deleteRepairRequest,
} from '@/server/services/repairRequest.service';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;

    const repairRequest = await getRepairRequestById(id, auth.userId, auth.role);
    return jsonResponse(repairRequest);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateRepairRequestSchema.parse(body);

    const updated = await updateRepairRequest(id, auth.userId, auth.role, validated);
    return jsonResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;

    const result = await deleteRepairRequest(id, auth.userId, auth.role);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
