import { prismaClient } from "../../prisma/index.js";

class ListUsersService {
  async execute(adminId: string) {
    const admin = await prismaClient.user.findUnique({
      where: { id: adminId },
    });
    const users = await prismaClient.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return users;
  }
}

export { ListUsersService };
