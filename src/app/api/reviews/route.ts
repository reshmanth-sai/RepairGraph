import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/middleware';
import { createReviewSchema } from '@/server/validators/review.validator';
import { createReview } from '@/server/services/review.service';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    const body = await request.json();
    const validated = createReviewSchema.parse(body);

    const review = await createReview(auth.userId, validated);
    return jsonResponse(review, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
