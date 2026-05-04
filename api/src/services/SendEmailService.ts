import { Resend } from "resend";
import { prismaClient } from "../../prisma/index.js";

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

    if (!user?.resendApiKey && !user.brevoApiKey) {
      throw new Error("Você ainda não inseriu sua API de e-mail");
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
    let providerUsed = "";

    if (user.resendApiKey) {
      try {
        const resendInstance = new Resend(user.resendApiKey);
        const { data, error } = await resendInstance.emails.send({
          from: user.email,
          to: lead.email,
          subject: subject,
          html: `<div>${formattedBody}</div>`,
        });

        if (!error && data) {
          messageId = data.id;
          providerUsed = "RESEND";
        }
      } catch (err) {
        console.error("Falha no envio via resend:", err);
      }
    }

    if (!messageId && user.brevoApiKey) {
      try {
        const brevoFormat = targetEmails.map((email) => ({ email }));

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": user.brevoApiKey,
            "content-type": "application/json",
          },

          body: JSON.stringify({
            sender: { name: user.name, email: user.email },
            to: brevoFormat,
            subject: subject,
            htmlContent: formattedBody,
          }),
        });

        if (response.ok) {
          const brevoData = await response.json();
          messageId = brevoData.messageId;
          providerUsed = "BREVO";
        }
      } catch (err) {
        console.error("Falha no envio via BREVO:", err);
      }
    }

    if (!messageId) {
      throw new Error(
        "Não foi possível enviar o email por nenhum dos provedores",
      );
    }

    const contact = await prismaClient.contact.create({
      data: {
        leadId: leadId,
        userId: userId,
        type: "EMAIL",
        date: new Date(),
        description: `Enviado via ${providerUsed}\nPara: ${targetEmails.join(", ")}`,
      },
    });

    return {
      success: true,
      messageId: messageId,
      provider: providerUsed,
      contact,
    };
  }
}

export { SendEmailService };
