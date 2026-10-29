import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const instanceId = process.env.INSTANCE_ID || process.env.HOSTNAME || 'repairgraph-backend-local';

  try {
    // Perform light database ping to verify connection pool health
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'ok',
          service: 'RepairGraph API',
          instance: instanceId,
          database: 'connected',
          latencyMs,
          uptime: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        },
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Backend-Instance': instanceId,
        },
      }
    );
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Database ping failed';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service health check failed',
          instance: instanceId,
          status: 'error',
          database: 'disconnected',
          latencyMs,
          details: message,
          timestamp: new Date().toISOString(),
        },
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Backend-Instance': instanceId,
        },
      }
    );
  }
}
