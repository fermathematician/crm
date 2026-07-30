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
  comercial?: string;
  financeiro?: string;
  funnelStage?:
    | "NOVO"
    | "CONTATO"
    | "NEGOCIACAO"
    | "CADASTRO"
    | "FINALIZADO"
    | "SEM_INTERESSE";
  tags?: string[];
  unsubscribed?: boolean;
  bounced?: boolean;
  visitDate?: Date | null;
  importBatchId?: string | null; // 🚀 Adicionado
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
    comercial,
    financeiro,
    funnelStage,
    tags,
    unsubscribed,
    bounced,
    importBatchId,
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
    if (comercial !== undefined) dataToUpdate.comercial = comercial;
    if (financeiro !== undefined) dataToUpdate.financeiro = financeiro;
    if (funnelStage !== undefined) dataToUpdate.funnelStage = funnelStage;
    if (tags !== undefined) dataToUpdate.tags = tags;
    if (unsubscribed !== undefined) dataToUpdate.unsubscribed = unsubscribed;
    if (bounced !== undefined) dataToUpdate.bounced = bounced;

    if (importBatchId !== undefined) dataToUpdate.importBatchId = importBatchId;

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
