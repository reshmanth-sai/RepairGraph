import { prisma } from '../db';
import { hashPassword } from '../auth/password';
import {
  UserRole,
  DeviceCategory,
  DeviceCondition,
  UrgencyLevel,
  RequestStatus,
  RecommendedAction,
  VerificationStatus,
  QuoteStatus,
  JobStatus,
} from '@prisma/client';

export interface SeedResult {
  usersCreated: number;
  repairersCreated: number;
  devicesCreated: number;
  requestsCreated: number;
  message: string;
}

/**
 * Seeds or ensures demo accounts and sample data exist in the database.
 * Safe and idempotent: will not delete or overwrite real user data.
 */
export async function seedDemoData(options?: { resetDemoOnly?: boolean }): Promise<SeedResult> {
  const defaultPassword = 'Password123!';
  const defaultPasswordHash = await hashPassword(defaultPassword);

  if (options?.resetDemoOnly) {
    // Delete existing demo records cleanly
    const demoUsers = await prisma.user.findMany({
      where: { email: { endsWith: '@repairgraph.internal' } },
      select: { id: true },
    });
    const demoUserIds = demoUsers.map((u) => u.id);

    if (demoUserIds.length > 0) {
      await prisma.review.deleteMany({ where: { userId: { in: demoUserIds } } });
      await prisma.repairHistory.deleteMany({
        where: { device: { userId: { in: demoUserIds } } },
      });
      await prisma.repairJob.deleteMany({
        where: { repairRequest: { userId: { in: demoUserIds } } },
      });
      await prisma.quote.deleteMany({
        where: { repairRequest: { userId: { in: demoUserIds } } },
      });
      await prisma.repairRecommendation.deleteMany({
        where: { repairRequest: { userId: { in: demoUserIds } } },
      });
      await prisma.diagnosis.deleteMany({
        where: { repairRequest: { userId: { in: demoUserIds } } },
      });
      await prisma.repairRequest.deleteMany({
        where: { userId: { in: demoUserIds } },
      });
      await prisma.repairerSpecialization.deleteMany({
        where: { repairer: { userId: { in: demoUserIds } } },
      });
      await prisma.repairer.deleteMany({
        where: { userId: { in: demoUserIds } },
      });
      await prisma.device.deleteMany({
        where: { userId: { in: demoUserIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: demoUserIds } },
      });
    }
  }

  let usersCreated = 0;
  let repairersCreated = 0;
  let devicesCreated = 0;
  let requestsCreated = 0;

  // 1. Ensure Demo Users exist
  let customerUser = await prisma.user.findUnique({
    where: { email: 'consumer@repairgraph.internal' },
  });
  if (!customerUser) {
    customerUser = await prisma.user.create({
      data: {
        name: 'Dev Consumer (Sample User)',
        email: 'consumer@repairgraph.internal',
        passwordHash: defaultPasswordHash,
        role: UserRole.USER,
        phone: '+91 98765 43210',
      },
    });
    usersCreated++;
  }

  let repairerUser = await prisma.user.findUnique({
    where: { email: 'technician@repairgraph.internal' },
  });
  if (!repairerUser) {
    repairerUser = await prisma.user.create({
      data: {
        name: 'Vikram Joshi (Demo Technician)',
        email: 'technician@repairgraph.internal',
        passwordHash: defaultPasswordHash,
        role: UserRole.REPAIRER,
        phone: '+91 98765 12345',
      },
    });
    usersCreated++;
  }

  let secondRepairerUser = await prisma.user.findUnique({
    where: { email: 'rohan@repairgraph.internal' },
  });
  if (!secondRepairerUser) {
    secondRepairerUser = await prisma.user.create({
      data: {
        name: 'Rohan Deshmukh (Demo Technician)',
        email: 'rohan@repairgraph.internal',
        passwordHash: defaultPasswordHash,
        role: UserRole.REPAIRER,
        phone: '+91 98765 99887',
      },
    });
    usersCreated++;
  }

  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@repairgraph.internal' },
  });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        name: 'Platform Administrator (Demo)',
        email: 'admin@repairgraph.internal',
        passwordHash: defaultPasswordHash,
        role: UserRole.ADMIN,
        phone: '+91 98765 00000',
      },
    });
    usersCreated++;
  }

  // 2. Ensure Repairer Profiles exist
  let repairer1 = await prisma.repairer.findUnique({
    where: { userId: repairerUser.id },
  });
  if (!repairer1) {
    repairer1 = await prisma.repairer.create({
      data: {
        userId: repairerUser.id,
        businessName: 'Precision Silicon Labs (Demo Entity)',
        description:
          'Independent component-level micro-soldering and thermal diagnostics lab in Bengaluru.',
        address: '142, 12th Main Road, Indiranagar, Bengaluru, Karnataka 560038',
        latitude: 12.9784,
        longitude: 77.6408,
        verificationStatus: VerificationStatus.VERIFIED,
        rating: 4.9,
        totalJobs: 1,
        specializations: {
          create: [
            {
              deviceCategory: DeviceCategory.LAPTOP,
              brand: 'Lenovo',
              serviceType: 'Thermal Module & Fan Servicing',
            },
            {
              deviceCategory: DeviceCategory.LAPTOP,
              brand: 'Apple',
              serviceType: 'Battery & Logic Board Micro-soldering',
            },
          ],
        },
      },
    });
    repairersCreated++;
  }

  let repairer2 = await prisma.repairer.findUnique({
    where: { userId: secondRepairerUser.id },
  });
  if (!repairer2) {
    repairer2 = await prisma.repairer.create({
      data: {
        userId: secondRepairerUser.id,
        businessName: 'Apex Device Diagnostics (Demo Entity)',
        description:
          'Multi-brand smartphone display and power subsystem service workshop in Koramangala.',
        address: '88, 80 Feet Road, Koramangala 4th Block, Bengaluru, Karnataka 560034',
        latitude: 12.9345,
        longitude: 77.6256,
        verificationStatus: VerificationStatus.VERIFIED,
        rating: 4.7,
        totalJobs: 0,
        specializations: {
          create: [
            {
              deviceCategory: DeviceCategory.SMARTPHONE,
              brand: 'Google',
              serviceType: 'OLED Display & Fingerprint Sensor Calibration',
            },
            {
              deviceCategory: DeviceCategory.SMARTPHONE,
              brand: 'Apple',
              serviceType: 'Battery Replacement',
            },
          ],
        },
      },
    });
    repairersCreated++;
  }

  // 3. Ensure Devices exist for customerUser
  const existingDevices = await prisma.device.findMany({
    where: { userId: customerUser.id },
  });

  let thinkpad = existingDevices.find((d) => d.serialNumber === 'PF-3B79K2');
  if (!thinkpad) {
    thinkpad = await prisma.device.create({
      data: {
        userId: customerUser.id,
        category: DeviceCategory.LAPTOP,
        brand: 'Lenovo',
        model: 'ThinkPad T14 Gen 3',
        serialNumber: 'PF-3B79K2',
        purchaseDate: new Date('2023-04-12'),
        purchasePrice: 98000,
        warrantyExpiry: new Date('2024-04-12'),
        currentValue: 56000,
        condition: DeviceCondition.GOOD,
      },
    });
    devicesCreated++;
  }

  let macbook = existingDevices.find((d) => d.serialNumber === 'C02G879MD6NV');
  if (!macbook) {
    macbook = await prisma.device.create({
      data: {
        userId: customerUser.id,
        category: DeviceCategory.LAPTOP,
        brand: 'Apple',
        model: 'MacBook Air 13" (M2)',
        serialNumber: 'C02G879MD6NV',
        purchaseDate: new Date('2023-08-19'),
        purchasePrice: 114900,
        warrantyExpiry: new Date('2024-08-19'),
        currentValue: 72000,
        condition: DeviceCondition.DEGRADED,
      },
    });
    devicesCreated++;
  }

  if (!existingDevices.some((d) => d.serialNumber === '28191FDH30018G')) {
    await prisma.device.create({
      data: {
        userId: customerUser.id,
        category: DeviceCategory.SMARTPHONE,
        brand: 'Google',
        model: 'Pixel 7 Pro',
        serialNumber: '28191FDH30018G',
        purchaseDate: new Date('2023-01-15'),
        purchasePrice: 84999,
        warrantyExpiry: new Date('2024-01-15'),
        currentValue: 34000,
        condition: DeviceCondition.GOOD,
      },
    });
    devicesCreated++;
  }

  if (!existingDevices.some((d) => d.serialNumber === '5082194')) {
    await prisma.device.create({
      data: {
        userId: customerUser.id,
        category: DeviceCategory.HEADPHONES,
        brand: 'Sony',
        model: 'WH-1000XM5 Noise Canceling',
        serialNumber: '5082194',
        purchaseDate: new Date('2024-11-05'),
        purchasePrice: 29990,
        warrantyExpiry: new Date('2026-11-05'),
        currentValue: 22000,
        condition: DeviceCondition.EXCELLENT,
      },
    });
    devicesCreated++;
  }

  // 4. Ensure Active Repair Request for MacBook Air
  const existingMacbookReq = await prisma.repairRequest.findFirst({
    where: { deviceId: macbook.id, userId: customerUser.id },
  });

  if (!existingMacbookReq) {
    await prisma.repairRequest.create({
      data: {
        deviceId: macbook.id,
        userId: customerUser.id,
        description:
          'Chassis base swelling observed with slight trackpad elevation. Battery shuts off unexpectedly at 35% remaining charge.',
        urgency: UrgencyLevel.HIGH,
        status: RequestStatus.REQUESTED,
        diagnosis: {
          create: {
            issueCategory: 'Battery Degradation',
            possibleIssue:
              'Lithium-polymer pouch cell gas generation and internal impedance rise',
            confidence: 88,
            evidence: [
              'Trackpad elevation indicates physical battery pouch expansion',
              'Voltage drop below nominal under moderate CPU load',
              'Cycle count exceeding 800 cycles',
            ],
          },
        },
        recommendation: {
          create: {
            repairabilityScore: 58,
            economicScore: 88,
            recommendedAction: RecommendedAction.REPAIR,
            estimatedCostMin: 7500,
            estimatedCostMax: 11200,
            reasoning:
              'Battery replacement costs ~12% of fair market value (₹72,000). Component replacement prevents premature disposal and saves ₹60,000+ vs replacement laptop.',
          },
        },
      },
    });
    requestsCreated++;
  }

  // 5. Ensure Completed Repair Workflow for ThinkPad T14
  const existingThinkpadReq = await prisma.repairRequest.findFirst({
    where: { deviceId: thinkpad.id, userId: customerUser.id },
  });

  if (!existingThinkpadReq) {
    const thinkpadRequest = await prisma.repairRequest.create({
      data: {
        deviceId: thinkpad.id,
        userId: customerUser.id,
        description: 'Loud fan rattle and thermal shutdown during video encoding tasks.',
        urgency: UrgencyLevel.MEDIUM,
        status: RequestStatus.COMPLETED,
      },
    });
    requestsCreated++;

    // Quote 1 (Accepted)
    const quote1 = await prisma.quote.create({
      data: {
        repairRequestId: thinkpadRequest.id,
        repairerId: repairer1.id,
        estimatedCost: 3800,
        estimatedDays: 2,
        notes:
          'OEM Delta fan module replacement + Arctic MX-6 high-viscosity repasting + 6-month repair warranty.',
        status: QuoteStatus.ACCEPTED,
      },
    });

    // Quote 2 (Rejected)
    await prisma.quote.create({
      data: {
        repairRequestId: thinkpadRequest.id,
        repairerId: repairer2.id,
        estimatedCost: 4500,
        estimatedDays: 3,
        notes: 'Heatsink assembly replacement and clean.',
        status: QuoteStatus.REJECTED,
      },
    });

    // Completed Repair Job
    const job = await prisma.repairJob.create({
      data: {
        repairRequestId: thinkpadRequest.id,
        repairerId: repairer1.id,
        quoteId: quote1.id,
        status: JobStatus.COMPLETED,
        agreedCost: 3800,
        actualCost: 3800,
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        notes:
          'Delta blower fan (FRU 5H41B77239) mounted at 0.35Nm. Thermal junction peak stabilized at 68°C under Prime95 stress loop.',
      },
    });

    // Repair Passport History record
    await prisma.repairHistory.create({
      data: {
        deviceId: thinkpad.id,
        repairJobId: job.id,
        repairType: 'Thermal Module & Fan Replacement',
        issue: 'Fan bearing noise and thermal throttling under compute load.',
        partsReplaced: [
          'Delta Blower Fan Module (FRU 5H41B77239)',
          'Arctic MX-6 Thermal Compound (0.8g)',
        ],
        cost: 3800,
        repairerId: repairer1.id,
        repairDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        notes:
          'Hardware maintenance manual procedure followed. Passed full hardware diagnostics.',
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });

    // Customer Review
    await prisma.review.create({
      data: {
        repairJobId: job.id,
        userId: customerUser.id,
        repairerId: repairer1.id,
        rating: 5,
        comment:
          'Excellent service. Laptop is quiet and runs at 65°C under sustained Blender renders. Provided genuine parts invoice.',
      },
    });
  }

  return {
    usersCreated,
    repairersCreated,
    devicesCreated,
    requestsCreated,
    message: 'Demo dataset provisioned successfully.',
  };
}
