import { prismaClient } from "../../prisma/index.js";
import { CreateVisitService } from "../services/CreateVisitService.js";
import type { Request, Response } from "express";

class CreateVisitController {
  async handle(req: Request, res: Response) {
    const { visitDate, leadId, userId } = req.body;

    const createVisitService = new CreateVisitService();

    const visit = await createVisitService.execute({
      visitDate,
      leadId,
      userId,
    });

    return res.json(visit);
  }
}

export { CreateVisitController };
