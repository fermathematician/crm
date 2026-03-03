import { Resend } from 'resend';
import { prismaClient } from '../../prisma/index.js';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailRequest {
  leadId: string;
  userId: string;
  subject: string;
  body: string;
}

class SendEmailService {
  async execute({ leadId, userId, subject, body }: SendEmailRequest) {
    const lead = await prismaClient.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      throw new Error("Lead não encontrado.");
    }

    if (!lead.email) {
      throw new Error("Este lead não possui um endereço de e-mail registado.");
    }

    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM as string, 
      to: lead.email, 
      subject: subject,
      html: `<p>${body.replace(/\n/g, '<br/>')}</p>`, 
    });

    if (error) {
      console.error("Erro no Resend:", error);
      throw new Error("Falha ao enviar o e-mail pela API do Resend.");
    }

    const contact = await prismaClient.contact.create({
      data: {
        leadId: leadId,
        userId: userId,
        type: 'EMAIL',
        date: new Date(), 
        description: `Assunto: ${subject}\n\nMensagem:\n${body}`,
      }
    });

    return { success: true, messageId: data?.id, contact };
  }
}

export { SendEmailService };