import type { Request, Response } from "express";
import { GetGlobalMetricsService } from "../services/GetGlobalMetricsService.js";

class GetGlobalMetricsController {
  async handle(req: Request, res: Response) {
    const adminId = req.user_id as string;
    
    const getGlobalMetricsService = new GetGlobalMetricsService();
    const metrics = await getGlobalMetricsService.execute(adminId);

    return res.json(metrics);
  }
}

export { GetGlobalMetricsController };