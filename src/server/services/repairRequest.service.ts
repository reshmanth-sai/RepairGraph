import { prisma } from '../db';
import { AppError } from '../errors/AppError';
import { CreateRepairRequestInput, UpdateRepairRequestInput } from '../validators/repairRequest.validator';
import { PaginationParams } from '../utils/pagination';
import { UserRole, RequestStatus } from '@prisma/client';

export async function createRepairRequest(userId: string, input: CreateRepairRequestInput) {
  // 1. Verify the device exists and belongs to the user
  const device = await prisma.device.findUnique({
    where: { id: input.deviceId },
  });

  if (!device) {
    throw AppError.notFound('Device');
  }

  if (device.userId !== userId) {
    throw AppError.forbidden('You can only create repair requests for devices you own.');
  }

  return prisma.repairRequest.create({
    data: {
      deviceId: input.deviceId,
      userId,
      description: input.description,
      urgency: input.urgency,
      status: RequestStatus.REQUESTED,
    },
    include: {
      device: {
        select: {
          brand: true,
          model: true,
          category: true,
          serialNumber: true,
        },
      },
    },
  });
}

export async function listRepairRequests(
  userId: string,
  role: UserRole,
  pagination: PaginationParams,
  status?: string
) {
  const where = {
    // Regular users see only their own requests.
    // Repairers see requests that are open (REQUESTED, ACCEPTED, etc.) or assigned to them.
    // Admins see all.
    ...(role === UserRole.USER ? { userId } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(status ? { status: status as any } : {}),
  };

  const [total, requests] = await Promise.all([
    prisma.repairRequest.count({ where }),
    prisma.repairRequest.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        device: {
          select: {
            brand: true,
            model: true,
            category: true,
            serialNumber: true,
          },
        },
        _count: {
          select: { quotes: true },
        },
        repairJob: {
          select: {
            id: true,
            status: true,
            agreedCost: true,
          },
        },
      },
    }),
  ]);

  return {
    requests,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit) || 1,
  };
}

export async function getRepairRequestById(id: string, userId: string, role: UserRole) {
  const request = await prisma.repairRequest.findUnique({
    where: { id },
    include: {
      device: true,
      diagnosis: true,
      recommendation: true,
      quotes: {
        include: {
          repairer: {
            select: {
              id: true,
              businessName: true,
              rating: true,
              totalJobs: true,
              address: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      repairJob: {
        include: {
          repairer: true,
        },
      },
    },
  });

  if (!request) {
    throw AppError.notFound('Repair Request');
  }

  // Request ownership rule: regular users can only see their own requests.
  // Repairers can see open requests to submit quotes or if they are assigned.
  if (role === UserRole.USER && request.userId !== userId) {
    throw AppError.forbidden('You do not have permission to access this repair request.');
  }

  return request;
}

export async function updateRepairRequest(
  id: string,
  userId: string,
  role: UserRole,
  input: UpdateRepairRequestInput
) {
  const request = await getRepairRequestById(id, userId, role);

  // Only the request owner or an admin can update the request
  if (role !== UserRole.ADMIN && request.userId !== userId) {
    throw AppError.forbidden('You can only modify your own repair requests.');
  }

  return prisma.repairRequest.update({
    where: { id },
    data: {
      description: input.description,
      urgency: input.urgency,
      status: input.status,
    },
  });
}

export async function deleteRepairRequest(id: string, userId: string, role: UserRole) {
  const request = await getRepairRequestById(id, userId, role);

  if (role !== UserRole.ADMIN && request.userId !== userId) {
    throw AppError.forbidden('You can only delete your own repair requests.');
  }

  await prisma.repairRequest.delete({
    where: { id },
  });

  return { success: true, message: 'Repair request deleted successfully' };
}
