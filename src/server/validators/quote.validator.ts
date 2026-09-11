import { z } from 'zod';
import { QuoteStatus } from '@prisma/client';

export const createQuoteSchema = z.object({
  estimatedCost: z.number().positive('Estimated cost must be greater than zero'),
  estimatedDays: z.number().int().min(1, 'Estimated turnaround must be at least 1 day'),
  notes: z.string().max(1000).optional().nullable(),
});

export const updateQuoteStatusSchema = z.object({
  status: z.nativeEnum(QuoteStatus),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;
