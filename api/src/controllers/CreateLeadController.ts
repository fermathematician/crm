import type { Request, Response } from "express";
import { CreateLeadService } from "../services/CreateLeadService.js";

class CreateLeadController {
  async handle(req: Request, res: Response) {
    const {
      companyName,
      cnpj,
      cnae,
      phone,
      email,
      city,
      state,
      address,
      comercial,
      financeiro,
      funnelStage,
      tags,
    } = req.body;

    const ownerId = req.user_id;

    const createLeadService = new CreateLeadService();

    const lead = await createLeadService.execute({
      companyName,
      cnpj,
      cnae,
      phone,
      email,
      city,
      state,
      address,
      comercial,
      financeiro,
      funnelStage,
      tags,
      ownerId,
    });

    return res.json(lead);
  }
}

export { CreateLeadController };
