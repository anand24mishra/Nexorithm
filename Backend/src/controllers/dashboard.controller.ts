import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  getDashboardData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId =
        (req as Request & { user?: { userId: string } }).user?.userId ??
        'anonymous';

      const dashboardData = await this.dashboardService.getDashboardData(userId);
      res.status(200).json(dashboardData);
    } catch (error) {
      next(error);
    }
  };
}
