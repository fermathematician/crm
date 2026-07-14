import { prismaClient } from "../../prisma/index.js";

class UnsubscribeLeadService {
  async execute(leadId: string) {
    if (!leadId) {
      throw new Error("O lini de descadastro está invalido");
    }

    const leadExists = await prismaClient.lead.findUnique({
      where: { id: leadId },
    });

    if (!leadExists) {
      throw new Error("O lead correspondente não foi encontrado no sistema");
    }

    const updatedLead = await prismaClient.lead.update({
      where: { id: leadId },
      data: {
        unsubscribed: true,
        funnelStage: "NOVO",
      },
    });

    return updatedLead;
  }
}

export { UnsubscribeLeadService };
