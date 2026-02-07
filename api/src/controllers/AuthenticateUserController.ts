import type { Request, Response } from 'express';
import { AuthenticateUserService } from '../services/AuthenticateUserService.js';

class AuthenticateUserController {
  static async handle(req: Request, res: Response) {
    const { email, password } = req.body;

    const authenticateUserService = new AuthenticateUserService();

    try {
      const result = await authenticateUserService.execute({
        email,
        password
      });

      return res.json(result);
    } catch(err: any) {
      return res.status(401).json({
        message: err.message || "Erro inesperado"
      });
    }
  }
}

export { AuthenticateUserController };