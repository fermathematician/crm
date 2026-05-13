import { prismaClient } from "../../prisma/index.js";
import { ContactType } from "@prisma/client";

interface GetUserMetricsRequest {
  adminId: string;
  targetUserId: string;
  startDate: string;
  endDate: string;
  visitMode: "ocorrida" | "marcada";
}

class GetUserMetricsService {
  async execute({
    adminId,
    targetUserId,
    startDate,
    endDate,
    visitMode,
  }: GetUserMetricsRequest) {
    const admin = await prismaClient.user.findUnique({
      where: { id: adminId },
    });
    if (admin?.role !== "ADMIN" && adminId != targetUserId) {
      throw new Error("Acesso negado.");
    }

    const user = await prismaClient.user.findUnique({
      where: { id: targetUserId },
      select: { name: true, email: true, role: true },
    });

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    const start = new Date(`${startDate}T00:00:00.000-03:00`);
    const end = new Date(`${endDate}T23:59:59.999-03:00`);

    const validContactTypes: ContactType[] = [
      "EMAIL",
      "CALL",
      "WHATSAPP",
      "NOTE",
    ];

    const totalContacts = await prismaClient.contact.count({
      where: {
        userId: targetUserId,
        type: {
          in: validContactTypes,
        },
        date: { gte: start, lte: end },
      },
    });

    const totalEmails = await prismaClient.contact.count({
      where: {
        userId: targetUserId,
        type: "EMAIL",
        date: { gte: start, lte: end },
      },
    });

    const totalCalls = await prismaClient.contact.count({
      where: {
        userId: targetUserId,
        type: {
          in: ["CALL", "WHATSAPP", "NOTE"] as ContactType[],
        },
        date: { gte: start, lte: end },
      },
    });

    const uniqueLeadsGroup = await prismaClient.contact.groupBy({
      by: ["leadId"],
      where: {
        userId: targetUserId,
        type: {
          in: validContactTypes,
        },
        date: { gte: start, lte: end },
      },
    });
    const uniqueLeadsContacted = uniqueLeadsGroup.length;

    let totalVisits = 0;

    if (visitMode === "marcada") {
      totalVisits = await prismaClient.contact.count({
        where: {
          userId: targetUserId,
          type: "MEETING",
          date: { gte: start, lte: end },
        },
      });
    } else {
      totalVisits = await prismaClient.lead.count({
        where: {
          ownerId: targetUserId,
          visitDate: { gte: start, lte: end },
        },
      });
    }

    const allUserLeads = await prismaClient.lead.findMany({
      where: { ownerId: targetUserId },
      select: { id: true, companyName: true, funnelStage: true, tags: true },
    });

    const leadStatsMap = new Map<string, any>();

    allUserLeads.forEach((lead) => {
      leadStatsMap.set(lead.id, {
        leadId: lead.id,
        leadName: lead.companyName,
        funnel: lead.funnelStage,
        status: lead.tags[0] || "SEM ETIQUETA",
        timesContacted: 0,
        funnelChanges: 0,
        statusChanges: 0,
      });
    });

    const contactsInPeriod = await prismaClient.contact.findMany({
      where: {
        userId: targetUserId,
        date: { gte: start, lte: end },
      },
      include: {
        lead: {
          select: {
            id: true,
            companyName: true,
            funnelStage: true,
            tags: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    contactsInPeriod.forEach((contact) => {
      const leadId = contact.leadId;

      if (!leadStatsMap.has(leadId)) {
        leadStatsMap.set(leadId, {
          leadId: leadId,
          leadName: contact.lead.companyName,
          funnel: contact.lead.funnelStage,
          status: contact.lead.tags[0] || "SEM ETIQUETA",
          timesContacted: 0,
          funnelChanges: 0,
          statusChanges: 0,
        });
      }

      const stats = leadStatsMap.get(leadId);

      if (validContactTypes.includes(contact.type)) {
        stats.timesContacted += 1;
      }

      if (contact.didChageFunnel) {
        stats.funnelChanges += 1;
      }

      if (contact.type === "SYSTEM_CHANGE") {
        stats.statusChanges += 1;
      }
    });

    const analyticalTable = Array.from(leadStatsMap.values());

    return {
      user,
      metrics: {
        totalContacts,
        totalEmails,
        totalCalls,
        uniqueLeadsContacted,
        totalVisits,
      },
      analyticalTable,
    };
  }
}

export { GetUserMetricsService };
