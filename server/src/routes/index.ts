import { Router } from 'express';

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

export default router;
