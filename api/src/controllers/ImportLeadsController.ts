import type { Request, Response } from "express";
import { ImportLeadsService } from "../services/ImportLeadsService.js";

class ImportLeadsController {
  async handle(req: Request, res: Response) {
    const userId = req.user_id;
    const file = req.file;
    const tag = req.body.tag;
    const manualStatus = req.body.manualStatus;

    if (!file) {
      return res
        .status(400)
        .json({ error: "Por favor, selecione um arquivo CSV." });
    }

    if (!tag) {
      return res
        .status(400)
        .json({ error: "Por favor, informe a tag/nome da lista" });
    }

    const importLeadsService = new ImportLeadsService();

    try {
      const result = await importLeadsService.execute({
        file,
        userId,
        tag,
        manualStatus,
      });

      return res.json(result);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Falha ao processar arquivo." });
    }
  }
}

export { ImportLeadsController };
