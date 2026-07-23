import { prismaClient } from "../../prisma/index.js";

class DeleteContactService {
  async execute(id: string) {
    if (!id) throw new Error("ID do contato não fornecido");

    const contact = await prismaClient.contact.delete({
      where: {
        id: id,
      },
    });

    return contact;
  }
}

export { DeleteContactService };
