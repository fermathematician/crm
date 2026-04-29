import type { Request, Response } from "express";
import { EmailWebhookService } from "../services/EmailWebhookService.js";

class EmailWebhookController {
  async handle(req: Request, res: Response) {
    const payload = req.body;

    let email = "";
    let eventType = "";

    //Resend
    if (payload.type && payload.data?.to) {
      email = payload.data.to[0];
      eventType = payload.type;
    } else if (payload.event || payload["event-name"]) {
      email = payload.email;
      eventType = payload.event || payload["event-name"];
    }

    if (!email) {
      return res
        .status(200)
        .json({ message: "Webhook ignorado: E-mail não identificado." });
    }

    const emailWebhookService = new EmailWebhookService();

    try {
      const result = await emailWebhookService.execute({
        email,
        eventType: eventType.toLowerCase(),
      });

      return res.json(result);
    } catch (error) {
      console.error("Erro no Webhook Controller: ", error);
      return res
        .status(500)
        .json({ error: "Erro interno ao processar webhook" });
    }
  }
}

export { EmailWebhookController };
