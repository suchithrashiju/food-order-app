import bcrypt from 'bcrypt';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';

import { env, isProduction } from '@src/config/env';
import { SEED_MENU_ITEMS } from '@src/data/menu.seed';
import { MenuItem } from '@src/models/menu.model';
import { SystemConfig } from '@src/models/systemConfig.model';
import { User } from '@src/models/user.model';
import type { AdminLoginInput, SeedAdminInput } from '@src/modules/admin-modules/admin/admin.validation';
import { menuItemsService } from '@src/modules/admin-modules/menu-items/menuItems.service';
import { forbidden, unauthorized } from '@src/utils/httpError';

const BCRYPT_SALT_ROUNDS = 10;
const ADMIN_CONFIG_KEY = 'ADMINCONFIG';
const ADDED_MENU_ITEMS_CONFIG_KEY = 'ADDED_MENU_ITEMS';

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

      if (input.username !== env.adminUsername || !isPasswordValid) {
        throw unauthorized('Invalid admin credentials');
      }

      return this.createLoginResponse(env.adminUsername);
    }

    const admin = await User.findOne({
      username: input.username,
      role: 'admin',
      isActive: true,
    }).lean().exec();

    if (!admin) {
      throw unauthorized('Invalid admin credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, admin.password);

    if (!isPasswordValid) {
      throw unauthorized('Invalid admin credentials');
    }

    return this.createLoginResponse(admin.username);
  }

  verifyToken(token: string): AdminTokenPayload {
    let decoded: string | JwtPayload;

    try {
      decoded = jwt.verify(token, env.adminJwtSecret);
    } catch {
      throw unauthorized('Invalid admin token');
    }

    if (typeof decoded === 'string' || decoded.role !== 'admin' || typeof decoded.username !== 'string' || typeof decoded.exp !== 'number') {
      throw unauthorized('Invalid admin token');
    }

    return {
      username: decoded.username,
      role: 'admin',
      exp: decoded.exp,
    };
  }

  assertSeedAccess(input: SeedAdminInput): void {
    if (env.seedSecret) {
      if (input.seedSecret !== env.seedSecret) {
        throw forbidden('Invalid seed secret');
      }
      return;
    }

    if (isProduction) {
      throw forbidden('Seeding is disabled in production without SEED_SECRET');
    }
  }

  async seedAdminSetup(): Promise<AdminSeedResponse> {
    if (!this.isMongoConnected()) {
      const menuItemsSeeded = !this.inMemoryAdminSeed.menuItemsSeeded;
      // Shared in-memory store — seed once for both public menu and admin CRUD.
      const menuItemsAdded = menuItemsSeeded
        ? menuItemsService.seedInMemoryItems([...SEED_MENU_ITEMS])
        : 0;

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

    const existingAdmin = await User.findOne({ username: env.adminUsername }).lean().exec();
    const existingConfig = await SystemConfig.findOne({ key: ADMIN_CONFIG_KEY }).lean().exec();
    const existingMenuItemsConfig = await SystemConfig.findOne({ key: ADDED_MENU_ITEMS_CONFIG_KEY }).lean().exec();

    let adminSeeded = false;
    let systemConfigSeeded = false;
    let menuItemsSeeded = false;
    let menuItemsAdded = 0;

    if (!existingAdmin) {
      await User.create({
        username: env.adminUsername,
        email: env.adminEmail,
        password: await bcrypt.hash(env.adminPassword, BCRYPT_SALT_ROUNDS),
        role: 'admin',
        isActive: true,
      });
      adminSeeded = true;
    } else if (!this.isBcryptHash(existingAdmin.password)) {
      await User.updateOne(
        { _id: existingAdmin._id },
        { password: await bcrypt.hash(env.adminPassword, BCRYPT_SALT_ROUNDS) },
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
      const existingMenuCount = await MenuItem.countDocuments({ isDeleted: false }).exec();

      if (existingMenuCount === 0) {
        const insertedMenuItems = await MenuItem.insertMany(SEED_MENU_ITEMS);
        menuItemsAdded = insertedMenuItems.length;
      }

      menuItemsSeeded = true;

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
          menuItemsCount: menuItemsService.getInMemoryActiveCount(),
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
      MenuItem.countDocuments({ isDeleted: false }).exec(),
      User.countDocuments({ role: 'customer' }).exec(),
      User.countDocuments({ role: 'admin', isActive: true }).exec(),
      SystemConfig.find({}).lean().exec(),
    ]);

    return {
      success: true,
      data: {
        adminSeeded: adminCount > 0,
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
      this.inMemoryAdminPasswordHash = await bcrypt.hash(env.adminPassword, BCRYPT_SALT_ROUNDS);
    }

    return this.inMemoryAdminPasswordHash;
  }

  private isBcryptHash(value: string): boolean {
    return /^\$2[aby]\$\d{2}\$/.test(value);
  }
}

export const adminService = new AdminService();
