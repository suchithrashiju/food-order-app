import { randomUUID } from 'node:crypto';

import type { IMenuItemBase } from '@src/models/menu.model';

export type InMemoryMenuItem = {
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
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

/** Shared in-memory menu so public catalog and admin CRUD stay in sync without Mongo. */
let memoryMenuItems: InMemoryMenuItem[] = [];

export const inMemoryMenuStore = {
  getAll(): InMemoryMenuItem[] {
    return memoryMenuItems;
  },

  activeCount(): number {
    return memoryMenuItems.filter((item) => !item.isDeleted).length;
  },

  hasActiveItems(): boolean {
    return memoryMenuItems.some((item) => !item.isDeleted);
  },

  seed(items: ReadonlyArray<IMenuItemBase>): number {
    if (this.hasActiveItems()) {
      return 0;
    }

    const now = new Date();
    memoryMenuItems = items.map((item) => {
      const seeded: InMemoryMenuItem = {
        _id: randomUUID(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: item.isAvailable,
        rating: item.rating ?? 4.5,
        preparationTime: item.preparationTime ?? 20,
        isDeleted: false,
        createdBy: item.createdBy ?? 'admin',
        createdAt: now,
        updatedAt: now,
      };

      if (item.imageUrl) {
        seeded.imageUrl = item.imageUrl;
      }

      return seeded;
    });

    return memoryMenuItems.length;
  },

  create(input: {
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    isAvailable: boolean;
    createdBy?: string;
  }): InMemoryMenuItem {
    const item: InMemoryMenuItem = {
      _id: randomUUID(),
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      isAvailable: input.isAvailable,
      rating: 4.5,
      preparationTime: 20,
      isDeleted: false,
      createdBy: input.createdBy ?? 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (input.imageUrl) {
      item.imageUrl = input.imageUrl;
    }

    memoryMenuItems.unshift(item);
    return item;
  },

  findActiveById(id: string): InMemoryMenuItem | undefined {
    return memoryMenuItems.find((item) => item._id === id && !item.isDeleted);
  },

  update(
    id: string,
    patch: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      imageUrl: string;
      isAvailable: boolean;
      updatedBy: string;
    }>,
  ): InMemoryMenuItem | undefined {
    const item = this.findActiveById(id);
    if (!item) {
      return undefined;
    }

    Object.assign(item, {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.description !== undefined ? { description: patch.description } : {}),
      ...(patch.price !== undefined ? { price: patch.price } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl } : {}),
      ...(patch.isAvailable !== undefined ? { isAvailable: patch.isAvailable } : {}),
      ...(patch.updatedBy !== undefined ? { updatedBy: patch.updatedBy } : {}),
      updatedAt: new Date(),
    });

    return item;
  },

  softDelete(id: string, deletedBy: string): InMemoryMenuItem | undefined {
    const item = this.findActiveById(id);
    if (!item) {
      return undefined;
    }

    item.isDeleted = true;
    item.deletedBy = deletedBy;
    item.deletedAt = new Date();
    item.updatedAt = new Date();
    return item;
  },

  /** Test helper — clears the shared store. */
  reset(): void {
    memoryMenuItems = [];
  },
};
