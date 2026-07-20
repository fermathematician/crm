import { prismaClient } from "../../prisma/index.js";

interface UpdateNotification {
  id: string;
  notifyDate?: string;
  message?: string;
  isCompleted?: boolean;
  isOcult?: boolean;
  leadId?: string;
  userId?: string;
}

class UpdateNotificationService {
  async execute({
    id,
    notifyDate,
    message,
    isCompleted,
    isOcult,
    leadId,
    userId,
  }: UpdateNotification) {
    const dataToUpdate: any = {};

    if (notifyDate !== undefined)
      dataToUpdate.notifyDate = new Date(notifyDate);
    if (message !== undefined) dataToUpdate.message = message;
    if (isCompleted !== undefined) dataToUpdate.isCompleted = isCompleted;
    if (isOcult !== undefined) dataToUpdate.isOcult = isOcult;
    if (leadId !== undefined) dataToUpdate.leadId = leadId;
    if (userId !== undefined) dataToUpdate.userId = userId;

    const notification = await prismaClient.notification.update({
      where: { id: id },
      data: dataToUpdate,
    });

    return notification;
  }
}

export { UpdateNotificationService };
