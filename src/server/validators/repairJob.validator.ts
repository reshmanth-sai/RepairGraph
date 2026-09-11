import { z } from 'zod';
import { JobStatus } from '@prisma/client';

export const createRepairJobSchema = z.object({
  quoteId: z.string().min(1, 'Accepted quote ID is required'),
});

export const updateRepairJobStatusSchema = z.object({
  status: z.nativeEnum(JobStatus),
  actualCost: z.number().nonnegative().optional().nullable(),
  notes: z.string().max(1500).optional().nullable(),
});

export type CreateRepairJobInput = z.infer<typeof createRepairJobSchema>;
export type UpdateRepairJobStatusInput = z.infer<typeof updateRepairJobStatusSchema>;
