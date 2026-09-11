import { z } from 'zod';
import { DeviceCategory, DeviceCondition } from '@prisma/client';

export const createDeviceSchema = z.object({
  category: z.nativeEnum(DeviceCategory, {
    message: 'Invalid device category. Must be SMARTPHONE, LAPTOP, TABLET, HEADPHONES, or MONITOR.',
  }),
  brand: z.string().min(1, 'Brand is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  serialNumber: z.string().min(1, 'Serial number is required').max(100).trim(),
  purchaseDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  purchasePrice: z.number().nonnegative('Purchase price cannot be negative').optional().nullable(),
  warrantyExpiry: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
  currentValue: z.number().nonnegative('Current fair market value cannot be negative').optional().nullable(),
  condition: z.nativeEnum(DeviceCondition).default(DeviceCondition.GOOD),
  imageUrl: z.string().url('Invalid image URL format').optional().nullable(),
});

export const updateDeviceSchema = createDeviceSchema.partial();

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;
