import type { Request, Response } from 'express';
import { DeleteLeadService } from '../services/DeleteLeadService.js';

class DeleteLeadController {
  async handle(req: Request, res: Response) {
    
    const lead_id = req.params.lead_id as string; 

    const deleteLeadService = new DeleteLeadService();

    const lead = await deleteLeadService.execute({ lead_id });

    return res.json(lead);
  }
}

export { DeleteLeadController };