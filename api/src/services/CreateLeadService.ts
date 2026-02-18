import { prismaClient } from "../../prisma/index.js";

interface LeadRequest {
  companyName: string;
  cnpj?: string;
  cnae?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  funnelStage?: "NOVO" | "CONTATO" | "NEGOCIACAO" | "CADASTRO" | "FINALIZADO" | "SEM_INTERESSE";
  tags?: string[];
  visitDate?: string; 
  ownerId: string; 
}

class CreateLeadService {
  async execute({
    companyName,
    cnpj,
    cnae,
    phone,
    email,
    city,
    state,
    address,
    funnelStage = "NOVO", 
    tags = ["novo"],   
    visitDate,
    ownerId
  }: LeadRequest) {
    
    if (!companyName) {
      throw new Error("O nome da empresa (Razão Social) é obrigatório.");
    }

    if (cnpj) {
      const leadExists = await prismaClient.lead.findUnique({
        where: { cnpj }
      });

      if (leadExists) {
        throw new Error("Já existe um Lead cadastrado com este CNPJ.");
      }
    }

    const lead = await prismaClient.lead.create({
      data: {
        companyName,
        cnpj: cnpj || null,
        cnae: cnae || null,
        phone: phone || null,
        email: email || null,
        city: city || null,
        state: state || null,
        address: address || null,
        funnelStage,
        tags,
        visitDate: visitDate ? new Date(visitDate) : null, // <-- 3. CONVERSÃO ADICIONADA AQUI
        ownerId 
      }
    });

    return lead;
  }
}

export { CreateLeadService };