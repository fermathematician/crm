import type { Request, Response } from "express";
import { UpdateContactService } from "../services/UpdateContactService.js";

class UpdateContactController {
  async handle(req: Request, res: Response) {
    const { contact_id, description } = req.body;

    const updateContactService = new UpdateContactService();

    const contact = await updateContactService.execute({
      contact_id,
      description,
    });

    return res.json(contact);
  }
}

export { UpdateContactController };
