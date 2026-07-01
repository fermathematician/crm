import type { Request, Response } from "express";
import { prismaClient } from "../../prisma/index.js";

class TrackEmailController {
  async handle(req: Request, res: Response) {
    const contactId = req.params.id as string;

    try {
      await prismaClient.contact.update({
        where: { id: contactId },
        data: {
          opened: true,
        },
      });
      console.log(`Email do contato ${contactId} foi aberto`);
    } catch (error) {
      console.error(
        `Erro ao registrar a abertura do email do contato ${contactId}`,
        error,
      );
    }
    const pixelBase64 =
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const pixelBuffer = Buffer.from(pixelBase64, "base64");
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": pixelBuffer.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
    });
    return res.end(pixelBuffer);
  }
}

export { TrackEmailController };
