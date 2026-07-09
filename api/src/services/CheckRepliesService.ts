import { google } from "googleapis";
import { prismaClient } from "../../prisma/index.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CheckRepliesRequest {
  userId: string;
}

class CheckRepliesService {
  async execute({ userId }: CheckRepliesRequest) {
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`Usuário ${userId} não encontrado!`);
    } else if (!user.email) {
      throw new Error(`Usuário ${user.name} sem e-mail!`);
    }

    const keyFilePath = path.join(
      __dirname,
      "..",
      "..",
      "google-credentials.json",
    );

    const auth = new google.auth.JWT({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/gmail.modify"],
      subject: user.email,
    });

    const gmail = google.gmail({ version: "v1", auth });

    const response = await gmail.users.messages.list({
      userId: "me",
      q: 'to:me -from:me is:unread subject:"Re:"',
    });

    const messages = response.data.messages || [];
    let respostasProcessadas = 0;

    for (const msg of messages) {
      if (!msg.id) continue;

      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "metadata",
        metadataHeaders: ["From"],
      });

      const fromHeader = msgData.data.payload?.headers?.find(
        (h) => h.name === "From",
      )?.value;

      if (!fromHeader) continue;
      // Limpa o formato do cabeçalho (ex: "Nome <cliente@email.com>" vira "cliente@email.com")
      const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
      const emailDoCliente = emailMatch[1]?.trim().toLowerCase();

      if (!emailDoCliente) continue;

      //veja que ele pega o primeiro pelo email
      const lead = await prismaClient.lead.findFirst({
        where: { email: emailDoCliente },
      });

      if (lead && ["NOVO", "CONTATO"].includes(lead.funnelStage)) {
        await prismaClient.lead.update({
          where: { id: lead.id },
          data: {
            funnelStage: "CONTATO",
            tags: ["respondido"],
          },
        });
        console.log(
          `[📥 RESPOSTA] Lead ${lead.companyName} atualizado para RESPONDIDO.`,
        );
        respostasProcessadas++;
      }
      await gmail.users.messages.modify({
        userId: "me",
        id: msg.id,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });
    }
    return { respostasProcessadas: respostasProcessadas };
  }
}

export { CheckRepliesService };
