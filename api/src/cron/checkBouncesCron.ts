import cron from "node-cron";
import { prismaClient } from "../../prisma/index.js";
import { CheckBouncesService } from "../services/CheckBouncesService.js";
import { CheckRepliesService } from "../services/CheckRepliesService.js";

export function initCheckBouncesCron() {
  cron.schedule("* * * * *", async () => {
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
      const checkRepliesService = new CheckRepliesService();

      for (const user of users) {
        try {
          console.log(
            `[⏰ CRON] Verificando bounce de e-mails de: ${user.email}`,
          );

          const resultBounce = await checkBouncesService.execute({
            userId: user.id,
          });
          if (resultBounce.bouncesProcessados > 0) {
            console.log(
              `[⏰ CRON] Sucesso! ${resultBounce.bouncesProcessados} bounces limpos para ${user.email}`,
            );
          }
        } catch (error: any) {
          console.error(
            `[❌ CRON ERRO] Falha ao verificar bounce de e-mails de ${user.email}:`,
            error.message,
          );
        }

        try {
          console.log(
            `[⏰ CRON] Verificando respostas de e-mails de: ${user.email}`,
          );

          const resultReplies = await checkRepliesService.execute({
            userId: user.id,
          });
          if (resultReplies.respostasProcessadas > 0) {
            console.log(
              `[⏰ CRON] Sucesso! ${resultReplies.respostasProcessadas} respostas processadas para ${user.email}`,
            );
          }
        } catch (error: any) {
          console.error(
            `[❌ CRON ERRO] Falha ao verificar respostas de e-mails de ${user.email}:`,
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
