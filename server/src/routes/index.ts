import { Router, type Request, type Response } from 'express';

import { adminAuthMiddleware } from '@src/middlewares/adminAuth.middleware';
import { adminController } from '@src/modules/admin-modules/admin/admin.controller';
import { menuItemsController } from '@src/modules/admin-modules/menu-items/menuItems.controller';
import { menuController } from '@src/modules/menu/menu.controller';
import { orderController } from '@src/modules/order/order.controller';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
  });
});

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Food Order API is running',
  });
});

router.get('/menu', menuController.getMenuItems.bind(menuController));
router.get('/menu/:id', menuController.getMenuItemById.bind(menuController));

router.post('/orders', orderController.create.bind(orderController));
router.get('/orders/:id', orderController.getById.bind(orderController));

router.post('/admin/login', adminController.login.bind(adminController));
router.post('/admin/seed', adminController.seed.bind(adminController));
router.get('/admin/dashboard', adminAuthMiddleware, adminController.getDashboard.bind(adminController));
router.get('/admin/orders/stats', adminAuthMiddleware, orderController.dashboard.bind(orderController));
router.get('/admin/orders', adminAuthMiddleware, orderController.list.bind(orderController));
router.patch('/admin/orders/:id/status', adminAuthMiddleware, orderController.updateStatus.bind(orderController));

router.get('/admin/menu-items', adminAuthMiddleware, menuItemsController.list.bind(menuItemsController));
router.post('/admin/menu-items', adminAuthMiddleware, menuItemsController.create.bind(menuItemsController));
router.patch('/admin/menu-items/:id', adminAuthMiddleware, menuItemsController.update.bind(menuItemsController));
router.delete('/admin/menu-items/:id', adminAuthMiddleware, menuItemsController.softDelete.bind(menuItemsController));
router.patch('/admin/menu-items/:id/status', adminAuthMiddleware, menuItemsController.changeStatus.bind(menuItemsController));

export default router;
