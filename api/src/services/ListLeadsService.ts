import { prismaClient } from "../../prisma/index.js";

interface ListLeadsParams {
  userId: string;
  page: number;
  limit: number;
  search: string;
  stage: string;
  importBatchId?: string;
  isManual?: string;
  globalFilter?: string;
  ownerId?: string;
  tag?: string;
}

class ListLeadsService {
  async execute({
    userId,
    page,
    limit,
    search,
    stage,
    importBatchId,
    isManual,
    globalFilter,
    ownerId,
    tag,
  }: ListLeadsParams) {
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    const andCondition: any[] = [];

    if (search) {
      andCondition.push({
        OR: [
          { companyName: { contains: search, mode: "insensitive" } },
          { cnpj: { contains: search } },
          { phone: { contains: search } },
          { email: { contains: search } },
        ],
      });
    }

    if (stage && stage !== "ALL") {
      andCondition.push({ funnelStage: stage });
    }

    //filtro listas
    if (isManual === "true") {
      andCondition.push({ ImportBatchId: null });
    } else if (importBatchId && importBatchId != "all") {
      andCondition.push({ ImportBatchId: importBatchId });
    }

    if (globalFilter === "overdue") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      andCondition.push({
        createdAt: {
          lte: thirtyDaysAgo,
        },
      });

      andCondition.push({
        contacs: {
          none: {
            type: { not: "SYSTEM_CHANGE" },
            date: { gte: thirtyDaysAgo },
          },
        },
      });
    }

    if (tag && tag != "ALL") {
      andCondition.push({
        tags: { has: tag },
      });
    }

    if (ownerId && ownerId !== "all") {
      if (ownerId === "unassigned") {
        andCondition.push({ ownerId: null });
      } else {
        andCondition.push({
          OR: [
            { ownerId: ownerId }, // Pertence ao vendedor selecionado
            { ownerId: null }, // OU está livre na fila esperando atendimento
          ],
        });
      }
    }

    // Acopla todas as condições geradas com segurança no whereClause do Prisma
    if (andCondition.length > 0) {
      whereClause.AND = andCondition;
    }

    const [leads, totalCount] = await Promise.all([
      prismaClient.lead.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: [
          { bounced: "asc" },
          { unsubscribed: "asc" },
          { position: "asc" },
        ],
        include: {
          contacts: {
            orderBy: {
              date: "desc",
            },
          },
          ownerUser: {
            select: {
              name: true,
            },
          },
          visits: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prismaClient.lead.count({
        where: whereClause,
      }),
    ]);

    return {
      leads,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  }
}

export { ListLeadsService };
