import { prisma } from '../src/server/db';
import { registerUser, loginUser } from '../src/server/services/auth.service';
import {
  createDevice,
  getDeviceById,
  updateDevice,
} from '../src/server/services/device.service';
import { checkRateLimit } from '../src/server/auth/rateLimit';
import { createRepairRequest } from '../src/server/services/repairRequest.service';
import {
  createQuote,
  updateQuoteStatus,
} from '../src/server/services/quote.service';
import {
  updateRepairJobStatus,
} from '../src/server/services/repairJob.service';
import { createReview } from '../src/server/services/review.service';
import { UserRole, DeviceCategory, DeviceCondition, JobStatus, QuoteStatus } from '@prisma/client';
import assert from 'node:assert';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING REPAIRGRAPH BACKEND & BUSINESS RULE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err: unknown) {
      console.error(`  ✗ ${name}`);
      console.error(`    Error: ${(err as Error).message}\n`);
      failed++;
    }
  }

  const testId = Date.now().toString().slice(-6);

  // 1. User Registration & Password Hashing
  let customerUser: { id: string; email: string };

  await test('Rule: User registration securely creates account with hashed password', async () => {
    const customer = await registerUser({
      name: `Test Customer ${testId}`,
      email: `test.customer.${testId}@test.internal`,
      password: 'StrongPassword123!',
      role: UserRole.USER,
      phone: '+91 99999 11111',
    });

    assert.ok(customer.user.id);
    assert.ok(customer.token);
    assert.strictEqual(customer.user.role, UserRole.USER);

    // Verify password is NOT plaintext in database
    const dbRecord = await prisma.user.findUnique({ where: { id: customer.user.id } });
    assert.notStrictEqual(dbRecord?.passwordHash, 'StrongPassword123!');
    assert.ok(dbRecord?.passwordHash.startsWith('$2')); // bcrypt hash signature

    customerUser = { id: customer.user.id, email: customer.user.email };
  });

  await test('Rule: Registration rejects duplicate email with conflict error', async () => {
    try {
      await registerUser({
        name: `Duplicate User`,
        email: customerUser.email,
        password: 'Password123!',
        role: UserRole.USER,
      });
      assert.fail('Should have thrown conflict error');
    } catch (err: unknown) {
      assert.strictEqual((err as { code?: string }).code, 'CONFLICT');
    }
  });

  await test('Rule: User login succeeds with correct credentials and rejects incorrect password', async () => {
    const loginResult = await loginUser({
      email: customerUser.email,
      password: 'StrongPassword123!',
    });
    assert.ok(loginResult.token);

    try {
      await loginUser({
        email: customerUser.email,
        password: 'WrongPassword!',
      });
      assert.fail('Should have rejected bad password');
    } catch (err: unknown) {
      assert.strictEqual((err as { code?: string }).code, 'UNAUTHENTICATED');
    }
  });

  // Setup technician and intruder
  const tech = await registerUser({
    name: `Test Tech ${testId}`,
    email: `test.tech.${testId}@test.internal`,
    password: 'Password123!',
    role: UserRole.REPAIRER,
  });
  const technicianUser = { id: tech.user.id, email: tech.user.email };

  const intruder = await registerUser({
    name: `Test Intruder ${testId}`,
    email: `test.intruder.${testId}@test.internal`,
    password: 'Password123!',
    role: UserRole.USER,
  });
  const intruderUser = { id: intruder.user.id, email: intruder.user.email };

  // Setup technician profile
  const repairerProfile = await prisma.repairer.create({
    data: {
      userId: technicianUser.id,
      businessName: `Bengaluru Tech Labs ${testId}`,
      address: 'Indiranagar 100ft Road',
      rating: 4.8,
      totalJobs: 0,
    },
  });

  // 2. Device Creation & Retrieval
  let testDevice: { id: string };

  await test('Rule: Customer can create a device linked to their account', async () => {
    const device = await createDevice(customerUser.id, {
      category: DeviceCategory.LAPTOP,
      brand: 'Dell',
      model: 'XPS 13 Plus',
      serialNumber: `DELL-SN-${testId}`,
      purchasePrice: 125000,
      currentValue: 85000,
      condition: DeviceCondition.GOOD,
    });

    assert.ok(device.id);
    assert.strictEqual(device.userId, customerUser.id);
    testDevice = { id: device.id };
  });

  await test('Rule: Device ownership - user can retrieve their own device', async () => {
    const retrieved = await getDeviceById(testDevice.id, customerUser.id, UserRole.USER);
    assert.strictEqual(retrieved.id, testDevice.id);
    assert.strictEqual(retrieved.model, 'XPS 13 Plus');
  });

  await test('Rule: Device ownership - user can update their own device details', async () => {
    const updated = await updateDevice(testDevice.id, customerUser.id, UserRole.USER, {
      condition: DeviceCondition.FAIR,
      currentValue: 79000,
    });
    assert.strictEqual(updated.condition, DeviceCondition.FAIR);
    assert.strictEqual(updated.currentValue, 79000);
  });

  await test('Rule: Device ownership - intruder cannot update another user device', async () => {
    try {
      await updateDevice(testDevice.id, intruderUser.id, UserRole.USER, {
        currentValue: 1000,
      });
      assert.fail('Intruder should have been forbidden from updating device');
    } catch (err: unknown) {
      assert.strictEqual((err as { code?: string }).code, 'FORBIDDEN');
    }
  });

  await test('Rule: Auth Rate Limiting - allows within threshold and blocks upon exceeding limit', async () => {
    // Mock NextRequest object with IP header
    const mockReq = {
      headers: new Headers({ 'x-forwarded-for': '198.51.100.42' }),
    } as unknown as import('next/server').NextRequest;

    // First 2 requests within threshold (limit = 2) should pass
    checkRateLimit(mockReq, { maxRequests: 2, windowSeconds: 60 });
    checkRateLimit(mockReq, { maxRequests: 2, windowSeconds: 60 });

    // 3rd request should trigger RATE_LIMIT_EXCEEDED (HTTP 429)
    try {
      checkRateLimit(mockReq, { maxRequests: 2, windowSeconds: 60 });
      assert.fail('Should have been blocked by rate limiter');
    } catch (err: unknown) {
      assert.strictEqual((err as { statusCode?: number }).statusCode, 429);
      assert.strictEqual((err as { code?: string }).code, 'RATE_LIMIT_EXCEEDED');
    }
  });

  // 3. Repair Request Creation
  let testRequest: { id: string };

  await test('Rule: Customer can create a repair request for their own device', async () => {
    const request = await createRepairRequest(customerUser.id, {
      deviceId: testDevice.id,
      description: 'Display backlight flicker when hinge tilted past 90 degrees.',
    });

    assert.ok(request.id);
    assert.strictEqual(request.userId, customerUser.id);
    assert.strictEqual(request.status, 'REQUESTED');
    testRequest = { id: request.id };
  });

  await test('Rule: Request creation fails if user attempts to file for a device they do not own', async () => {
    try {
      await createRepairRequest(intruderUser.id, {
        deviceId: testDevice.id,
        description: 'Trying to request on someone elses device',
      });
      assert.fail('Should have been forbidden');
    } catch (err: unknown) {
      assert.strictEqual((err as { code?: string }).code, 'FORBIDDEN');
    }
  });

  // 4. Quote Creation & Ownership
  let testQuote: { id: string };

  await test('Rule: Verified repairer can submit a quote for an open request', async () => {
    const quote = await createQuote(testRequest.id, technicianUser.id, {
      estimatedCost: 5200,
      estimatedDays: 2,
      notes: 'EDP display cable replacement with genuine OEM harness.',
    });

    assert.ok(quote.id);
    assert.strictEqual(quote.status, QuoteStatus.PENDING);
    assert.strictEqual(quote.estimatedCost, 5200);
    testQuote = { id: quote.id };
  });

  await test('Rule: Quote cannot be submitted by regular non-repairer user', async () => {
    try {
      await createQuote(testRequest.id, intruderUser.id, {
        estimatedCost: 1000,
        estimatedDays: 1,
      });
      assert.fail('Non-repairer should not be allowed to quote');
    } catch (err: unknown) {
      assert.strictEqual((err as { code?: string }).code, 'FORBIDDEN');
    }
  });

  // 5. Quote Acceptance & Automatic Job Creation
  await test('Rule: Only request owner can accept quote; acceptance sets quote ACCEPTED and creates active RepairJob', async () => {
    // Intruder attempts to accept customer's quote
    try {
      await updateQuoteStatus(testQuote.id, intruderUser.id, UserRole.USER, {
        status: QuoteStatus.ACCEPTED,
      });
      assert.fail('Intruder should not accept customer quote');
    } catch (err: unknown) {
      assert.strictEqual((err as { code?: string }).code, 'FORBIDDEN');
    }

    // Customer accepts quote
    const accepted = await updateQuoteStatus(testQuote.id, customerUser.id, UserRole.USER, {
      status: QuoteStatus.ACCEPTED,
    });
    assert.strictEqual(accepted.status, QuoteStatus.ACCEPTED);

    // Verify RepairJob was automatically generated
    const job = await prisma.repairJob.findUnique({
      where: { quoteId: testQuote.id },
    });
    assert.ok(job);
    assert.strictEqual(job?.status, JobStatus.ACCEPTED);
    assert.strictEqual(job?.agreedCost, 5200);
  });

  // 6. Repair Job Status Progression
  let activeJobId: string;

  await test('Rule: Only assigned repairer can update job status; transitioning to COMPLETED updates history and totalJobs', async () => {
    const job = await prisma.repairJob.findUnique({ where: { quoteId: testQuote.id } });
    assert.ok(job);
    activeJobId = job.id;

    // Intruder attempts to change job status
    try {
      await updateRepairJobStatus(activeJobId, intruderUser.id, UserRole.USER, {
        status: JobStatus.REPAIRING,
      });
      assert.fail('Intruder should not be allowed to update job status');
    } catch (err: unknown) {
      assert.strictEqual((err as { code?: string }).code, 'FORBIDDEN');
    }

    // Technician transitions job: ACCEPTED -> REPAIRING
    await updateRepairJobStatus(activeJobId, technicianUser.id, UserRole.REPAIRER, {
      status: JobStatus.REPAIRING,
      notes: 'Disassembled bezel and replacing EDP ribbon cable.',
    });

    // Technician transitions job: REPAIRING -> COMPLETED
    const completedJob = await updateRepairJobStatus(activeJobId, technicianUser.id, UserRole.REPAIRER, {
      status: JobStatus.COMPLETED,
      actualCost: 5200,
      notes: 'Screen hinge tested through 100 cycles. Flicker completely resolved.',
    });

    assert.strictEqual(completedJob.status, JobStatus.COMPLETED);
    assert.ok(completedJob.completedAt);

    // Verify RepairHistory was automatically created (Repair Passport ledger entry)
    const history = await prisma.repairHistory.findUnique({
      where: { repairJobId: activeJobId },
    });
    assert.ok(history);
    assert.strictEqual(history?.deviceId, testDevice.id);

    // Verify repairer's totalJobs was incremented
    const updatedRepairer = await prisma.repairer.findUnique({ where: { id: repairerProfile.id } });
    assert.strictEqual(updatedRepairer?.totalJobs, 1);
  });

  // 7. Review Submission & Duplicate Prevention
  await test('Rule: Customer can review completed job; rating recalculates repairer average', async () => {
    const review = await createReview(customerUser.id, {
      repairJobId: activeJobId,
      rating: 5,
      comment: 'Super fast turnaround! Cable replaced with authentic parts.',
    });

    assert.ok(review.id);
    assert.strictEqual(review.rating, 5);

    // Verify repairer rating updated
    const updatedRepairer = await prisma.repairer.findUnique({ where: { id: repairerProfile.id } });
    assert.strictEqual(updatedRepairer?.rating, 5);
  });

  await test('Rule: Duplicate review prevention - cannot review same repair job twice', async () => {
    try {
      await createReview(customerUser.id, {
        repairJobId: activeJobId,
        rating: 4,
        comment: 'Trying to review again',
      });
      assert.fail('Should have rejected duplicate review');
    } catch (err: unknown) {
      assert.strictEqual((err as { code?: string }).code, 'CONFLICT');
    }
  });

  await test('Rule: Intruder cannot review another customer completed job', async () => {
    try {
      await createReview(intruderUser.id, {
        repairJobId: activeJobId,
        rating: 1,
        comment: 'Malicious review from stranger',
      });
      assert.fail('Intruder should have been forbidden');
    } catch (err: unknown) {
      assert.strictEqual((err as { code?: string }).code, 'FORBIDDEN');
    }
  });

  console.log('\n----------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error('Test execution failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
