import { prisma } from '../db';
import { AppError } from '../errors/AppError';
import { CreateDeviceInput, UpdateDeviceInput } from '../validators/device.validator';
import { PaginationParams } from '../utils/pagination';
import { UserRole } from '@prisma/client';

export async function createDevice(userId: string, input: CreateDeviceInput) {
  return prisma.device.create({
    data: {
      userId,
      category: input.category,
      brand: input.brand,
      model: input.model,
      serialNumber: input.serialNumber,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      purchasePrice: input.purchasePrice,
      warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : null,
      currentValue: input.currentValue,
      condition: input.condition,
      imageUrl: input.imageUrl,
    },
  });
}

export async function listDevices(
  userId: string,
  role: UserRole,
  pagination: PaginationParams,
  category?: string
) {
  const where = {
    // Regular users and repairers only see their own devices; admins can see all
    ...(role !== UserRole.ADMIN ? { userId } : {}),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(category ? { category: category as any } : {}),
  };

  const [total, devices] = await Promise.all([
    prisma.device.count({ where }),
    prisma.device.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        repairRequests: {
          select: {
            id: true,
            status: true,
            description: true,
            createdAt: true,
          },
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
  ]);

  return {
    devices,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit) || 1,
  };
}

export async function getDeviceById(id: string, userId: string, role: UserRole) {
  const device = await prisma.device.findUnique({
    where: { id },
    include: {
      repairRequests: {
        include: {
          diagnosis: true,
          recommendation: true,
          repairJob: {
            select: {
              id: true,
              status: true,
              agreedCost: true,
              repairer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      repairHistory: {
        include: {
          repairer: {
            select: {
              id: true,
              businessName: true,
              verificationStatus: true,
            },
          },
        },
        orderBy: { repairDate: 'desc' },
      },
    },
  });

  if (!device) {
    throw AppError.notFound('Device');
  }

  // Device ownership business rule
  if (role !== UserRole.ADMIN && device.userId !== userId) {
    throw AppError.forbidden('You do not have permission to access this device.');
  }

  return device;
}

export async function updateDevice(
  id: string,
  userId: string,
  role: UserRole,
  input: UpdateDeviceInput
) {
  // First verify existence and ownership
  await getDeviceById(id, userId, role);

  return prisma.device.update({
    where: { id },
    data: {
      category: input.category,
      brand: input.brand,
      model: input.model,
      serialNumber: input.serialNumber,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
      purchasePrice: input.purchasePrice,
      warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
      currentValue: input.currentValue,
      condition: input.condition,
      imageUrl: input.imageUrl,
    },
  });
}

export async function deleteDevice(id: string, userId: string, role: UserRole) {
  // Verify existence and ownership
  await getDeviceById(id, userId, role);

  await prisma.device.delete({
    where: { id },
  });

  return { success: true, message: 'Device deleted successfully' };
}
