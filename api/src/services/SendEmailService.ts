import path from "path";
import { prismaClient } from "../../prisma/index.js";
import { google } from "googleapis";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SendEmailRequest {
  leadId: string;
  userId: string;
  subject: string;
  body: string;
  targetEmails: string[];
}

class SendEmailService {
  async execute({
    leadId,
    userId,
    subject,
    body,
    targetEmails,
  }: SendEmailRequest) {
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error("Usuário não encontrado");

    if (!user.email) {
      throw new Error("Este usuário nao possui um endereço de email");
    }

    const lead = await prismaClient.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      throw new Error("Lead não encontrado.");
    }

    if (!lead.email) {
      throw new Error("Este lead não possui um endereço de e-mail registado.");
    }

    const formattedBody = body.replace(/\n/g, "<br/>");
    let messageId = "";

    const contact = await prismaClient.contact.create({
      data: {
        leadId: leadId,
        userId: userId,
        type: "EMAIL",
        date: new Date(),
        description: `Enviado via GMAIL\nPara: ${targetEmails.join(", ")}`,
      },
    });

    console.log(
      `🚀 Contato criado com sucesso! ID para o Pixel: ${contact.id}`,
    );

    try {
      const keyFilePath = path.join(
        __dirname,
        "..",
        "..",
        "google-credentials.json",
      );

      const auth = new google.auth.JWT({
        keyFile: keyFilePath,
        scopes: ["https://www.googleapis.com/auth/gmail.send"],
        subject: user.email,
      });

      const gmail = google.gmail({ version: "v1", auth });
      const destinatario = targetEmails.join(", ");

      const apiUrl = process.env.API_URL;
      const trackingPixel = `<img src="${apiUrl}/auth/emails/track/${contact.id}" alt="" width="1" height="1" style="display:none;" />`;
      const messageParts = [
        `From: <${user.email}>`,
        `To: ${destinatario}`,
        `Subject: ${subject}`,
        `Content-Type: text/html; charset=UTF-8`,
        `Mime-Version: 1.0`,
        "",
        `<div>${formattedBody}</div>${trackingPixel}`,
      ];

      const message = messageParts.join("\n");
      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedMessage },
      });

      messageId = response.data.id as string;
    } catch (err: any) {
      console.error("Falha no envio do email", err.message);
      throw new Error(
        "Não foi possível enviar o email pelo servidor da Google",
      );
    }

    return {
      success: true,
      messageId: messageId,
      provider: "GMAIL",
      contact,
    };
  }
}

export { SendEmailService };
