import { z } from 'zod';
import { UrgencyLevel, RequestStatus } from '@prisma/client';

export const createRepairRequestSchema = z.object({
  deviceId: z.string().min(1, 'Target device ID is required'),
  description: z.string().min(5, 'Problem description must be at least 5 characters long').max(2000),
  urgency: z.nativeEnum(UrgencyLevel).default(UrgencyLevel.MEDIUM),
});

export const updateRepairRequestSchema = z.object({
  description: z.string().min(5).max(2000).optional(),
  urgency: z.nativeEnum(UrgencyLevel).optional(),
  status: z.nativeEnum(RequestStatus).optional(),
});

export type CreateRepairRequestInput = z.infer<typeof createRepairRequestSchema>;
export type UpdateRepairRequestInput = z.infer<typeof updateRepairRequestSchema>;
