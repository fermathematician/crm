import { CreateNotificationService } from "../services/CreateNotificationService.js";
import type { Request, Response } from "express";

class CreateNotificationController {
  async handle(req: Request, res: Response) {
    const { notifyDate, message, leadId, userId } = req.body;
    const createdNotificationService = new CreateNotificationService();

    const notification = await createdNotificationService.execute({
      notifyDate: new Date(notifyDate),
      message,
      leadId,
      userId,
    });

    return res.json(notification);
  }
}

export { CreateNotificationController };
