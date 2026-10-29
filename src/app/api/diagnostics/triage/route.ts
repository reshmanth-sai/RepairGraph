import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { diagnoseAndRecommend } from '@/server/engine';
import { DeviceCategory } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const instanceId = process.env.INSTANCE_ID || process.env.HOSTNAME || 'repairgraph-backend-local';
  const { searchParams } = new URL(request.url);

  const category = (searchParams.get('category') as DeviceCategory) || DeviceCategory.LAPTOP;
  const brand = searchParams.get('brand') || 'Dell';
  const model = searchParams.get('model') || 'XPS 15';
  const symptoms = searchParams.get('symptoms') || 'Screen flickering after water spill, device overheating';

  try {
    // 1. Fetch baseline active devices count from Neon PostgreSQL database
    const totalDevices = await prisma.device.count();

    // 2. Execute Tier 1 & Tier 2 Diagnostic & Decision Engine
    const decision = diagnoseAndRecommend(
      {
        id: 'triage-device-sim',
        category,
        brand,
        model,
        condition: 'GOOD',
        purchasePrice: 120000,
        currentValue: 65000,
        purchaseDate: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
      },
      symptoms
    );

    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          instance: instanceId,
          service: 'RepairGraph Rapid Hardware Triage',
          dbConnected: true,
          totalCatalogDevices: totalDevices,
          latencyMs,
          triage: {
            category,
            brand,
            model,
            action: decision.recommendedAction,
            repairabilityScore: decision.repairabilityScore,
            estimatedRepairCostMin: decision.estimatedCostMin,
            estimatedRepairCostMax: decision.estimatedCostMax,
            repairCostRatio: decision.scoring.repairCostRatio,
            economicScore: decision.economicScore,
            issueCategory: decision.signals.issueCategory,
            severity: decision.signals.severity,
          },
          timestamp: new Date().toISOString(),
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
    const message = error instanceof Error ? error.message : 'Triage processing failed';

    return NextResponse.json(
      {
        success: false,
        error: {
          instance: instanceId,
          message,
          latencyMs,
        },
      },
      {
        status: 500,
        headers: {
          'X-Backend-Instance': instanceId,
        },
      }
    );
  }
}
