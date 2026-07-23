import type { Request, Response } from "express";
import { CreateContactService } from "../services/CreateContactService.js";

class CreateContactController {
  async handle(req: Request, res: Response) {
    const { type, date, description, didChangeFunnel } = req.body;
    const leadId = req.params.id as string;
    const userId = req.user_id as string;

    const createContactService = new CreateContactService();

    const contact = await createContactService.execute({
      leadId,
      userId,
      type,
      date,
      desc: description,
      didChangeFunnel,
    });

    return res.json(contact);
  }
}

export { CreateContactController };
