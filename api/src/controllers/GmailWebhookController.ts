import type { Request, Response } from "express";

class GmailWebhookController {
  async handle(req: Request, res: Response) {
    try {
      const encodedData = req.body?.message?.data;

      if (encodedData) {
        const decodedString = Buffer.from(encodedData, "base64").toString(
          "utf-8",
        );
        const eventData = JSON.parse(decodedString);

        console.log("Webhoook: nova noitifcação do gmail recebida");
        console.log(`Eail do usuario afetado: ${eventData.emailAddress}`);
        console.log(`ID do historico: ${eventData.historyId}`);
      }

      return res.status(200).send("OK");
    } catch (error) {
      console.error("Erro ao processar o webhook do gmail", error);
      return res.status(200).send("Erro processando");
    }
  }
}

export { GmailWebhookController };
