import type { Request, Response } from "express";
import { DeleteVisitService } from "../services/DeleteVisitService.js";

class DeleteVisitController {
  async handle(req: Request, res: Response) {
    const id = req.query.id as string;
    const deleteVisitService = new DeleteVisitService();
    const visit = await deleteVisitService.execute({ id });

    return res.json(visit);
  }
}

export { DeleteVisitController };
