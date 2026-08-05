import mongoose from 'mongoose';

import { SEED_MENU_ITEMS } from '@src/data/menu.seed';
import { MenuItem, type IMenuItemBase } from '@src/models/menu.model';
import { inMemoryMenuStore, type InMemoryMenuItem } from '@src/modules/menu/in-memory-menu.store';
import type { GetMenuItemsQuery } from '@src/modules/menu/menu.validation';

type MenuItemEntity = {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  rating: number;
  preparationTime: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class MenuRepository {
  seedInMemoryItems(items: ReadonlyArray<IMenuItemBase>): number {
    return inMemoryMenuStore.seed(items);
  }

  async ensureSeeded(): Promise<void> {
    if (this.isMongoConnected()) {
      const activeCount = await MenuItem.countDocuments({ isDeleted: false }).exec();

      if (activeCount > 0) {
        return;
      }

      const totalCount = await MenuItem.countDocuments().exec();

      if (totalCount === 0) {
        await MenuItem.insertMany(SEED_MENU_ITEMS);
      }

      return;
    }

    if (inMemoryMenuStore.hasActiveItems()) {
      return;
    }

    this.seedInMemoryItems(SEED_MENU_ITEMS);
  }

  async findAll(query: GetMenuItemsQuery): Promise<MenuItemEntity[]> {
    if (!this.isMongoConnected()) {
      return this.findAllInMemory(query);
    }

    const filter = this.buildFilter(query);
    const items = await MenuItem.find(filter).sort({ name: 1 }).exec();

    return items.map((item) => this.toEntity(item));
  }

  async findById(id: string): Promise<MenuItemEntity | null> {
    if (!this.isMongoConnected()) {
      const item = inMemoryMenuStore.getAll().find(
        (entry) => entry._id === id && !entry.isDeleted && entry.isAvailable,
      );
      return item ? this.fromMemory(item) : null;
    }

    const item = await MenuItem.findOne({ _id: id, isDeleted: false, isAvailable: true }).exec();
    return item ? this.toEntity(item) : null;
  }

  private findAllInMemory(query: GetMenuItemsQuery): MenuItemEntity[] {
    return inMemoryMenuStore
      .getAll()
      .filter((item) => {
        if (item.isDeleted || !item.isAvailable) {
          return false;
        }

        if (!query.category) {
          return true;
        }

        return item.category.toLowerCase().includes(query.category.toLowerCase());
      })
      .map((item) => this.fromMemory(item));
  }

  private buildFilter(query: GetMenuItemsQuery): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      isAvailable: true,
    };

    if (query.category) {
      filter.category = { $regex: query.category, $options: 'i' };
    }

    return filter;
  }

  private isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  private fromMemory(item: InMemoryMenuItem): MenuItemEntity {
    const entity: MenuItemEntity = {
      _id: item._id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      rating: item.rating,
      preparationTime: item.preparationTime,
      isDeleted: item.isDeleted,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    if (item.imageUrl) {
      entity.imageUrl = item.imageUrl;
    }

    return entity;
  }

  private toEntity(item: {
    _id: string | { toString(): string };
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    isAvailable: boolean;
    rating?: number;
    preparationTime?: number;
    isDeleted?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): MenuItemEntity {
    const entity: MenuItemEntity = {
      _id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
      rating: item.rating ?? 4.5,
      preparationTime: item.preparationTime ?? 20,
      isDeleted: item.isDeleted ?? false,
      createdAt: item.createdAt ?? new Date(),
      updatedAt: item.updatedAt ?? new Date(),
    };

    if (item.imageUrl) {
      entity.imageUrl = item.imageUrl;
    }

    return entity;
  }
}

export const menuRepository = new MenuRepository();
