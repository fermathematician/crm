import type { Request, Response } from 'express';
import { UpdateLeadService } from '../services/UpdateLeadService.js';

class UpdateLeadController {
  async handle(req: Request, res: Response) {
    const { 
      lead_id, 
      companyName, 
      cnpj, 
      cnae, 
      phone, 
      email, 
      city, 
      state, 
      address, 
      funnelStage, 
      tags,
      visitDate 
    } = req.body;

    const updateLeadService = new UpdateLeadService();

    const lead = await updateLeadService.execute({
      lead_id,
      companyName,
      cnpj,
      cnae,
      phone,
      email,
      city,
      state,
      address,
      funnelStage,
      tags,
      visitDate 
    });

    return res.json(lead);
  }
}

export { UpdateLeadController };