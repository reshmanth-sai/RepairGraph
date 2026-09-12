import { prisma } from '../db';
import { AppError } from '../errors/AppError';
import { UpdateRepairJobStatusInput } from '../validators/repairJob.validator';
import { UserRole, JobStatus, RequestStatus, VerificationStatus, Prisma } from '@prisma/client';
import { PaginationParams } from '../utils/pagination';
import { getOrCreateRepairerProfile } from './repairer.service';

export async function createRepairJobFromQuote(quoteId: string, userId: string, role: UserRole) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      repairRequest: true,
      repairJob: true,
    },
  });

  if (!quote) {
    throw AppError.notFound('Quote');
  }

  // Must have an accepted quote
  if (quote.status !== 'ACCEPTED') {
    throw AppError.badRequest('A repair job can only be created from an ACCEPTED quote.');
  }

  // Verify authorization: only request owner or admin
  if (role !== UserRole.ADMIN && quote.repairRequest.userId !== userId) {
    throw AppError.forbidden('You can only create repair jobs for quotes belonging to your requests.');
  }

  // Prevent duplicate jobs
  if (quote.repairJob) {
    throw AppError.conflict('A repair job already exists for this quote.');
  }

  return prisma.$transaction(async (tx) => {
    const job = await tx.repairJob.create({
      data: {
        repairRequestId: quote.repairRequestId,
        repairerId: quote.repairerId,
        quoteId: quote.id,
        status: JobStatus.ACCEPTED,
        agreedCost: quote.estimatedCost,
        startedAt: new Date(),
      },
      include: {
        repairRequest: {
          include: { device: true },
        },
        repairer: true,
      },
    });

    await tx.repairRequest.update({
      where: { id: quote.repairRequestId },
      data: { status: RequestStatus.ACCEPTED },
    });

    return job;
  });
}

export async function getRepairJobById(id: string, userId: string, role: UserRole) {
  const job = await prisma.repairJob.findUnique({
    where: { id },
    include: {
      repairRequest: {
        include: {
          device: true,
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      repairer: {
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
      },
      quote: true,
      repairHistory: true,
      review: true,
    },
  });

  if (!job) {
    throw AppError.notFound('Repair Job');
  }

  // Access check: Customer, Assigned Repairer, or Admin
  const isCustomer = job.repairRequest.userId === userId;
  const isAssignedRepairer = job.repairer.userId === userId;

  if (!isCustomer && !isAssignedRepairer && role !== UserRole.ADMIN) {
    throw AppError.forbidden('You do not have access to view this repair job.');
  }

  return job;
}

export async function updateRepairJobStatus(
  id: string,
  userId: string,
  role: UserRole,
  input: UpdateRepairJobStatusInput
) {
  const job = await prisma.repairJob.findUnique({
    where: { id },
    include: {
      repairRequest: true,
      repairer: true,
    },
  });

  if (!job) {
    throw AppError.notFound('Repair Job');
  }

  // Repairer modification rule: ONLY the assigned repairer (or admin) can update job status
  const isAssignedRepairer = job.repairer.userId === userId;
  if (!isAssignedRepairer && role !== UserRole.ADMIN) {
    throw AppError.forbidden('Only the assigned repairer can update the repair job progress.');
  }

  // Terminal state immutability
  if (job.status === JobStatus.COMPLETED || job.status === JobStatus.CANCELLED) {
    throw AppError.badRequest(`Cannot modify a ${job.status.toLowerCase()} repair job.`);
  }

  // State machine transition validation
  const ALLOWED_JOB_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
    [JobStatus.ACCEPTED]: [JobStatus.DIAGNOSING, JobStatus.REPAIRING, JobStatus.CANCELLED],
    [JobStatus.DIAGNOSING]: [JobStatus.WAITING_FOR_PART, JobStatus.REPAIRING, JobStatus.CANCELLED],
    [JobStatus.WAITING_FOR_PART]: [JobStatus.REPAIRING, JobStatus.CANCELLED],
    [JobStatus.REPAIRING]: [JobStatus.TESTING, JobStatus.COMPLETED, JobStatus.CANCELLED],
    [JobStatus.TESTING]: [JobStatus.COMPLETED, JobStatus.REPAIRING, JobStatus.CANCELLED],
    [JobStatus.COMPLETED]: [],
    [JobStatus.CANCELLED]: [],
  };

  if (input.status !== job.status && !ALLOWED_JOB_TRANSITIONS[job.status].includes(input.status)) {
    throw AppError.badRequest(
      `Invalid transition: cannot advance repair job from ${job.status} to ${input.status}.`
    );
  }

  return prisma.$transaction(async (tx) => {
    const isNowCompleted = input.status === JobStatus.COMPLETED;
    const completedAt = isNowCompleted ? new Date() : undefined;

    const updatedJob = await tx.repairJob.update({
      where: { id },
      data: {
        status: input.status,
        actualCost: input.actualCost ?? undefined,
        notes: input.notes ?? undefined,
        completedAt,
      },
    });

    // Update parent repair request status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parentStatus: any = input.status;
    await tx.repairRequest.update({
      where: { id: job.repairRequestId },
      data: { status: parentStatus },
    });

    // When job transitions to COMPLETED:
    if (isNowCompleted && !job.completedAt) {
      // 1. Create permanent RepairHistory record (Repair Passport)
      await tx.repairHistory.create({
        data: {
          deviceId: job.repairRequest.deviceId,
          repairJobId: job.id,
          repairType: 'Hardware Servicing',
          issue: job.repairRequest.description,
          partsReplaced: [],
          cost: input.actualCost ?? job.agreedCost,
          repairerId: job.repairerId,
          repairDate: new Date(),
          notes: input.notes || 'Repair successfully finalized and tested.',
          verificationStatus: VerificationStatus.VERIFIED,
        },
      });

      // 2. Increment total completed jobs for the repairer
      await tx.repairer.update({
        where: { id: job.repairerId },
        data: {
          totalJobs: { increment: 1 },
        },
      });
    }

    return updatedJob;
  });
}

export async function listRepairJobs(
  userId: string,
  role: UserRole,
  pagination?: PaginationParams,
  status?: JobStatus
) {
  const page = pagination?.page ?? 1;
  const limit = pagination?.limit ?? 20;
  const skip = pagination?.skip ?? (page - 1) * limit;

  let where: Prisma.RepairJobWhereInput = {};

  if (role === UserRole.USER) {
    where = {
      repairRequest: {
        userId,
      },
    };
  } else if (role === UserRole.REPAIRER) {
    const repairer = await getOrCreateRepairerProfile(userId);
    if (!repairer) {
      throw AppError.forbidden('You must have an active Repairer profile to view repair jobs.');
    }
    where = {
      repairerId: repairer.id,
    };
  } else if (role === UserRole.ADMIN) {
    where = {};
  } else {
    throw AppError.forbidden('Access denied.');
  }

  if (status) {
    if (!Object.values(JobStatus).includes(status)) {
      throw AppError.badRequest(
        `Invalid job status: ${status}. Must be one of ${Object.values(JobStatus).join(', ')}`
      );
    }
    where.status = status;
  }

  const [total, jobs] = await Promise.all([
    prisma.repairJob.count({ where }),
    prisma.repairJob.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        repairRequest: {
          include: {
            device: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
        repairer: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
        },
        quote: true,
        repairHistory: true,
        review: true,
      },
    }),
  ]);

  return {
    jobs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}
