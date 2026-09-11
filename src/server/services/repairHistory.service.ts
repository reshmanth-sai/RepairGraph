import { prisma } from '../db';
import { UserRole } from '@prisma/client';
import { PaginationParams } from '../utils/pagination';

export async function listRepairHistory(
  userId: string,
  role: UserRole,
  pagination: PaginationParams,
  deviceId?: string
) {
  const where = {
    ...(role !== UserRole.ADMIN ? { device: { userId } } : {}),
    ...(deviceId ? { deviceId } : {}),
  };

  const [total, history] = await Promise.all([
    prisma.repairHistory.count({ where }),
    prisma.repairHistory.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { repairDate: 'desc' },
      include: {
        device: {
          select: {
            id: true,
            brand: true,
            model: true,
            serialNumber: true,
            category: true,
          },
        },
        repairer: {
          select: {
            id: true,
            businessName: true,
            rating: true,
            verificationStatus: true,
          },
        },
        repairJob: {
          select: {
            id: true,
            status: true,
            agreedCost: true,
            actualCost: true,
          },
        },
      },
    }),
  ]);

  return {
    history,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit) || 1,
  };
}
