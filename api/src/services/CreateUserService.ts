import { prismaClient } from "../prisma/index.js";
import { hash } from "bcryptjs";
import { Role } from '@prisma/client';

interface ICreateUserRequest {
    name: string;
    email: string;
    password: string;
}

class CreateUserService {
    async execute({ name, email, password }: ICreateUserRequest) {

        if (password.length < 6) {
            throw new Error("A senha deve ter pelo menos 6 caracteres");
        }
        
        const userAlreadyExists = await prismaClient.user.findUnique({
            where: {
                email: email
            }
        })

        if (userAlreadyExists) {
            throw new Error("Usuário já existe com esse email");
        }

        const passwordHash = await hash(password, 8);

        const user = await prismaClient.user.create({
            data: {
                name: name,
                email: email,
                password: passwordHash,
                role: Role.SALES
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created: true
            }
        })

        return user;
    }
}

export { CreateUserService };