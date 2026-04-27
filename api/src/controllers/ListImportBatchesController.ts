import type { Request, Response } from "express";
import { ListImportBatchesService } from "../services/ListImportBatchesService.js";

export class ListImportBatchesController {
  async handle(eq: Request, res: Response) {
    try {
      const listImportBatchesService = new ListImportBatchesService();
      const batches = await listImportBatchesService.execute();
      return res.json(batches);
    } catch (error) {
      console.error("Erro ao buscar listas: ", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}
