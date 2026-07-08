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
  }: ListLeadsParams) {
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { cnpj: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    if (stage && stage !== "ALL") {
      whereClause.funnelStage = stage;
    }

    //filtro listas
    if (isManual === "true") {
      whereClause.ImportBatchId = null;
    } else if (importBatchId && importBatchId != "all") {
      whereClause.ImportBatchId = importBatchId;
    }

    if (globalFilter === "overdue") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      whereClause.createdAt = {
        lte: thirtyDaysAgo,
      };

      whereClause.contacts = {
        none: {
          type: { not: "SYSTEM_CHANGE" },
          date: { gte: thirtyDaysAgo },
        },
      };
    }

    const [leads, totalCount] = await Promise.all([
      prismaClient.lead.findMany({
        where: whereClause,
        skip: skip,
        take: limit,
        orderBy: {
          position: "asc",
        },
        include: {
          contacts: {
            orderBy: {
              date: "desc",
            },
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
