import { z } from 'zod';

export const getMenuItemsQuerySchema = z
  .object({
    category: z.string().trim().min(1).optional(),
  })
  .strict();


export const menuItemIdParamSchema = z
  .object({
    id: z.string().trim().min(1, 'Menu item id is required'),
  })
  .strict();

export type GetMenuItemsQuery = z.infer<typeof getMenuItemsQuerySchema>;
export type MenuItemIdParams = z.infer<typeof menuItemIdParamSchema>;

export interface MenuItemDto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  rating: number;
  preparationTime: number;
}

export interface MenuItemsResponse {
  success: boolean;
  data: MenuItemDto[];
  items: MenuItemDto[];
  count: number;
  total: number;
}

export interface MenuItemResponse {
  success: boolean;
  data: MenuItemDto;
}
