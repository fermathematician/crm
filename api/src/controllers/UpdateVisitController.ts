import { UpdateVisitService } from "../services/UpdateVisitService.js";
import type { Request, Response } from "express";

class UpdateVisitController {
  async handle(req: Request, res: Response) {
    const { id, visitDate, isCompleted, leadId, userId } = req.body;
    const updateVisitService = new UpdateVisitService();
    const visit = await updateVisitService.execute({
      id,
      visitDate,
      isCompleted,
      leadId,
      userId,
    });

    return res.json(visit);
  }
}

export { UpdateVisitController };
