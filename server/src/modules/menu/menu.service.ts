import { menuRepository } from '@src/modules/menu/menu.repository';
import type {
  GetMenuItemsQuery,
  MenuItemDto,
  MenuItemResponse,
  MenuItemsResponse,
} from '@src/modules/menu/menu.validation';
import { notFound } from '@src/utils/httpError';

export class MenuService {
  async getMenuItems(query: GetMenuItemsQuery): Promise<MenuItemsResponse> {
    await menuRepository.ensureSeeded();

    const items = await menuRepository.findAll(query);
    const responseItems = items.map((item) => this.toResponseItem(item));

    return {
      success: true,
      data: responseItems,
      items: responseItems,
      count: responseItems.length,
      total: responseItems.length,
    };
  }

  async getMenuItemById(id: string): Promise<MenuItemResponse> {
    await menuRepository.ensureSeeded();

    const item = await menuRepository.findById(id);

    if (!item) {
      throw notFound(`Menu item with id ${id} was not found`);
    }

    return {
      success: true,
      data: this.toResponseItem(item),
    };
  }

  private toResponseItem(item: {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    isAvailable: boolean;
    rating?: number;
    preparationTime?: number;
  }): MenuItemDto {
    const response: MenuItemDto = {
      id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      rating: item.rating ?? 4.5,
      preparationTime: item.preparationTime ?? 20,
    };

    if (item.imageUrl) {
      response.imageUrl = item.imageUrl;
    }

    return response;
  }
}

export const menuService = new MenuService();
