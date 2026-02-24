import type { Request, Response } from "express";
import { GetUserMetricsService } from "../services/GetUserMetricsService.js";

class GetUserMetricsController {
  async handle(req: Request, res: Response) {
    const adminId = req.user_id as string;
    
    const targetUserId = req.params.id as string;

    const getUserMetricsService = new GetUserMetricsService();
    const metrics = await getUserMetricsService.execute(adminId, targetUserId);

    return res.json(metrics);
  }
}

export { GetUserMetricsController };