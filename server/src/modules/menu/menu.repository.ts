import { randomUUID } from 'node:crypto';

import mongoose from 'mongoose';

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
  createdAt: Date;
  updatedAt: Date;
};

type MenuItemPayload = Omit<MenuItemEntity, '_id' | 'createdAt' | 'updatedAt'>;



const defaultMenuItems: Array<IMenuItemBase> = [
  {
    name: 'Classic Burger',
    description: 'Juicy beef burger with lettuce, tomato, and house sauce.',
    price: 12.5,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Margherita Pizza',
    description: 'Traditional pizza with tomato sauce, mozzarella, and basil.',
    price: 14.0,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Chicken Caesar Wrap',
    description: 'Grilled chicken wrapped in a tortilla with romaine and Caesar dressing.',
    price: 10.75,
    category: 'Wraps',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Spicy Chicken Fries',
    description: 'Crispy fries tossed in a spicy seasoning with chicken bites.',
    price: 9.5,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Veggie Salad',
    description: 'Fresh salad with mixed greens, avocado, and roasted vegetables.',
    price: 8.25,
    category: 'Salads',
    imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Chicken Alfredo Pasta',
    description: 'Creamy pasta with grilled chicken and parmesan.',
    price: 13.5,
    category: 'Pasta',
    imageUrl: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'BBQ Chicken Sandwich',
    description: 'Tender chicken with smoky BBQ sauce and slaw.',
    price: 11.25,
    category: 'Sandwiches',
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-0e6b0567d8d7?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten center.',
    price: 6.75,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Fresh Lemonade',
    description: 'Refreshing lemonade served chilled.',
    price: 3.5,
    category: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
  {
    name: 'Loaded Nachos',
    description: 'Crispy nachos topped with cheese, beans, salsa, and guac.',
    price: 9.0,
    category: 'Appetizers',
    imageUrl: 'https://images.unsplash.com/photo-1513456854501-30d1f9f0f8b0?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
  },
];

let memoryMenuItems: MenuItemEntity[] = [];

export class MenuRepository {
  async ensureSeeded(): Promise<void> {
    if (this.isMongoConnected()) {
      const count = await MenuItem.countDocuments().exec();

      if (count > 0) {
        return;
      }

      await MenuItem.create(defaultMenuItems);
      return;
    }

    if (memoryMenuItems.length > 0) {
      return;
    }

    memoryMenuItems = defaultMenuItems.map((item) => {
      const seededItem: MenuItemEntity = {
        _id: randomUUID(),
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        isAvailable: item.isAvailable,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (item.imageUrl) {
        seededItem.imageUrl = item.imageUrl;
      }

      return seededItem;
    });
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
      return memoryMenuItems.find((item) => item._id === id) ?? null;
    }

    const item = await MenuItem.findById(id).exec();
    return item ? this.toEntity(item) : null;
  }

  

  private findAllInMemory(query: GetMenuItemsQuery): MenuItemEntity[] {
    const filter = this.buildFilter(query);

    return memoryMenuItems.filter((item) => {
      if (!filter.category) {
        return true;
      }

      return item.category.toLowerCase().includes(String(filter.category).toLowerCase());
    });
  }

  private buildFilter(query: GetMenuItemsQuery): Record<string, unknown> {
    if (!query.category) {
      return {};
    }

    return { category: { $regex: query.category, $options: 'i' } };
  }

  private isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  private toEntity(item: { _id: string | { toString(): string }; name: string; description: string; price: number; category: string; imageUrl?: string; isAvailable: boolean; createdAt?: Date; updatedAt?: Date }): MenuItemEntity {
    const entity: MenuItemEntity = {
      _id: item._id.toString(),
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
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
