import { prismaClient } from "../../prisma/index.js";

interface VisitRequest {
  visitDate: Date;
  leadId: string;
  userId: string;
}

class CreateVisitService {
  async execute({ visitDate, leadId, userId }: VisitRequest) {
    if (!visitDate) {
      throw new Error("Coloque a data da visita");
    }

    const visit = await prismaClient.visit.create({
      data: {
        visitDate: new Date(visitDate),
        leadId,
        userId,
      },
    });

    return visit;
  }
}

export { CreateVisitService };
