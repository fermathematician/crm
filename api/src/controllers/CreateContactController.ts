import type { Request, Response } from "express";
import { CreateContactService } from "../services/CreateContactService.js";

class CreateContactController {
  async handle(req: Request, res: Response) {
    // Usamos o "as string" para garantir ao TypeScript o formato correto
    const leadId = req.params.id as string; 
    
    const { type, date, desc } = req.body;
    
    // Garantindo o formato do userId também
    const userId = req.user_id as string; 

    const createContactService = new CreateContactService();

    const contact = await createContactService.execute({
      leadId,
      userId,
      type,
      date,
      desc
    });

    return res.json(contact);
  }
}

export { CreateContactController };