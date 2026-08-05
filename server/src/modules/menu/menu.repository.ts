import { randomUUID } from 'node:crypto';

import mongoose from 'mongoose';

import { SEED_MENU_ITEMS } from '@src/data/menu.seed';
import { MenuItem, type IMenuItemBase } from '@src/models/menu.model';
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

let memoryMenuItems: MenuItemEntity[] = [];

export class MenuRepository {
  seedInMemoryItems(items: ReadonlyArray<IMenuItemBase>): number {
    if (memoryMenuItems.some((item) => !item.isDeleted)) {
      return 0;
    }

    const now = new Date();
    memoryMenuItems = items.map((item) => {
      const seededItem: MenuItemEntity = {
        _id: randomUUID(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: item.isAvailable,
        rating: item.rating ?? 4.5,
        preparationTime: item.preparationTime ?? 20,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      };

      if (item.imageUrl) {
        seededItem.imageUrl = item.imageUrl;
      }

      return seededItem;
    });

    return memoryMenuItems.length;
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

    if (memoryMenuItems.some((item) => !item.isDeleted)) {
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
      return memoryMenuItems.find((item) => item._id === id && !item.isDeleted && item.isAvailable) ?? null;
    }

    const item = await MenuItem.findOne({ _id: id, isDeleted: false, isAvailable: true }).exec();
    return item ? this.toEntity(item) : null;
  }

  private findAllInMemory(query: GetMenuItemsQuery): MenuItemEntity[] {
    return memoryMenuItems.filter((item) => {
      if (item.isDeleted || !item.isAvailable) {
        return false;
      }

      if (!query.category) {
        return true;
      }

      return item.category.toLowerCase().includes(query.category.toLowerCase());
    });
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
