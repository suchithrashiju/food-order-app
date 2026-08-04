import { Router } from 'express';

import { adminAuthMiddleware } from '@src/middlewares/adminAuth.middleware';
import { adminController } from '@src/modules/admin-modules/admin/admin.controller';
import { menuItemsController } from '@src/modules/admin-modules/menu-items/menuItems.controller';
import { menuController } from '@src/modules/menu/menu.controller';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
  });
});

router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Food Order API is running',
  });
});

router.get('/menu', menuController.getMenuItems.bind(menuController));
router.get('/menu/:id', menuController.getMenuItemById.bind(menuController));

router.post('/admin/login', adminController.login.bind(adminController));
router.post('/admin/seed', adminController.seed.bind(adminController));
router.get('/admin/dashboard', adminAuthMiddleware, adminController.getDashboard.bind(adminController));

router.get('/admin/menu-items', adminAuthMiddleware, menuItemsController.list.bind(menuItemsController));
router.post('/admin/menu-items', adminAuthMiddleware, menuItemsController.create.bind(menuItemsController));
router.patch('/admin/menu-items/:id', adminAuthMiddleware, menuItemsController.update.bind(menuItemsController));
router.delete('/admin/menu-items/:id', adminAuthMiddleware, menuItemsController.softDelete.bind(menuItemsController));
router.patch('/admin/menu-items/:id/status', adminAuthMiddleware, menuItemsController.changeStatus.bind(menuItemsController));

export default router;
