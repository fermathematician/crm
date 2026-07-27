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
  threadId?: string;
  inReplyTo?: string;
}

function getNextBusinessDayText(daysToAdd: number): string {
  const date = new Date();
  let added = 0;

  const weekdays = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado
    // Pula sábado (6) e domingo (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }

  const weekdayName = weekdays[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${weekdayName}, dia ${day}/${month}`;
}

class SendEmailService {
  async execute({
    leadId,
    userId,
    subject,
    body,
    targetEmails,
    threadId,
    inReplyTo,
  }: SendEmailRequest) {
    console.log("🔍 [DEBUG EMAIL - INPUTS REQUISITADOS]:", {
      leadId,
      userId,
      targetEmails,
      threadId,
      inReplyTo,
    });
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

    console.log("Lead recuperado do banco:", lead);

    if (!lead) {
      throw new Error("Lead não encontrado.");
    }

    if (!lead.ownerId) {
      await prismaClient.lead.update({
        where: { id: leadId },
        data: { ownerId: userId },
      });
      console.log(
        `[👤 LEAD ATRIBUÍDO] O usuário ${userId} assumiu o lead ${leadId} pelo primeiro e-mail.`,
      );
    }

    if (lead.bounced) {
      throw new Error("Este lead possui um email inválido");
    }
    if (lead.unsubscribed) {
      throw new Error(
        "Este lead cancelou a inscrição e não aceita mais receber o email",
      );
    }

    if (!lead.email) {
      throw new Error("Este lead não possui um endereço de e-mail registado.");
    }

    if (!lead.companyName) {
      throw new Error("Este lead não possui razão social");
    }

    if (!user.name) {
      throw new Error("Este usuário não tem nome!");
    }

    const financeiro = lead.financeiro;

    const processedSubject = subject.replace(
      /{{leadName}}/g,
      financeiro || lead.companyName,
    );
    const encodedSubject = `=?utf-8?B?${Buffer.from(processedSubject).toString("base64")}?=`;

    let processedBody = body;

    const dateCumprimento = new Date().getHours();

    let cumprimento = "Bom dia";
    if (dateCumprimento > 12) {
      cumprimento = "Boa tarde";
    }

    if (financeiro) {
      processedBody = processedBody.replace(/{{leadName}}/g, financeiro);
    } else {
      processedBody = processedBody
        .replace(/Olá,?\s*{{leadName}}!?/gi, cumprimento)
        .replace(/{{leadName}}/g, lead.companyName);
    }
    const firstname = user.name.split(" ")[0];
    const oneDayText = getNextBusinessDayText(1); // Ex: "Quarta, dia 22/07"
    const twoDaysText = getNextBusinessDayText(2);
    processedBody = processedBody
      .replace(/{{userName}}/g, firstname || "")
      .replace(/{{userPhone}}/g, "(41) 99213-4459")
      .replace(/{{oneDay}}/gi, oneDayText)
      .replace(/{{twoDays}}/gi, twoDaysText);

    const formattedBody =
      processedBody.includes("<br/>") || processedBody.includes("<p>")
        ? processedBody
        : processedBody.replace(/\n/g, "<br/>");

    let messageId = "";

    const contact = await prismaClient.contact.create({
      data: {
        leadId: leadId,
        userId: userId,
        type: "EMAIL",
        date: new Date(),
        description: `Assunto: ${subject}\n\nMensagem:\n${body}\nPara: ${targetEmails.join(", ")}\n\nEnviado via GMAIL`,
      },
    });

    console.log(
      `🚀 Contato criado com sucesso! ID para o Pixel: ${contact.id}`,
    );

    let updatedContact = contact;

    try {
      const keyFilePath = path.join(
        __dirname,
        "..",
        "..",
        "google-credentials.json",
      );

      const auth = new google.auth.JWT({
        keyFile: keyFilePath,
        scopes: [
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/gmail.readonly",
        ],
        subject: user.email,
      });

      const gmail = google.gmail({ version: "v1", auth });
      const destinatario = targetEmails.join(", ");

      const apiUrl = process.env.API_URL;

      // Dentro do método execute do seu SendEmailService:

      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0; color: #333; padding: 10px; text-align: left;">
          
          <!-- 💬 1. TEXTO DO CRM (Totalmente isolado no topo e colado na esquerda) -->
          <div style="font-size: 16px; line-height: 1.6; margin-bottom: 40px; color: #222; text-align: left; display: block; width: 100%;">
            ${formattedBody}
          </div>
      
          <!-- 📇 2. TABELA DA ASSINATURA (Começa do zero abaixo do texto) -->
          <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; color: #333; margin-top: 20px; text-align: left;">
            <tr>
              <!-- COLUNA ESQUERDA: Logo Redondo -->
              <td valign="top" style="padding-right: 25px; text-align: center; width: 95px;">
                <img src="https://d15k2d11r6t6rl.cloudfront.net/public/users/Integrators/a50663b7-0ad3-4eb2-b88a-8feb85df58e6/bee-leadlovers-uid-2049278/LOGOS%20FINAIS/%C3%8Dcone%20O.S.%20redondo.png" width="90" alt="Logo O.S." style="display: block; margin: 0 auto;">
              </td>
              
              <!-- COLUNA DIREITA: Nome e Contatos -->
              <td valign="top">
                <div style="font-size: 18px; font-weight: bold; color: #1a1a1a; margin-bottom: 2px;">${user.name}</div>
                <div style="font-size: 14px; font-style: italic; color: #666; margin-bottom: 8px;">SDR</div>
                
                <!-- Linha Dourada Divisória -->
                <div style="margin-bottom: 12px;">
                  <img src="https://static.wixstatic.com/media/5f0b57_158bfaec2b734054816940596f6db8b7~mv2.png" width="450" height="2" style="display: block;" alt="">
                </div>
                
                <!-- Tabela de Ícones de Contato -->
                <table cellpadding="0" cellspacing="0" border="0" style="font-size: 14px; color: #333; line-height: 22px;">
                  <tr>
                    <td valign="middle" style="padding-right: 8px; padding-bottom: 6px;">
                      <img src="https://static.wixstatic.com/media/0f36d1_e7b7d8382c044e05bde3e87be9b1713a~mv2.png" width="15" height="15" style="display: block;" alt="Telefone">
                    </td>
                    <td valign="middle" style="padding-bottom: 6px; color: #333;">41 3326-3500</td>
                  </tr>
                  <tr>
                    <td valign="middle" style="padding-right: 8px; padding-bottom: 6px;">
                      <img src="https://static.wixstatic.com/media/5f0b57_1f4fe3b6f39e4e8a85b1bfdf78deb495~mv2.png" width="18" height="18" style="display: block;" alt="E-mail">
                    </td>
                    <td valign="middle" style="padding-bottom: 6px;">
                      <a href="mailto:${user.email}" style="color: #0056b3; text-decoration: underline;">${user.email}</a>
                    </td>
                  </tr>
                  <tr>
                    <td valign="middle" style="padding-right: 8px; padding-bottom: 6px;">
                      <img src="https://static.wixstatic.com/media/0f36d1_301bf24620ac47cfaac4a6a5403adb83~mv2.png" width="15" height="15" style="display: block;" alt="Endereço">
                    </td>
                    <td valign="middle" style="padding-bottom: 6px; color: #333;">Al. Dr. Carlos de Carvalho, 417, 12º e 25º andares, Centro - Curitiba/PR</td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- BANNER PANORÂMICO -->
            <tr>
              <td colspan="2" style="padding-top: 20px;">
                <img src="https://static.wixstatic.com/media/0f36d1_75611bd36081421393b86a5b218c5a4b~mv2.png" width="580" height="102" style="width: 100%; max-width: 580px; height: auto; display: block;" alt="O.S. Inteligência Financeira - Great Place To Work">
              </td>
            </tr>
            
            <tr>
              <td colspan="2" style="padding-top: 25px; text-align: center; font-size: 11px; color: #888888; line-height: 1.5; font-family: Arial, sans-serif;">
                Se não deseja mais receber nossos e-mails, 
                <a href="${apiUrl}/auth/public/unsubscribe?leadId=${leadId}" style="color: #0056b3; text-decoration: underline;">clique aqui para cancelar sua inscrição</a>.
              </td>
            </tr>
          </table>
      
        </div>
      `;

      const customMessageId = `<crm-${contact.id}@osinteligenciafinanceira.com>`;

      const trackingPixel = `<img src="${apiUrl}/auth/emails/track/${contact.id}" alt="" width="1" height="1" style="display:none;" />`;
      const messageParts = [
        `From: <${user.email}>`,
        `To: ${destinatario}`,
        `Subject: ${encodedSubject}`,
        `Message-ID: ${customMessageId}`,
        `Content-Type: text/html; charset=UTF-8`,
        `Mime-Version: 1.0`,
      ];

      if (inReplyTo && inReplyTo.trim().length > 0) {
        let formattedInReplyTo = inReplyTo.trim();
        if (!formattedInReplyTo.startsWith("<")) {
          formattedInReplyTo = `<${formattedInReplyTo}>`;
        }

        if (formattedInReplyTo.includes("@")) {
          messageParts.push(`In-Reply-To: ${formattedInReplyTo}`);
          messageParts.push(`References: ${formattedInReplyTo}`);
        }
      }
      console.log("🔍 [DEBUG EMAIL - CABEÇALHOS MONTADOS]:", messageParts);
      // Linha em branco obrigatória separando cabeçalhos do corpo HTML
      messageParts.push("");
      messageParts.push(`<div>${htmlTemplate}</div>${trackingPixel}`);

      const message = messageParts.join("\r\n");
      const encodedMessage = Buffer.from(message)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      console.log(
        "🔍 [DEBUG EMAIL - THREAD ID ENVIADO PRO GMAIL]:",
        threadId || null,
      );

      // 🚀 3. Passa o threadId no envio para o Gmail agrupar na mesma mensagem
      const response: any = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
          threadId: threadId || null,
        },
      });

      messageId = response.data?.id || "";
      const generatedThreadId = response.data?.threadId || "";
      let realRfcMessageId = customMessageId;
      try {
        if (messageId) {
          const sentMsg = await gmail.users.messages.get({
            userId: "me",
            id: messageId,
            format: "metadata",
            metadataHeaders: ["Message-ID", "Message-Id"],
          });
          const msgIdHeader = sentMsg.data.payload?.headers?.find(
            (h) => h.name?.toLowerCase() === "message-id",
          )?.value;

          if (msgIdHeader) {
            realRfcMessageId = msgIdHeader;
          }
        }
      } catch (e) {
        console.error("Erro ao obter RFC Message-ID do Gmail:", e);
      }

      if (contact.id && (realRfcMessageId || generatedThreadId)) {
        updatedContact = await prismaClient.contact
          .update({
            where: { id: contact.id },
            data: {
              messageId: realRfcMessageId,
              threadId: generatedThreadId,
            },
          })
          .catch(() => contact);
      }
    } catch (err: any) {
      console.error("💥 [ERRO DETALHADO DO GMAIL]:", err.response?.data || err);
      throw new Error(
        `Falha ao enviar e-mail: ${err.response?.data?.error_description || err.response?.data?.error?.message || err.message}`,
      );
    }

    return {
      success: true,
      messageId: messageId,
      provider: "GMAIL",
      contact: updatedContact,
    };
  }
}

export { SendEmailService };
