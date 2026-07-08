import { prismaClient } from "../../prisma/index.js";

interface TrackEmailRequest {
  contactId: string;
}

class TrackEmailService {
  async execute({ contactId }: TrackEmailRequest) {
    const contact = await prismaClient.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact || !contact.date) {
      return;
    }
    const tempoAtual = new Date();
    const tempoEnvio = contact.date;

    const diferencaEmSegundos =
      (tempoAtual.getTime() - tempoEnvio.getTime()) / 1000;

    if (diferencaEmSegundos < 8) {
      console.log(
        `[🤖 Anti-Bot] Abertura imediata ignorada (${diferencaEmSegundos.toFixed(1)}s). ID: ${contactId}`,
      );
      return;
    }

    if (!contact.opened) {
      await prismaClient.contact.update({
        where: { id: contactId },
        data: {
          opened: true,
        },
      });
      console.log(
        `[✅ Abertura Real] Email do contato ${contactId} aberto pela 1ª vez após ${diferencaEmSegundos.toFixed(1)}s`,
      );
    } else {
      console.log(
        `[🔄 Reabertura] Email do contato ${contactId} foi lido novamente.`,
      );
    }
  }
}
export { TrackEmailService };
