import type { Request, Response } from "express";
import { CheckBouncesService } from "../services/CheckBouncesService.js";

class CheckBouncesController {
  async handle(req: Request, res: Response) {
    const userId = req.user_id;

    if (!userId) {
      return res.status(400).json({ error: "ID de usuário não fornecido" });
    }

    try {
      const checkBouncesService = new CheckBouncesService();
      const result = await checkBouncesService.execute({ userId });

      return res.json({
        sucess: true,
        message: `Verificação concluída. ${result.bouncesProcessados} bounces processados.`,
      });
    } catch (error: any) {
      console.error("Erro ao verrificar bounces", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

export { CheckBouncesController };
