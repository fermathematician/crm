import type { Request, Response } from "express";
import { GetUserMetricsService } from "../services/GetUserMetricsService.js";

class GetUserMetricsController {
  async handle(req: Request, res: Response) {
    const adminId = req.user_id as string;
    const targetUserId = req.params.id as string;
    
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const visitMode = req.query.visitMode as 'ocorrida' | 'marcada';

    if (!startDate || !endDate || !visitMode) {
      return res.status(400).json({ error: "Faltam parâmetros de filtro (startDate, endDate ou visitMode)" });
    }

    const getUserMetricsService = new GetUserMetricsService();
    const metrics = await getUserMetricsService.execute({
      adminId, 
      targetUserId,
      startDate,
      endDate,
      visitMode
    });

    return res.json(metrics);
  }
}

export { GetUserMetricsController };