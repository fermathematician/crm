import { prismaClient } from "../../prisma/index.js";

class ListUsersService {
  async execute(adminId: string) {
    const admin = await prismaClient.user.findUnique({ where: { id: adminId } });
    if (admin?.role !== 'ADMIN') {
      throw new Error("Acesso negado. Apenas administradores podem listar usuários.");
    }

    const users = await prismaClient.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return users;
  }
}

export { ListUsersService };