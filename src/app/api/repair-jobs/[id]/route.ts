import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { updateRepairJobStatusSchema } from '@/server/validators/repairJob.validator';
import {
  getRepairJobById,
  updateRepairJobStatus,
} from '@/server/services/repairJob.service';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;

    const job = await getRepairJobById(id, auth.userId, auth.role);
    return jsonResponse(job);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateRepairJobStatusSchema.parse(body);

    const updated = await updateRepairJobStatus(id, auth.userId, auth.role, validated);
    return jsonResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
