import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { createRepairJobSchema } from '@/server/validators/repairJob.validator';
import { createRepairJobFromQuote } from '@/server/services/repairJob.service';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const body = await request.json();
    const validated = createRepairJobSchema.parse(body);

    const job = await createRepairJobFromQuote(validated.quoteId, auth.userId, auth.role);
    return jsonResponse(job, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
