import type { Request, Response } from "express";
import { CreateUserService } from "../services/CreateUserService.js";

class CreateUserController {
  static async handle(req: Request, res: Response) {
    //temporariamente desabilitado
    return res.status(403).json({
      postMessage:
        "o cadastro de novos usuários está temporariamente desabilitado",
    });

    const { name, email, password } = req.body;

    const createUserService = new CreateUserService();

    const user = await createUserService.execute({
      name,
      email,
      password,
    });

    return res.json(user);
  }
}

export { CreateUserController };
