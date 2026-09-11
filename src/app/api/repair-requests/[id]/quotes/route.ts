import { NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/middleware';
import { createQuoteSchema } from '@/server/validators/quote.validator';
import { createQuote, listQuotesForRequest } from '@/server/services/quote.service';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';
import { UserRole } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAuth(request);
    const { id: repairRequestId } = await context.params;

    const quotes = await listQuotesForRequest(repairRequestId, auth.userId, auth.role);
    return jsonResponse(quotes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Only REPAIRER or ADMIN can submit quotes
    const auth = requireRole(request, [UserRole.REPAIRER, UserRole.ADMIN]);
    const { id: repairRequestId } = await context.params;
    const body = await request.json();
    const validated = createQuoteSchema.parse(body);

    const quote = await createQuote(repairRequestId, auth.userId, validated);
    return jsonResponse(quote, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
