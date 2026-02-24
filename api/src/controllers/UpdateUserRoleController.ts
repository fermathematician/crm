import type { Request, Response } from "express";
import { UpdateUserRoleService } from "../services/UpdateUserRoleService.js";

class UpdateUserRoleController {
  async handle(req: Request, res: Response) {
    const adminId = req.user_id as string;
    
    const targetUserId = req.params.id as string; 
    const { role } = req.body;

    const updateUserRoleService = new UpdateUserRoleService();
    const user = await updateUserRoleService.execute({
      adminId,
      targetUserId,
      role
    });

    return res.json(user);
  }
}

export { UpdateUserRoleController };