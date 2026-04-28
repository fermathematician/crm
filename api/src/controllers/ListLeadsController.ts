import type { Request, Response } from "express";
import { ListLeadsService } from "../services/ListLeadsService.js";

class ListLeadsController {
  async handle(req: Request, res: Response) {
    const userId = req.user_id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || "";
    const stage = (req.query.stage as string) || "ALL";
    const importBatchId = (req.query.importBatchId as string) || "";
    const isManual = (req.query.isManual as string) || "";
    const globalFilter = (req.query.globalFilter as string) || "";

    const listLeadsService = new ListLeadsService();

    const result = await listLeadsService.execute({
      userId,
      page,
      limit,
      search,
      stage,
      importBatchId,
      isManual,
      globalFilter,
    });

    return res.json(result);
  }
}

export { ListLeadsController };
