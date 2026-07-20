import { prismaClient } from "../../prisma/index.js";

interface DeleteVisitRequest {
  id: string;
}

class DeleteVisitService {
  async execute({ id }: DeleteVisitRequest) {
    const visit = await prismaClient.visit.delete({
      where: { id: id },
    });
    return visit;
  }
}

export { DeleteVisitService };
