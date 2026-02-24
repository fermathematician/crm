import { prismaClient } from "../../prisma/index.js";

class GetGlobalMetricsService {
  async execute(adminId: string) {
    const admin = await prismaClient.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== 'ADMIN') {
      throw new Error("Acesso negado.");
    }

    // Conta os totais no banco de dados de forma rápida
    const totalLeads = await prismaClient.lead.count();
    
    const closedLeads = await prismaClient.lead.count({
      where: { funnelStage: 'FINALIZADO' }
    });
    
    const negotiationLeads = await prismaClient.lead.count({
      where: { funnelStage: 'NEGOCIACAO' }
    });

    return { totalLeads, closedLeads, negotiationLeads };
  }
}

export { GetGlobalMetricsService };