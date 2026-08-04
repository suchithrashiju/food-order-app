import { Router } from 'express';

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

export default router;
