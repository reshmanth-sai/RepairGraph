import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { updateQuoteStatusSchema } from '@/server/validators/quote.validator';
import { updateQuoteStatus, deleteQuote } from '@/server/services/quote.service';
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
    const validated = updateQuoteStatusSchema.parse(body);

    const updated = await updateQuoteStatus(id, auth.userId, auth.role, validated);
    return jsonResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id } = await context.params;

    const result = await deleteQuote(id, auth.userId, auth.role);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
