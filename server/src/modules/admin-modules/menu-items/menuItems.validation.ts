import { z } from 'zod';

const optionalImageUrlSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().trim().url().optional(),
);

export const createMenuItemAdminSchema = z
  .object({
    name: z.string().trim().min(2),
    description: z.string().trim().min(5),
    price: z.number().min(0),
    category: z.string().trim().min(2),
    imageUrl: optionalImageUrlSchema,
    isAvailable: z.boolean().optional(),
  })
  .strict();

export const updateMenuItemAdminSchema = z
  .object({
    name: z.string().trim().min(2).optional(),
    description: z.string().trim().min(5).optional(),
    price: z.number().min(0).optional(),
    category: z.string().trim().min(2).optional(),
    imageUrl: optionalImageUrlSchema,
    isAvailable: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required for update',
  });

export const statusChangeSchema = z
  .object({
    isAvailable: z.boolean(),
  })
  .strict();

export const menuItemIdParamSchema = z
  .object({
    id: z.string().trim().min(1, 'Menu item id is required'),
  })
  .strict();
