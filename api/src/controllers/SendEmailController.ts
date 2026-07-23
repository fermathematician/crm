import type { Request, Response } from "express";
import { SendEmailService } from "../services/SendEmailService.js";

class SendEmailController {
  async handle(req: Request, res: Response) {
    const leadId = req.params.id as string;
    const userId = req.user_id;
    const { subject, body, targetEmails, threadId, inReplyTo } = req.body;

    if (!subject || !body) {
      return res
        .status(400)
        .json({ error: "O assunto e a mensagem são obrigatórios." });
    }

    if (
      !targetEmails ||
      !Array.isArray(targetEmails) ||
      targetEmails.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "nenhum email de destino foi informado" });
    }

    const sendEmailService = new SendEmailService();

    try {
      const result = await sendEmailService.execute({
        leadId,
        userId,
        subject,
        body,
        targetEmails,
        threadId,
        inReplyTo,
      });

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export { SendEmailController };
