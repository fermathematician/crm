import type { NextFunction, Request, Response } from "express";
import { UnsubscribeLeadService } from "../services/UnsubscribeLeadService.js";

class UnsubscribeLeadController {
  async handle(req: Request, res: Response) {
    const leadId = req.query.leadId as string;

    try {
      const unsubscribeService = new UnsubscribeLeadService();
      await unsubscribeService.execute(leadId);

      return res.send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Inscrição Cancelada com Sucesso</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f8fafc;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: #ffffff;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.05);
              text-align: center;
              max-width: 420px;
              border-top: 5px solid #10b981;
            }
            .icon {
              font-size: 48px;
              color: #10b981;
              margin-bottom: 15px;
            }
            h1 {
              color: #1e293b;
              font-size: 22px;
              margin-bottom: 12px;
            }
            p {
              color: #64748b;
              font-size: 15px;
              line-height: 1.6;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Inscrição Cancelada</h1>
            <p>Seu e-mail foi removido da nossa lista. Você não receberá novas apresentações ou mensagens de acompanhamento comercial.</p>
          </div>
        </body>
        </html>
      `);
    } catch (error: any) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Erro ao processar solicitação</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background-color: #f8fafc;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .card {
              background: #ffffff;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.05);
              text-align: center;
              max-width: 420px;
              border-top: 5px solid #ef4444;
            }
            .icon {
              font-size: 48px;
              color: #ef4444;
              margin-bottom: 15px;
            }
            h1 {
              color: #1e293b;
              font-size: 22px;
              margin-bottom: 12px;
            }
            p {
              color: #64748b;
              font-size: 15px;
              line-height: 1.6;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">✗</div>
            <h1>Ops! Algo deu errado</h1>
            <p>${error.message || "Não conseguimos concluir a solicitação."}</p>
          </div>
        </body>
        </html>
      `);
    }
  }
}
export { UnsubscribeLeadController };
