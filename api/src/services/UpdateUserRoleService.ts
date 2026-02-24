import { prismaClient } from "../../prisma/index.js";
import { Role } from "@prisma/client";

interface UpdateRoleRequest {
  adminId: string;
  targetUserId: string;
  role: Role;
}

class UpdateUserRoleService {
  async execute({ adminId, targetUserId, role }: UpdateRoleRequest) {
    const admin = await prismaClient.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== 'ADMIN') {
      throw new Error("Acesso negado. Apenas administradores podem alterar cargos.");
    }

    const updatedUser = await prismaClient.user.update({
      where: { id: targetUserId },
      data: { role: role },
      select: { id: true, name: true, email: true, role: true }
    });

    return updatedUser;
  }
}

export { UpdateUserRoleService };