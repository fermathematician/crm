import { prismaClient } from "../../prisma/index.js";

interface DeleteLeadRequest {
  lead_id: string;
}

class DeleteLeadService {
  async execute({ lead_id }: DeleteLeadRequest) {
    if (!lead_id) {
      throw new Error("ID do Lead não fornecido.");
    }

    // Tenta encontrar e deletar o Lead
    try {
      const lead = await prismaClient.lead.delete({
        where: {
          id: lead_id
        }
      });

      return lead;
    } catch (error) {
      throw new Error("Lead não encontrado ou já foi excluído.");
    }
  }
}

export { DeleteLeadService };