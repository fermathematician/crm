import type { Request, Response } from 'express';
import { ListLeadsService } from '../services/ListLeadsService.js';

class ListLeadsController {
  async handle(req: Request, res: Response) {
    
    const userId = req.user_id;

    const listLeadsService = new ListLeadsService();

    const leads = await listLeadsService.execute(userId);

    return res.json(leads);
  }
}

export { ListLeadsController }