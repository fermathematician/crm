import { prismaClient } from "../../prisma/index.js";

interface ContactRequest {
  contact_id: string;
  description: string;
}

class UpdateContactService {
  async execute({ contact_id, description }: ContactRequest) {
    if (!contact_id) {
      throw new Error("Contato não encontrado");
    }
    const contact = await prismaClient.contact.update({
      where: { id: contact_id },
      data: { description: description },
    });

    return contact;
  }
}

export { UpdateContactService };
