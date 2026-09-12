import { prisma } from '../db';
import { AppError } from '../errors/AppError';
import { CreateRepairerProfileInput, UpdateRepairerProfileInput } from '../validators/repairer.validator';
import { PaginationParams } from '../utils/pagination';
import { UserRole, VerificationStatus } from '@prisma/client';

export async function createRepairerProfile(userId: string, input: CreateRepairerProfileInput) {
  // Check if user has REPAIRER role
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== UserRole.REPAIRER && user.role !== UserRole.ADMIN)) {
    throw AppError.forbidden('Only accounts with the REPAIRER role can create a repairer profile.');
  }

  // Check if profile already exists
  const existing = await prisma.repairer.findUnique({ where: { userId } });
  if (existing) {
    throw AppError.conflict('A repairer profile already exists for this account.');
  }

  return prisma.repairer.create({
    data: {
      userId,
      businessName: input.businessName,
      description: input.description,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      verificationStatus: VerificationStatus.VERIFIED, // verified for prototype/testing
      specializations: input.specializations
        ? {
            create: input.specializations.map((spec) => ({
              deviceCategory: spec.deviceCategory,
              brand: spec.brand,
              serviceType: spec.serviceType,
            })),
          }
        : undefined,
    },
    include: {
      specializations: true,
    },
  });
}

/**
 * Returns existing repairer profile or provisions a default verified profile
 * for users with REPAIRER or ADMIN role. Returns null if user lacks repairer permissions.
 */
export async function getOrCreateRepairerProfile(userId: string) {
  const existing = await prisma.repairer.findUnique({
    where: { userId },
    include: { specializations: true },
  });
  if (existing) return existing;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || (user.role !== UserRole.REPAIRER && user.role !== UserRole.ADMIN)) {
    return null;
  }

  return prisma.repairer.create({
    data: {
      userId,
      businessName: user.name ? `${user.name}'s Repair Workshop` : 'Independent Repair Lab',
      description: 'Verified independent hardware diagnostics and repair facility.',
      address: 'Primary Service Facility',
      verificationStatus: VerificationStatus.VERIFIED,
    },
    include: { specializations: true },
  });
}


export async function listRepairers(
  pagination: PaginationParams,
  verificationStatus?: string
) {
  const where = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(verificationStatus ? { verificationStatus: verificationStatus as any } : {}),
  };

  const [total, repairers] = await Promise.all([
    prisma.repairer.count({ where }),
    prisma.repairer.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: [{ rating: 'desc' }, { totalJobs: 'desc' }],
      include: {
        specializations: true,
        _count: {
          select: { reviews: true },
        },
      },
    }),
  ]);

  return {
    repairers,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit) || 1,
  };
}

export async function getRepairerById(id: string) {
  const repairer = await prisma.repairer.findUnique({
    where: { id },
    include: {
      specializations: true,
      reviews: {
        include: {
          user: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          repairJobs: true,
          reviews: true,
        },
      },
    },
  });

  if (!repairer) {
    throw AppError.notFound('Repairer');
  }

  return repairer;
}

export async function updateRepairerProfile(
  id: string,
  userId: string,
  role: UserRole,
  input: UpdateRepairerProfileInput
) {
  const repairer = await getRepairerById(id);

  if (role !== UserRole.ADMIN && repairer.userId !== userId) {
    throw AppError.forbidden('You can only modify your own repairer profile.');
  }

  return prisma.repairer.update({
    where: { id },
    data: {
      businessName: input.businessName,
      description: input.description,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
    },
  });
}

export async function deleteRepairerProfile(id: string, userId: string, role: UserRole) {
  const repairer = await getRepairerById(id);

  if (role !== UserRole.ADMIN && repairer.userId !== userId) {
    throw AppError.forbidden('You can only delete your own repairer profile.');
  }

  await prisma.repairer.delete({ where: { id } });
  return { success: true, message: 'Repairer profile deleted successfully.' };
}
