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

    const oldestLead = await prismaClient.lead.findFirst({
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });

    let gmailQuery = "to:me  -from:me is: unread";

    if (oldestLead) {
      const dateLimit = new Date(oldestLead.createdAt);
      const formattedDate = `${dateLimit.getFullYear()}/${String(
        dateLimit.getMonth() + 1,
      ).padStart(2, "0")}/${String(dateLimit.getDate()).padStart(2, "0")}`;
      gmailQuery += ` after:${formattedDate}`;
    }

    console.log(`[🔎 GMAIL API] Executando busca com query: "${gmailQuery}"`);

    const response = await gmail.users.messages.list({
      userId: "me",
      q: gmailQuery,
    });

    console.log(`[🔎 GMAIL API] Executando busca com query: "${gmailQuery}"`);

    const messages = response.data.messages || [];
    console.log(
      `[🔎 GMAIL API] Encontradas ${messages.length} mensagens com 'Re:' para ${user.email}`,
    );
    let respostasProcessadas = 0;

    for (const msg of messages) {
      if (!msg.id) continue;

      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const payload = msgData.data.payload;

      const fromHeader = msgData.data.payload?.headers?.find(
        (h) => h.name === "From",
      )?.value;

      if (!fromHeader) continue;
      // Limpa o formato do cabeçalho (ex: "Nome <cliente@email.com>" vira "cliente@email.com")

      const subjectHeader =
        payload?.headers?.find((h) => h.name === "Subject")?.value ||
        "Re: Sem Assunto";

      const emailMatch = fromHeader.match(/<([^>]+)>/) || [null, fromHeader];
      const emailDoCliente = emailMatch[1]?.trim().toLowerCase();

      console.log(
        `[🔎 ESPIÃO 1] Cabeçalho: "${fromHeader}" | E-mail Extraído: "${emailDoCliente}"`,
      );

      if (!emailDoCliente) continue;

      //veja que ele pega o primeiro pelo email
      const lead = await prismaClient.lead.findFirst({
        where: {
          email: {
            contains: emailDoCliente,
            mode: "insensitive",
          },
        },
      });

      console.log(
        `[🔎 ESPIÃO 2] Lead Encontrado no Banco? ${!!lead} | Estágio atual do funil: ${lead?.funnelStage || "N/A"}`,
      );

      if (lead) {
        let corpoEmail = msgData.data.snippet || "";
        if (payload?.body?.data) {
          corpoEmail = Buffer.from(payload.body.data, "base64").toString(
            "utf-8",
          );
        } else if (payload?.parts) {
          const textPart = payload.parts.find(
            (p) => p.mimeType === "text/plain",
          );
          if (textPart?.body?.data) {
            corpoEmail = Buffer.from(textPart.body.data, "base64").toString(
              "utf-8",
            );
          }
        }

        corpoEmail = corpoEmail
          .split("\n")
          .filter((linha) => {
            return !linha.trim().startsWith(">");
          })
          .join("\n");

        await prismaClient.contact.create({
          data: {
            leadId: lead.id,
            userId: userId,
            type: "EMAIL",
            date: new Date(),
            description: `Assunto: ${subjectHeader}\n\nMensagem:\n${corpoEmail}\n\nRecebido via GMAIL`,
            observation: corpoEmail,
            didChageFunnel: false,
          },
        });

        if (["NOVO", "CONTATO"].includes(lead.funnelStage)) {
          await prismaClient.lead.update({
            where: { id: lead.id },
            data: {
              funnelStage: "CONTATO",
              tags: ["respondido"],
            },
          });
          console.log(
            `[📥 RESPOSTA] Lead ${lead.companyName} atualizado para RESPONDIDO e histórico salvo.`,
          );
        }
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
