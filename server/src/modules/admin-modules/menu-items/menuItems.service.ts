import { randomUUID } from 'node:crypto';

import mongoose from 'mongoose';

import type { IMenuItemBase } from '@src/models/menu.model';
import { MenuItem } from '@src/models/menu.model';
import { notFound } from '@src/utils/httpError';

interface MenuItemPayload {
  name?: string | undefined;
  description?: string | undefined;
  price?: number | undefined;
  category?: string | undefined;
  imageUrl?: string | undefined;
  isAvailable?: boolean | undefined;
}

interface InMemoryMenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string | undefined;
  isAvailable: boolean;
  isDeleted: boolean;
  createdBy?: string | undefined;
  updatedBy?: string | undefined;
  deletedBy?: string | undefined;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface MenuItemResponseSource {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string | undefined;
  isAvailable: boolean;
  isDeleted: boolean;
  createdBy?: string | undefined;
  updatedBy?: string | undefined;
  deletedBy?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export class MenuItemsService {
  private readonly inMemoryMenuItems: InMemoryMenuItem[] = [];

  seedInMemoryItems(items: ReadonlyArray<IMenuItemBase>): number {
    if (this.inMemoryMenuItems.some((item) => !item.isDeleted)) {
      return 0;
    }

    const now = new Date();
    const seeded = items.map((item) => {
      const seededItem: InMemoryMenuItem = {
        _id: randomUUID(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: item.isAvailable,
        isDeleted: false,
        createdBy: item.createdBy ?? 'admin',
        createdAt: now,
        updatedAt: now,
      };

      if (item.imageUrl) {
        seededItem.imageUrl = item.imageUrl;
      }

      return seededItem;
    });

    this.inMemoryMenuItems.push(...seeded);
    return seeded.length;
  }

  getInMemoryActiveCount(): number {
    return this.inMemoryMenuItems.filter((item) => !item.isDeleted).length;
  }

  async listMenuItems(query: unknown): Promise<{ success: boolean; data: unknown[]; count: number }> {
    const category = typeof query === 'object' && query !== null && 'category' in query && typeof (query as { category?: unknown }).category === 'string'
      ? (query as { category: string }).category
      : undefined;

    if (!this.isMongoConnected()) {
      const filteredItems = this.inMemoryMenuItems.filter((item) => !item.isDeleted && (!category || item.category.toLowerCase().includes(category.toLowerCase())));

      return {
        success: true,
        data: filteredItems.map((item) => this.toResponse(item)),
        count: filteredItems.length,
      };
    }

    const filter: Record<string, unknown> = { isDeleted: false };

    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    const items = await MenuItem.find(filter).sort({ name: 1 }).lean().exec();

    return {
      success: true,
      data: items.map((item) => this.toResponse(this.toResponseSource(item))),
      count: items.length,
    };
  }

  async createMenuItem(input: MenuItemPayload, adminUser?: string): Promise<{ success: boolean; data: unknown }> {
    if (!this.isMongoConnected()) {
      const item: InMemoryMenuItem = {
        _id: randomUUID(),
        name: input.name ?? 'Untitled item',
        description: input.description ?? '',
        price: input.price ?? 0,
        category: input.category ?? 'General',
        isAvailable: input.isAvailable ?? true,
        isDeleted: false,
        createdBy: adminUser ?? 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (input.imageUrl) {
        item.imageUrl = input.imageUrl;
      }

      this.inMemoryMenuItems.unshift(item);

      return {
        success: true,
        data: this.toResponse(item),
      };
    }

    const createPayload: Record<string, unknown> = {
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      isAvailable: input.isAvailable ?? true,
      isDeleted: false,
      createdBy: adminUser ?? 'admin',
      ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
    };

    const item = await MenuItem.create(createPayload);

    return {
      success: true,
      data: this.toResponse(this.toResponseSource(item)),
    };
  }

  async updateMenuItem(id: string, input: MenuItemPayload, adminUser?: string): Promise<{ success: boolean; data: unknown }> {
    if (!this.isMongoConnected()) {
      const item = this.inMemoryMenuItems.find((entry) => entry._id === id && !entry.isDeleted);

      if (!item) {
        throw notFound('Menu item not found');
      }

      Object.assign(item, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
        updatedBy: adminUser ?? 'admin',
        updatedAt: new Date(),
      });

      return {
        success: true,
        data: this.toResponse(item),
      };
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.isAvailable !== undefined ? { isAvailable: input.isAvailable } : {}),
        updatedBy: adminUser ?? 'admin',
      },
      { new: true, runValidators: true },
    ).exec();

    if (!item) {
      throw notFound('Menu item not found');
    }

    return {
      success: true,
      data: this.toResponse(this.toResponseSource(item)),
    };
  }

  async softDeleteMenuItem(id: string, adminUser?: string): Promise<{ success: boolean; data: unknown }> {
    if (!this.isMongoConnected()) {
      const item = this.inMemoryMenuItems.find((entry) => entry._id === id && !entry.isDeleted);

      if (!item) {
        throw notFound('Menu item not found');
      }

      item.isDeleted = true;
      item.deletedBy = adminUser ?? 'admin';
      item.deletedAt = new Date();
      item.updatedAt = new Date();

      return {
        success: true,
        data: {
          id: item._id,
          name: item.name,
          isDeleted: item.isDeleted,
          deletedBy: item.deletedBy,
        },
      };
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        isDeleted: true,
        deletedBy: adminUser ?? 'admin',
        deletedAt: new Date(),
      },
      { new: true, runValidators: true },
    ).exec();

    if (!item) {
      throw notFound('Menu item not found');
    }

    return {
      success: true,
      data: {
        id: item._id.toString(),
        name: item.name,
        isDeleted: item.isDeleted,
        deletedBy: item.deletedBy,
      },
    };
  }

  async changeStatus(id: string, isAvailable: boolean, adminUser?: string): Promise<{ success: boolean; data: unknown }> {
    if (!this.isMongoConnected()) {
      const item = this.inMemoryMenuItems.find((entry) => entry._id === id && !entry.isDeleted);

      if (!item) {
        throw notFound('Menu item not found');
      }

      item.isAvailable = isAvailable;
      item.updatedBy = adminUser ?? 'admin';
      item.updatedAt = new Date();

      return {
        success: true,
        data: {
          id: item._id,
          name: item.name,
          isAvailable: item.isAvailable,
          updatedBy: item.updatedBy,
        },
      };
    }

    const item = await MenuItem.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        isAvailable,
        updatedBy: adminUser ?? 'admin',
      },
      { new: true, runValidators: true },
    ).exec();

    if (!item) {
      throw notFound('Menu item not found');
    }

    return {
      success: true,
      data: {
        id: item._id.toString(),
        name: item.name,
        isAvailable: item.isAvailable,
        updatedBy: item.updatedBy,
      },
    };
  }

  private toResponse(item: MenuItemResponseSource): Record<string, unknown> {
    return {
      id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      isDeleted: item.isDeleted,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      deletedBy: item.deletedBy,
    };
  }

  private toResponseSource(item: {
    _id: string | { toString(): string };
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string | undefined;
    isAvailable: boolean;
    isDeleted?: boolean | undefined;
    createdBy?: string | undefined;
    updatedBy?: string | undefined;
    deletedBy?: string | undefined;
    createdAt: Date;
    updatedAt: Date;
  }): MenuItemResponseSource {
    return {
      _id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl,
      isAvailable: item.isAvailable,
      isDeleted: item.isDeleted ?? false,
      createdBy: item.createdBy,
      updatedBy: item.updatedBy,
      deletedBy: item.deletedBy,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export const menuItemsService = new MenuItemsService();
