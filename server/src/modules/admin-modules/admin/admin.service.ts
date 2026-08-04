import bcrypt from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

import { env } from '@src/config/env';
import { MenuItem } from '@src/models/menu.model';
import { SystemConfig } from '@src/models/systemConfig.model';
import { User } from '@src/models/user.model';
import type { AdminLoginInput } from '@src/modules/admin-modules/admin/admin.validation';

const DEFAULT_ADMIN_USERNAME = 'admin';
const DEFAULT_ADMIN_EMAIL = 'admin@2026';
const DEFAULT_ADMIN_PASSWORD = 'admin@2026';
const BCRYPT_SALT_ROUNDS = 10;
const ADMIN_CONFIG_KEY = 'ADMINCONFIG';
const ADDED_MENU_ITEMS_CONFIG_KEY = 'ADDED_MENU_ITEMS';

const BASIC_MENU_ITEMS = [
  {
    name: 'Classic Burger',
    description: 'Juicy beef burger with lettuce, tomato, cheese, and house sauce.',
    price: 12.5,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
    isDeleted: false,
    createdBy: DEFAULT_ADMIN_USERNAME,
  },
  {
    name: 'Margherita Pizza',
    description: 'Traditional pizza with tomato sauce, mozzarella, and basil.',
    price: 14,
    category: 'Pizza',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
    isDeleted: false,
    createdBy: DEFAULT_ADMIN_USERNAME,
  },
  {
    name: 'Chicken Caesar Wrap',
    description: 'Grilled chicken wrapped with romaine, parmesan, and Caesar dressing.',
    price: 10.75,
    category: 'Wraps',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
    isDeleted: false,
    createdBy: DEFAULT_ADMIN_USERNAME,
  },
  {
    name: 'Veggie Salad',
    description: 'Fresh salad with mixed greens, avocado, and roasted vegetables.',
    price: 8.25,
    category: 'Salads',
    imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
    isDeleted: false,
    createdBy: DEFAULT_ADMIN_USERNAME,
  },
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a molten center and rich cocoa flavor.',
    price: 6.75,
    category: 'Desserts',
    imageUrl: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?auto=format&fit=crop&w=900&q=80',
    isAvailable: true,
    isDeleted: false,
    createdBy: DEFAULT_ADMIN_USERNAME,
  },
] as const;

interface AdminTokenPayload {
  username: string;
  role: 'admin';
  exp: number;
}

interface AdminSeedResponse {
  success: boolean;
  data: {
    adminSeeded: boolean;
    systemConfigSeeded: boolean;
    menuItemsSeeded: boolean;
    menuItemsAdded: number;
  };
}

interface AdminLoginResponse {
  success: boolean;
  data: {
    token: string;
    admin: {
      username: string;
      role: 'admin';
    };
    expiresAt: string;
  };
}

interface AdminDashboardResponse {
  success: boolean;
  data: {
    adminSeeded: boolean;
    menuItemsCount: number;
    ordersCount: number;
    customersCount: number;
    systemConfig: {
      key: string;
      value: string;
    }[];
  };
}

export class AdminService {
  private readonly inMemoryAdminSeed = {
    adminSeeded: false,
    systemConfigSeeded: false,
    menuItemsSeeded: false,
    menuItemsAdded: 0,
  };
  private inMemoryAdminPasswordHash?: string;

  async login(input: AdminLoginInput): Promise<AdminLoginResponse> {
    if (!this.isMongoConnected()) {
      const passwordHash = await this.getInMemoryAdminPasswordHash();
      const isPasswordValid = await bcrypt.compare(input.password, passwordHash);

      if (input.username !== DEFAULT_ADMIN_USERNAME || !isPasswordValid) {
        throw this.createUnauthorizedError('Invalid admin credentials');
      }

      return this.createLoginResponse(DEFAULT_ADMIN_USERNAME);
    }

    const admin = await User.findOne({
      username: input.username,
      role: 'admin',
      isActive: true,
    }).lean().exec();

    if (!admin) {
      throw this.createUnauthorizedError('Invalid admin credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, admin.password);

    if (!isPasswordValid) {
      throw this.createUnauthorizedError('Invalid admin credentials');
    }

    return this.createLoginResponse(admin.username);
  }

  verifyToken(token: string): AdminTokenPayload {
    let decoded: string | JwtPayload;

    try {
      decoded = jwt.verify(token, env.adminJwtSecret);
    } catch {
      throw this.createUnauthorizedError('Invalid admin token');
    }

    if (typeof decoded === 'string' || decoded.role !== 'admin' || typeof decoded.username !== 'string' || typeof decoded.exp !== 'number') {
      throw this.createUnauthorizedError('Invalid admin token');
    }

    return {
      username: decoded.username,
      role: 'admin',
      exp: decoded.exp,
    };
  }

  async seedAdminSetup(): Promise<AdminSeedResponse> {
    if (!this.isMongoConnected()) {
      const menuItemsSeeded = !this.inMemoryAdminSeed.menuItemsSeeded;
      const menuItemsAdded = menuItemsSeeded ? BASIC_MENU_ITEMS.length : 0;

      this.inMemoryAdminSeed.adminSeeded = true;
      this.inMemoryAdminSeed.systemConfigSeeded = true;
      this.inMemoryAdminSeed.menuItemsSeeded = true;
      this.inMemoryAdminSeed.menuItemsAdded += menuItemsAdded;

      return {
        success: true,
        data: {
          adminSeeded: true,
          systemConfigSeeded: true,
          menuItemsSeeded,
          menuItemsAdded,
        },
      };
    }

    const existingAdmin = await User.findOne({ username: DEFAULT_ADMIN_USERNAME }).lean().exec();
    const existingConfig = await SystemConfig.findOne({ key: ADMIN_CONFIG_KEY }).lean().exec();
    const existingMenuItemsConfig = await SystemConfig.findOne({ key: ADDED_MENU_ITEMS_CONFIG_KEY }).lean().exec();

    let adminSeeded = false;
    let systemConfigSeeded = false;
    let menuItemsSeeded = false;
    let menuItemsAdded = 0;

    if (!existingAdmin) {
      await User.create({
        username: DEFAULT_ADMIN_USERNAME,
        email: DEFAULT_ADMIN_EMAIL,
        password: await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS),
        role: 'admin',
        isActive: true,
      });
      adminSeeded = true;
    } else if (!this.isBcryptHash(existingAdmin.password)) {
      await User.updateOne(
        { _id: existingAdmin._id },
        { password: await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS) },
      ).exec();
    }

    if (!existingConfig) {
      await SystemConfig.create({
        key: ADMIN_CONFIG_KEY,
        value: 'seeded',
        description: 'System configuration seeded for admin dashboard bootstrap',
      });
      systemConfigSeeded = true;
    }

    if (!existingMenuItemsConfig) {
      const insertedMenuItems = await MenuItem.insertMany(BASIC_MENU_ITEMS);
      menuItemsSeeded = true;
      menuItemsAdded = insertedMenuItems.length;

      await SystemConfig.create({
        key: ADDED_MENU_ITEMS_CONFIG_KEY,
        value: 'seeded',
        description: 'Basic menu items seeded once for the admin menu catalog',
      });
    }

    return {
      success: true,
      data: {
        adminSeeded,
        systemConfigSeeded,
        menuItemsSeeded,
        menuItemsAdded,
      },
    };
  }

  async getDashboardSummary(): Promise<AdminDashboardResponse> {
    if (!this.isMongoConnected()) {
      return {
        success: true,
        data: {
          adminSeeded: this.inMemoryAdminSeed.adminSeeded,
          menuItemsCount: 0,
          ordersCount: 0,
          customersCount: 0,
          systemConfig: [
            {
              key: ADMIN_CONFIG_KEY,
              value: 'seeded',
            },
            {
              key: ADDED_MENU_ITEMS_CONFIG_KEY,
              value: 'seeded',
            },
          ],
        },
      };
    }

    const [menuItemsCount, customersCount, adminCount, systemConfigs] = await Promise.all([
      MenuItem.countDocuments().exec(),
      User.countDocuments({ role: 'customer' }).exec(),
      User.countDocuments({ role: 'admin' }).exec(),
      SystemConfig.find({}).lean().exec(),
    ]);

    return {
      success: true,
      data: {
        adminSeeded: true,
        menuItemsCount,
        ordersCount: 0,
        customersCount,
        systemConfig: systemConfigs.map((item) => ({
          key: item.key,
          value: item.value,
        })),
      },
    };
  }

  private isMongoConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  private createLoginResponse(username: string): AdminLoginResponse {
    const token = jwt.sign(
      {
        username,
        role: 'admin',
      },
      env.adminJwtSecret,
      {
        expiresIn: env.adminJwtExpiresInSeconds,
      },
    );
    const expiresAt = new Date(Date.now() + env.adminJwtExpiresInSeconds * 1000);

    return {
      success: true,
      data: {
        token,
        admin: {
          username,
          role: 'admin',
        },
        expiresAt: expiresAt.toISOString(),
      },
    };
  }

  private async getInMemoryAdminPasswordHash(): Promise<string> {
    if (!this.inMemoryAdminPasswordHash) {
      this.inMemoryAdminPasswordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS);
    }

    return this.inMemoryAdminPasswordHash;
  }

  private isBcryptHash(value: string): boolean {
    return /^\$2[aby]\$\d{2}\$/.test(value);
  }

  private createUnauthorizedError(message: string): Error & { statusCode?: number } {
    const error = new Error(message) as Error & { statusCode?: number };
    error.statusCode = 401;
    return error;
  }
}

export const adminService = new AdminService();
