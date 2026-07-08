import type { Request, Response } from "express";
import { TrackEmailService } from "../services/TrackEmailService.js";

class TrackEmailController {
  async handle(req: Request, res: Response) {
    const contactId = req.params.id as string;

    try {
      const trackEmailService = new TrackEmailService();
      await trackEmailService.execute({ contactId });
    } catch (error) {
      console.error(`Erro no tracking fo email de contato ${contactId}`, error);
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
