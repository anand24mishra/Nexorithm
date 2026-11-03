import { Router, RequestHandler } from "express";
import { DashboardController } from "../controllers/dashboard.controller";

export function createDashboardRoutes(
  controller: DashboardController,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.use(authMiddleware);

  router.get("/", controller.getDashboardData);

  return router;
}
