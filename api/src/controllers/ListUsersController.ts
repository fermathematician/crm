import type { Request, Response } from "express";
import { ListUsersService } from "../services/ListUsersService.js";

class ListUsersController {
  async handle(req: Request, res: Response) {
    const adminId = req.user_id as string;
    const listUsersService = new ListUsersService();
    const users = await listUsersService.execute(adminId);
    return res.json(users);
  }
}

export { ListUsersController };