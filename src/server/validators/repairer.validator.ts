import { z } from 'zod';
import { DeviceCategory } from '@prisma/client';

export const createRepairerProfileSchema = z.object({
  businessName: z.string().min(2).max(150),
  description: z.string().max(1000).optional().nullable(),
  address: z.string().min(5).max(300),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  specializations: z
    .array(
      z.object({
        deviceCategory: z.nativeEnum(DeviceCategory),
        brand: z.string().min(1),
        serviceType: z.string().min(1),
      })
    )
    .optional(),
});

export const updateRepairerProfileSchema = createRepairerProfileSchema.partial();

export type CreateRepairerProfileInput = z.infer<typeof createRepairerProfileSchema>;
export type UpdateRepairerProfileInput = z.infer<typeof updateRepairerProfileSchema>;
