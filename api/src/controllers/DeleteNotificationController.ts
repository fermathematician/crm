import { DeleteNotificationService } from "../services/DeleteNotificationService.js";
import type { NextFunction, Request, Response } from "express";

class DeleteNotificationController {
  async handle(req: Request, res: Response) {
    const id = req.query.id as string;
    const deleteNotificationService = new DeleteNotificationService();
    const notification = await deleteNotificationService.execute({ id });
    return res.json(notification);
  }
}

export { DeleteNotificationController };
