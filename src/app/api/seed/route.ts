import { NextRequest } from 'next/server';
import { seedDemoData } from '@/server/seed/demoSeed';
import { jsonResponse } from '@/server/utils/response';
import { handleApiError } from '@/server/errors/errorHandler';

export async function POST(request: NextRequest) {
  try {
    const reset = request.nextUrl.searchParams.get('reset') === 'true';
    const result = await seedDemoData({ resetDemoOnly: reset });
    return jsonResponse(result, 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const reset = request.nextUrl.searchParams.get('reset') === 'true';
    const result = await seedDemoData({ resetDemoOnly: reset });
    return jsonResponse(result, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
