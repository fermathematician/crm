import type { Request, Response } from "express";
import { UpdateContactService } from "../services/UpdateContactService.js";

class UpdateContactController {
  async handle(req: Request, res: Response) {
    const contact_id = req.body.contact_id || req.body.contactId || req.body.id;
    const description = req.body.description || req.body.observation;

    if (!contact_id || !description) {
      return res
        .status(400)
        .json({ error: "ID e descrição são obrigatórios." });
    }

    const updateContactService = new UpdateContactService();

    const contact = await updateContactService.execute({
      contact_id,
      description,
    });

    return res.json(contact);
  }
}

export { UpdateContactController };
