import cron from "node-cron";
import { prismaClient } from "../../prisma/index.js";
import { CheckBouncesService } from "../services/CheckBouncesService.js";

export function initCheckBouncesCron() {
  cron.schedule("*/5 * * * *", async () => {
    console.log("Iniciando varrefura automatizada de Bounces...");

    try {
      const users = await prismaClient.user.findMany({
        where: {
          email: { not: "" },
        },
        select: { id: true, email: true },
      });

      if (users.length === 0) {
        console.log("[⏰ CRON] Nenhum usuário encontrado para verificar.");
        return;
      }

      const checkBouncesService = new CheckBouncesService();

      for (const user of users) {
        try {
          console.log(`[⏰ CRON] Verificando e-mails de: ${user.email}`);

          const result = await checkBouncesService.execute({ userId: user.id });
          if (result.bouncesProcessados > 0) {
            console.log(
              `[⏰ CRON] Sucesso! ${result.bouncesProcessados} bounces limpos para ${user.email}`,
            );
          }
        } catch (error: any) {
          console.error(
            `[❌ CRON ERRO] Falha ao verificar e-mails de ${user.email}:`,
            error.message,
          );
        }
      }

      console.log("[⏰ CRON] Varredura de Bounces concluída com sucesso.");
    } catch (globalError) {
      console.error("erro geral no agendador de bonces: ", globalError);
    }
  });
}
