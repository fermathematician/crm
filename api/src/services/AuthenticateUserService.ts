import { compare } from "bcryptjs";
import { prismaClient } from "../prisma/index.js";
import jwt from "jsonwebtoken";

interface IAuthRequest {
    email: string;
    password: string;
}

class AuthenticateUserService {
    async execute({email, password} : IAuthRequest) {
        const user = await prismaClient.user.findUnique({
            where: {
                email: email
            }
        })

        if(!user) {
            throw new Error("Usuário ou senha incorretos");
        }

        const passwordMatch = await compare(password, user.password);

        if(!passwordMatch) {
            throw new Error("Usuário ou senha incorretos");
        }

        const token = jwt.sign(
            {
                name: user.name,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET as string,
            {
                subject: user.id,
                expiresIn: "30d"
            }
        );

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        };
    }
}

export { AuthenticateUserService };