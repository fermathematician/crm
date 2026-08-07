import { prismaClient } from "../../prisma/index.js";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { FunnelStage } from "@prisma/client";

interface ImportRequest {
  file: Express.Multer.File;
  userId: string;
  tag: string; //esse tag é o nome da lista, não confundir com as tags dos leads, que seria "novo", "frio", etc
  manualStatus: string;
}

type ExcelRow = Record<string, any>;

class ImportLeadsService {
  async execute({ file, userId, tag, manualStatus = "novo" }: ImportRequest) {
    if (!file) {
      throw new Error("Arquivo não enviado.");
    }

    const allowedExtensions = [".csv", ".xlsx", ".xls"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      fs.unlinkSync(file.path);
      throw new Error("Formato de arquivo não suportado.");
    }

    try {
      const fileBuffer = fs.readFileSync(file.path);

      const workbook = XLSX.read(fileBuffer, {
        type: "buffer",
        cellDates: true,
        raw: false,
      });

      if (!workbook.SheetNames.length) {
        throw new Error("Arquivo sem abas.");
      }

      const sheetName = workbook.SheetNames.at(0);

      if (!sheetName) {
        throw new Error("Arquivo sem abas.");
      }

      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error("Não foi possível ler a aba.");
      }

      const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
        defval: null,
        raw: false,
      });

      if (!rows.length) {
        throw new Error("Planilha vazia.");
      }

      const normalizeKey = (key: string) =>
        key
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "")
          .toUpperCase();

      const normalizeRow = (row: ExcelRow): ExcelRow => {
        const newRow: ExcelRow = {};
        for (const key in row) {
          newRow[normalizeKey(key)] = row[key];
        }
        return newRow;
      };

      const normalizeValue = (value: any): string | null =>
        value !== null && value !== undefined ? String(value).trim() : null;

      const batch = await prismaClient.importBatch.create({
        data: {
          tag: tag,
          fileName: file.originalname,
          userId,
        },
      });

      const leadsToInsert = rows
        .map((originalRow) => {
          const row = normalizeRow(originalRow);

          const companyName = row["RAZAOSOCIAL"];
          if (!companyName) return null;

          return {
            companyName: normalizeValue(companyName)!,

            cnpj: normalizeValue(row["CNPJ"])?.replace(/\D/g, "") ?? null,

            cnae: normalizeValue(row["CNAE"]),
            phone: normalizeValue(row["TELEFONE"]),
            email: normalizeValue(row["EMAIL"]),
            city: normalizeValue(row["CIDADE"]),
            state: normalizeValue(row["UF"]),
            address: normalizeValue(row["RUANUMCEP"]),
            comercial: normalizeValue(row["COMERCIAL"]),
            financeiro: normalizeValue(row["FINANCEIRO"]),
            ownerId: null,
            importBatchId: batch.id,
            funnelStage: FunnelStage.NOVO,
            tags: [manualStatus],
            unsubscribed: manualStatus === "bloqueado",
            bounced: manualStatus === "a qualificar",
          };
        })
        .filter((lead): lead is NonNullable<typeof lead> => lead !== null);

      if (!leadsToInsert.length) {
        throw new Error("Nenhum lead válido encontrado.");
      }

      const result = await prismaClient.lead.createMany({
        data: leadsToInsert,
        skipDuplicates: true,
      });

      return {
        message: "Importação concluída com sucesso",
        total: rows.length,
        imported: result.count,
      };
    } catch (error) {
      console.error("ERRO REAL DA IMPORTAÇÃO:", error);
      throw new Error("Falha ao processar arquivo de planilha.");
    } finally {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
  }
}

export { ImportLeadsService };
