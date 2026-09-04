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
      where: {id: adminId},
    });
    if (admin?.role !== "ADMIN" && adminId != targetUserId) {
      throw new Error("Acesso negado.");
    }

    const user = await prismaClient.user.findUnique({
      where: {id: targetUserId},
      select: {name: true, email: true, role: true},
    });

    if (!user) {
      throw new Error("Usuário não encontrado.");
    }

    const start = new Date(`${startDate}T00:00:00.000Z`); //pra ajustar o filtro tirei o UTC ja que o log salva como 00h
    const end = new Date(`${endDate}T23:59:59.999Z`);

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
        date: {gte: start, lte: end},
      },
    });

    const totalEmails = await prismaClient.contact.count({
      where: {
        userId: targetUserId,
        type: "EMAIL",
        date: {gte: start, lte: end},
      },
    });

    // Contagem de Ligações e WhatsApp (SEM as notas)
    const totalCalls = await prismaClient.contact.count({
      where: {
        userId: targetUserId,
        type: {
          in: ["CALL"] as ContactType[],
        },
        date: {gte: start, lte: end},
      },
    });

    const totalWhatsApp = await prismaClient.contact.count({
      where: {
        userId: targetUserId,
        type: {
          in: ["WHATSAPP"] as ContactType[],
        },
        date: {gte: start, lte: end},
      }
    })


    // 🚀 NOVO: Contagem exclusiva de Observações
    const totalNotes = await prismaClient.contact.count({
      where: {
        userId: targetUserId,
        type: "NOTE",
        date: {gte: start, lte: end},
      },
    });


    const uniqueLeadsGroup = await prismaClient.contact.groupBy({
      by: ["leadId"],
      where: {
        userId: targetUserId,
        type: {
          in: validContactTypes,
        },
        date: {gte: start, lte: end},
      },
    });
    const uniqueLeadsContacted = uniqueLeadsGroup.length;

    const uniqueVisitsGroup = await prismaClient.visit.groupBy({
      by: ["leadId"],
      where: {
        userId: targetUserId,
        ...(visitMode === "marcada"
            ? {
              // MARCADA: Criada no sistema dentro do período
              createdAt: { gte: start, lte: end },
            }
            : {
              // OCORRIDA: Visita agendada para o período
              visitDate: { gte: start, lte: end },
            }),
      },
    });

    // A quantidade de itens no array é o total de clientes únicos com visita
    const totalVisits = uniqueVisitsGroup.length;

    const allUserLeads = await prismaClient.lead.findMany({
      where: {ownerId: targetUserId},
      select: {id: true, companyName: true, funnelStage: true, tags: true},
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
        qualifications: 0,
      });
    });

    // Busca os contatos do período no banco de dados
    const contactsInPeriod = await prismaClient.contact.findMany({
      where: {
        userId: targetUserId,
        date: {gte: start, lte: end},
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

// 1. Declara a variável ANTES do loop (no escopo da função principal)
    let totalQualifications = 0;
    let totalListaQuente = 0;
    const qualificationsTable: any[] = [];

    // 2. Percorre os contatos do período uma única vez
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
          qualifications: 0,
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

        const desc = (contact.description || "").toLowerCase();
        const arrowRegex = /➔|->|→|=>/;

        if (arrowRegex.test(desc)) {
          const parts = desc.split(arrowRegex);
          const origin = (parts[0] ?? "").trim();
          const target = (parts[1] ?? "").trim();

          if (target.includes("lista quente")) {
            totalListaQuente++;
          }

          // 1. Vetor com as 7 Etapas do Funil
          const funnelStages = [
            "novo",
            "contato",
            "negociacao",
            "negociação",
            "cadastro",
            "finalizado",
            "finalizados",
            "sem_interesse",
            "perdidos",
            "fora_de_perfil",
            "descartado"
          ];

          // 2. Vetor com as Etiquetas da fase inicial
          const novoTags = ["a qualificar", "novo"];

          // REGRA A: Troca de Etiqueta (Saindo de "a qualificar")
          const isTagChange = desc.includes("etiqueta");
          const isFromAQualificarTag = origin.includes("a qualificar");
          const isToAnotherTag = !target.includes("a qualificar") && target.length > 0;

          // REGRA B: Troca de Funil (Saindo da etapa "NOVO" para outra etapa)
          const isFunnelChange = desc.includes("funil") || contact.didChageFunnel;
          const isFromNovoStage = origin.includes("novo") || origin.includes("a qualificar");
          const isToAnotherStage = funnelStages.some((stage) => target.includes(stage)) && !target.includes("novo");

          // Contabiliza se atender à troca de etiqueta OU à troca de funil
          if (
              (isTagChange && isFromAQualificarTag && isToAnotherTag) ||
              (isFunnelChange && isFromNovoStage && isToAnotherStage)
          ) {
            stats.qualifications = (stats.qualifications || 0) + 1;
            totalQualifications += 1;

            qualificationsTable.push({
              id: contact.id,
              leadId: contact.leadId,
              leadName: contact.lead?.companyName || "Lead sem nome",
              logDate: contact.date,
              createdAt: contact.createdAt,
              description: contact.description,
            });
          }
        }
      }
    });

    const analyticalTable = Array.from(leadStatsMap.values()).filter(
        (lead) =>
            lead.timesContacted > 0 ||
            lead.funnelChanges > 0 ||
            lead.statusChanges > 0 ||
            lead.qualifications > 0,
    );

    // Agrupamento por Etapa de Funil e Status (apenas dos leads ativos no período)
    const funnelSummary: Record<string, number> = {};
    const statusSummary: Record<string, number> = {};

    analyticalTable.forEach((lead) => {
      if (lead.funnel) {
        funnelSummary[lead.funnel] = (funnelSummary[lead.funnel] || 0) + 1;
      }
      if (lead.status) {
        statusSummary[lead.status] = (statusSummary[lead.status] || 0) + 1;
      }
    });

    // Busca todas as visitas do período (criadas ou agendadas no intervalo) para auditoria visual
    const visitsInPeriod = await prismaClient.visit.findMany({
      where: {
        userId: targetUserId,
        OR: [
          { createdAt: { gte: start, lte: end } },
          { visitDate: { gte: start, lte: end } },
        ],
      },
      include: {
        lead: {
          select: { id: true, companyName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const visitsTable = visitsInPeriod.map((v) => ({
      id: v.id,
      leadId: v.leadId,
      leadName: v.lead?.companyName || "Lead sem nome",
      createdAt: v.createdAt,
      visitDate: v.visitDate,
      isCompleted: v.isCompleted,
    }));

    return {
      user,
      metrics: {
        totalContacts,
        totalEmails,
        totalCalls,
        totalWhatsApp,
        totalNotes,
        uniqueLeadsContacted,
        totalVisits,
        totalQualifications,
        totalListaQuente,
      },
      funnelSummary,
      statusSummary,
      analyticalTable,
      visitsTable,
      qualificationsTable,
    };
  }
}

export { GetUserMetricsService };
