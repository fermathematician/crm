import { prismaClient } from "../../prisma/index.js";
import { ContactType } from "@prisma/client";

interface CreateContactRequest {
  leadId: string;
  userId: string;
  type: ContactType;
  date: string;
  desc: string;
  didChangeFunnel?: boolean; 
}

class CreateContactService {
  async execute({ leadId, userId, type, date, desc, didChangeFunnel }: CreateContactRequest) {
    if (!leadId || !userId) {
      throw new Error("ID do Lead e do Usuário são obrigatórios.");
    }

    const isoDate = new Date(`${date}T12:00:00Z`);

    const contact = await prismaClient.contact.create({
      data: {
        leadId: leadId,
        userId: userId,
        type: type,
        date: isoDate, 
        description: desc,
        observation: desc,
        didChageFunnel: didChangeFunnel || false 
      }
    });

    return contact;
  }
}

export { CreateContactService };