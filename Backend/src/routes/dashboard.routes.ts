import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

export function createDashboardRoutes(
  controller: DashboardController,
  authMiddleware: any
): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get('/', controller.getDashboardData);

  return router;
}
