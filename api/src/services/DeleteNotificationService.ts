import { prismaClient } from "../../prisma/index.js";

interface DeleteNotificationRequest {
  id: string;
}

class DeleteNotificationService {
  async execute({ id }: DeleteNotificationRequest) {
    const notification = await prismaClient.notification.delete({
      where: { id: id },
    });

    return notification;
  }
}

export { DeleteNotificationService };
