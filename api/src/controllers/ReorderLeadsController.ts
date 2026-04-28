import type { Request, Response } from "express";
import { ReorderLeadsService } from "../services/ReorderLeadsService.js";

class ReorderLeadsController {
  async handle(req: Request, res: Response) {
    const { leads } = req.body;

    if (!leads || !Array.isArray(leads)) {
      return res
        .status(400)
        .json({ error: "Formato inválido. Leads deve ser um array" });
    }

    const reorderLeadsService = new ReorderLeadsService();

    const result = await reorderLeadsService.execute({ leads });

    return res.json(result);
  }
}

export { ReorderLeadsController };
