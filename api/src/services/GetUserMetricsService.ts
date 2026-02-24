import { prismaClient } from "../../prisma/index.js";

class GetUserMetricsService {
  async execute(adminId: string, targetUserId: string) {
    const admin = await prismaClient.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== 'ADMIN') {
      throw new Error("Acesso negado.");
    }

    const user = await prismaClient.user.findUnique({
      where: { id: targetUserId },
      select: { name: true, email: true, role: true }
    });

    const totalLeads = await prismaClient.lead.count({
      where: { ownerId: targetUserId }
    });

    const leadsByStage = await prismaClient.lead.groupBy({
      by: ['funnelStage'],
      where: { ownerId: targetUserId },
      _count: { id: true }
    });

    const totalInteractions = await prismaClient.contact.count({
      where: { userId: targetUserId }
    });

    return {
      user,
      totalLeads,
      totalInteractions,
      leadsByStage: leadsByStage.map(stage => ({
        stage: stage.funnelStage,
        count: stage._count.id
      }))
    };
  }
}

export { GetUserMetricsService };