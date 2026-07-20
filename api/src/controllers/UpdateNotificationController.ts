import { UpdateNotificationService } from "../services/UpdateNotificationService.js";
import type { Request, Response } from "express";

class UpdateNotificationController {
  async handle(req: Request, res: Response) {
    const { id, notifyDate, message, isCompleted, isOcult, leadId, userId } =
      req.body;
    const updateNotificationService = new UpdateNotificationService();
    const notification = await updateNotificationService.execute({
      id,
      notifyDate,
      message,
      isCompleted,
      isOcult,
      leadId,
      userId,
    });

    return res.json(notification);
  }
}

export { UpdateNotificationController };
