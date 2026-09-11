import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { updateReviewSchema } from '@/server/validators/review.validator';
import { updateReview, deleteReview } from '@/server/services/review.service';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateReviewSchema.parse(body);

    const updated = await updateReview(id, auth.userId, auth.role, validated);
    return jsonResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;

    const result = await deleteReview(id, auth.userId, auth.role);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
