import { prismaClient } from "../../prisma/index.js";

export class ListImportBatchesService {
  async execute() {
    const batches = await prismaClient.importBatch.findMany({
      select: {
        id: true,
        fileName: true,
        tag: true,
      },
      orderBy: {
        importedAt: "desc",
      },
    });

    return batches;
  }
}
