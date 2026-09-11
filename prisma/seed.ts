import {
  PrismaClient,
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
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding RepairGraph Development Database ---');

  // Clean existing tables in dependency order
  await prisma.review.deleteMany();
  await prisma.repairHistory.deleteMany();
  await prisma.repairJob.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.repairRecommendation.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.repairRequest.deleteMany();
  await prisma.repairerSpecialization.deleteMany();
  await prisma.repairer.deleteMany();
  await prisma.device.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  const customerUser = await prisma.user.create({
    data: {
      name: 'Dev Consumer (Sample User)',
      email: 'consumer@repairgraph.internal',
      passwordHash: defaultPasswordHash,
      role: UserRole.USER,
      phone: '+91 98765 43210',
    },
  });

  const repairerUser = await prisma.user.create({
    data: {
      name: 'Vikram Joshi (Demo Technician)',
      email: 'technician@repairgraph.internal',
      passwordHash: defaultPasswordHash,
      role: UserRole.REPAIRER,
      phone: '+91 98765 12345',
    },
  });

  const secondRepairerUser = await prisma.user.create({
    data: {
      name: 'Rohan Deshmukh (Demo Technician)',
      email: 'rohan@repairgraph.internal',
      passwordHash: defaultPasswordHash,
      role: UserRole.REPAIRER,
      phone: '+91 98765 99887',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Platform Administrator (Demo)',
      email: 'admin@repairgraph.internal',
      passwordHash: defaultPasswordHash,
      role: UserRole.ADMIN,
      phone: '+91 98765 00000',
    },
  });

  console.log('Created 4 demonstration users.');

  // 2. Create Repairer Profiles
  const repairer1 = await prisma.repairer.create({
    data: {
      userId: repairerUser.id,
      businessName: 'Precision Silicon Labs (Demo Entity)',
      description: 'Independent component-level micro-soldering and thermal diagnostics lab in Bengaluru.',
      address: '142, 12th Main Road, Indiranagar, Bengaluru, Karnataka 560038',
      latitude: 12.9784,
      longitude: 77.6408,
      verificationStatus: VerificationStatus.VERIFIED,
      rating: 4.9,
      totalJobs: 1,
      specializations: {
        create: [
          { deviceCategory: DeviceCategory.LAPTOP, brand: 'Lenovo', serviceType: 'Thermal Module & Fan Servicing' },
          { deviceCategory: DeviceCategory.LAPTOP, brand: 'Apple', serviceType: 'Battery & Logic Board Micro-soldering' },
        ],
      },
    },
  });

  const repairer2 = await prisma.repairer.create({
    data: {
      userId: secondRepairerUser.id,
      businessName: 'Apex Device Diagnostics (Demo Entity)',
      description: 'Multi-brand smartphone display and power subsystem service workshop in Koramangala.',
      address: '88, 80 Feet Road, Koramangala 4th Block, Bengaluru, Karnataka 560034',
      latitude: 12.9345,
      longitude: 77.6256,
      verificationStatus: VerificationStatus.VERIFIED,
      rating: 4.7,
      totalJobs: 0,
      specializations: {
        create: [
          { deviceCategory: DeviceCategory.SMARTPHONE, brand: 'Google', serviceType: 'OLED Display & Fingerprint Sensor Calibration' },
          { deviceCategory: DeviceCategory.SMARTPHONE, brand: 'Apple', serviceType: 'Battery Replacement' },
        ],
      },
    },
  });

  console.log('Created 2 demonstration repairer profiles.');

  // 3. Create Devices for the Consumer
  const thinkpad = await prisma.device.create({
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

  const macbook = await prisma.device.create({
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

  console.log('Created 4 demonstration consumer devices.');

  // 4. Create Active Repair Request for MacBook Air (Diagnostic Triage phase)
  await prisma.repairRequest.create({
    data: {
      deviceId: macbook.id,
      userId: customerUser.id,
      description: 'Chassis base swelling observed with slight trackpad elevation. Battery shuts off unexpectedly at 35% remaining charge.',
      urgency: UrgencyLevel.HIGH,
      status: RequestStatus.REQUESTED,
      diagnosis: {
        create: {
          issueCategory: 'Battery Degradation',
          possibleIssue: 'Lithium-polymer pouch cell gas generation and internal impedance rise',
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
          reasoning: 'Battery replacement costs ~12% of fair market value (₹72,000). Component replacement prevents premature disposal and saves ₹60,000+ vs replacement laptop.',
        },
      },
    },
  });

  // 5. Create Completed Repair Workflow for ThinkPad T14
  // Request -> Quotes -> Accepted Quote -> Job -> Completed -> RepairHistory -> Review
  const thinkpadRequest = await prisma.repairRequest.create({
    data: {
      deviceId: thinkpad.id,
      userId: customerUser.id,
      description: 'Loud fan rattle and thermal shutdown during video encoding tasks.',
      urgency: UrgencyLevel.MEDIUM,
      status: RequestStatus.COMPLETED,
    },
  });

  // Quote 1 (Accepted)
  const quote1 = await prisma.quote.create({
    data: {
      repairRequestId: thinkpadRequest.id,
      repairerId: repairer1.id,
      estimatedCost: 3800,
      estimatedDays: 2,
      notes: 'OEM Delta fan module replacement + Arctic MX-6 high-viscosity repasting + 6-month repair warranty.',
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
      startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      notes: 'Delta blower fan (FRU 5H41B77239) mounted at 0.35Nm. Thermal junction peak stabilized at 68°C under Prime95 stress loop.',
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
      notes: 'Hardware maintenance manual procedure followed. Passed full hardware diagnostics.',
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
      comment: 'Excellent service. Laptop is quiet and runs at 65°C under sustained Blender renders. Provided genuine parts invoice.',
    },
  });

  console.log('Created complete end-to-end repair lifecycle records (Request -> Quote -> Job -> History -> Review).');
  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
