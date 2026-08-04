import { z } from 'zod';

export const getMenuItemsQuerySchema = z
  .object({
    category: z.string().trim().min(1).optional(),
  })
  .strict();

export type GetMenuItemsQuery = z.infer<typeof getMenuItemsQuerySchema>;

export interface MenuItemsResponse {
  success: boolean;
  data: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string | undefined;
    isAvailable: boolean;
  }>;
  count: number;
}
