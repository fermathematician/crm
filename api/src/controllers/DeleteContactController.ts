import type { Request, Response } from "express";
import { DeleteContactService } from "../services/DeleteContactService.js";

class DeleteContactController {
  async handle(req: Request, res: Response) {
    // Pega o ID da URL (ex: ?id=1234)
    const id = req.query.id as string;

    const deleteContactService = new DeleteContactService();
    await deleteContactService.execute(id);

    return res.json({ message: "Contato deletado com sucesso" });
  }
}

export { DeleteContactController };
