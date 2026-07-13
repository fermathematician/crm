import { prismaClient } from "../../prisma/index.js";

interface UpdateLeadRequest {
  lead_id: string;
  companyName?: string;
  cnpj?: string;
  cnae?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  financeiro?: string;
  funnelStage?:
    | "NOVO"
    | "CONTATO"
    | "NEGOCIACAO"
    | "CADASTRO"
    | "FINALIZADO"
    | "SEM_INTERESSE";
  tags?: string[];
  visitDate?: string | null;
}

class UpdateLeadService {
  async execute({
    lead_id,
    companyName,
    cnpj,
    cnae,
    phone,
    email,
    city,
    state,
    address,
    financeiro,
    funnelStage,
    tags,
    visitDate,
  }: UpdateLeadRequest) {
    if (!lead_id) {
      throw new Error("ID do Lead não fornecido.");
    }

    const dataToUpdate: any = {};

    if (companyName !== undefined) dataToUpdate.companyName = companyName;
    if (cnpj !== undefined) dataToUpdate.cnpj = cnpj;
    if (cnae !== undefined) dataToUpdate.cnae = cnae;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (email !== undefined) dataToUpdate.email = email;
    if (city !== undefined) dataToUpdate.city = city;
    if (state !== undefined) dataToUpdate.state = state;
    if (address !== undefined) dataToUpdate.address = address;
    if (financeiro !== undefined) dataToUpdate.financeiro = financeiro;
    if (funnelStage !== undefined) dataToUpdate.funnelStage = funnelStage;
    if (tags !== undefined) dataToUpdate.tags = tags;

    if (visitDate !== undefined) {
      dataToUpdate.visitDate = visitDate ? new Date(visitDate) : null;
    }

    const lead = await prismaClient.lead.update({
      where: {
        id: lead_id,
      },
      data: dataToUpdate,
    });

    return lead;
  }
}

export { UpdateLeadService };
