import { prismaClient } from "../../prisma/index.js";

interface NotificationRequest {
  notifyDate: Date;
  message: string;
  leadId: string;
  userId: string;
}

class CreateNotificationService {
  async execute({ notifyDate, message, leadId, userId }: NotificationRequest) {
    if (!notifyDate) {
      throw new Error("Você precisa inserir uma data de notificação");
    }

    if (!message) {
      throw new Error("Você precisa inserir uma mensagem");
    }

    const notification = await prismaClient.notification.create({
      data: {
        notifyDate,
        message,
        leadId,
        userId,
      },
    });

    return notification;
  }
}

export { CreateNotificationService };
