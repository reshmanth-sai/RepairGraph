import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { evaluateRepairRequest } from '@/server/services/repairRequest.service';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(request);
    const { id } = await params;
    const result = await evaluateRepairRequest(id, auth.userId, auth.role);
    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
