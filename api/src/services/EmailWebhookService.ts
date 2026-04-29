import { PrismaClient } from "@prisma/client/extension";
import { prismaClient } from "../../prisma/index.js";
import { isSymbolObject } from "node:util/types";

interface WebhookRequest {
  email: string;
  eventType: string;
}

class EmailWebhookService {
  async execute({ email, eventType }: WebhookRequest) {
    const lead = await prismaClient.lead.findFirst({
      where: { email: email },
      orderBy: { createdAt: "desc" },
    });

    if (!lead) {
      return { message: "Lead não encontrado para esse email" };
    }

    const isNovo = lead.funnelStage === "NOVO" && lead.tags.includes("novo");
    const isSemResposta =
      lead.funnelStage === "CONTATO" && lead.tags.includes("sem resposta");

    if (eventType.includes("bounce") && (isNovo || isSemResposta)) {
      await prismaClient.lead.update({
        where: { id: lead.id },
        data: { tags: ["a qualificar"] },
      });
      await this.logActivity(
        lead.id,
        lead.ownerId,
        "Automação: E-mail retornou (Bounce). Tag alterada para 'A Qualificar'.",
      );
      return { message: "Lead movido para 'A Qualificar' devido a Bounce" };
    }

    if (
      eventType.includes("reply") ||
      (eventType.includes("inbound") && isSemResposta)
    ) {
      await prismaClient.lead.update({
        where: { id: lead.id },
        data: { tags: ["respondidos"] },
      });

      await this.logActivity(
        lead.id,
        lead.ownerId,
        "Automação: Cliente respondeu. Tag alterada para 'Respondido'",
      );
      return { message: "Lead marcado como respondido" };
    }
    return {
      message: "Evento recebido, mas nenhuma regra de automação aplicada",
    };
  }

  private async logActivity(
    leadId: string,
    userId: string,
    description: string,
  ) {
    await prismaClient.contact.create({
      data: {
        type: "SYSTEM_CHANGE",
        date: new Date(),
        description,
        leadId,
        userId,
      },
    });
  }
}

export { EmailWebhookService };
