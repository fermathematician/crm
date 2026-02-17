import { prismaClient } from "../../prisma/index.js";

class ListLeadsService {
  async execute(userId: string) {
    
    const leads = await prismaClient.lead.findMany({
      where: {
        ownerId: userId
      },
      orderBy: {
        companyName: 'asc'
      }
    });

    return leads;
  }
}

export { ListLeadsService }