import { z } from 'zod';

export const createMenuItemAdminSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().min(5),
  price: z.number().min(0),
  category: z.string().trim().min(2),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
  isAvailable: z.boolean().optional(),
}).strict();

export const updateMenuItemAdminSchema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().min(5).optional(),
  price: z.number().min(0).optional(),
  category: z.string().trim().min(2).optional(),
  imageUrl: z.string().trim().url().optional().or(z.literal('')),
  isAvailable: z.boolean().optional(),
}).strict();

export const statusChangeSchema = z.object({
  isAvailable: z.boolean(),
}).strict();

export const menuItemIdParamSchema = z
  .object({
    id: z.string().trim().min(1, 'Menu item id is required'),
  })
  .strict();
