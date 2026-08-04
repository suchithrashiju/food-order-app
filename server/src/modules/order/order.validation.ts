import { z } from 'zod';

export const createOrderSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            menuItemId: z.string().trim().min(1),
            name: z.string().trim().min(1),
            price: z.number().min(0),
            quantity: z.number().int().min(1).max(50),
          })
          .strict(),
      )
      .min(1, 'At least one item is required'),
    delivery: z
      .object({
        name: z.string().trim().min(2).max(80),
        phone: z
          .string()
          .trim()
          .min(8)
          .max(20)
          .regex(/^[+0-9\s()-]+$/, 'Enter a valid phone number'),
        address: z.string().trim().min(5).max(200),
        city: z.string().trim().min(2).max(80),
        postalCode: z.string().trim().min(3).max(20),
        notes: z.string().trim().max(300).optional().or(z.literal('')),
      })
      .strict(),
  })
  .strict();

export const orderIdParamSchema = z
  .object({
    id: z.string().trim().min(1),
  })
  .strict();

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
