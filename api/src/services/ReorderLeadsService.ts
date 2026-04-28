import { prismaClient } from "../../prisma/index.js";

interface ReorderRequests {
  leads: {
    id: string;
    position: number;
  }[];
}

class ReorderLeadsService {
  async execute({ leads }: ReorderRequests) {
    const queries = leads.map((lead) =>
      prismaClient.lead.update({
        where: { id: lead.id },
        data: { position: lead.position },
      }),
    );

    await prismaClient.$transaction(queries);
    return { success: true, message: "Ordem atualizada com sucesso" };
  }
}

export { ReorderLeadsService };
