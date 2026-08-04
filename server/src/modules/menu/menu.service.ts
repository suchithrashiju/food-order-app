import type { IMenuItem } from '@src/models/menu.model';
import { menuRepository } from '@src/modules/menu/menu.repository';
import type { GetMenuItemsQuery, MenuItemsResponse } from '@src/modules/menu/menu.validation';

export class MenuService {
  async getMenuItems(query: GetMenuItemsQuery): Promise<MenuItemsResponse> {
    await menuRepository.ensureSeeded();

    const items = await menuRepository.findAll(query);

    return {
      success: true,
      data: items.map((item) => this.toResponseItem(item)),
      count: items.length,
    };
  }

  private toResponseItem(item: IMenuItem) {
    return {
      id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
    };
  }
}

export const menuService = new MenuService();
