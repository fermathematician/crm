import { prismaClient } from "../../prisma/index.js";

interface UpdateVisistRequest {
  id: string;
  visitDate?: Date;
  isCompleted?: boolean;
  leadId?: string;
  userId?: string;
}

class UpdateVisitService {
  async execute({
    id,
    visitDate,
    isCompleted,
    leadId,
    userId,
  }: UpdateVisistRequest) {
    const datatoPush: any = {};

    if (visitDate != undefined) datatoPush.visitDate = new Date(visitDate);
    if (isCompleted != undefined) datatoPush.isCompleted = isCompleted;
    if (leadId != undefined) datatoPush.leadId = leadId;
    if (userId != undefined) datatoPush.userId = userId;

    const visit = await prismaClient.visit.update({
      where: { id: id },
      data: datatoPush,
    });

    return visit;
  }
}

export { UpdateVisitService };
