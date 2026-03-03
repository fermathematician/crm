import type { Request, Response } from "express";
import { ImportLeadsService } from "../services/ImportLeadsService.js";

class ImportLeadsController {
  async handle(req: Request, res: Response) {
    const userId = req.user_id; 
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Por favor, selecione um arquivo CSV." });
    }

    const importLeadsService = new ImportLeadsService();

    try {
      const result = await importLeadsService.execute({
        file,
        userId
      });

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Falha ao processar arquivo." });
    }
  }
}

export { ImportLeadsController };