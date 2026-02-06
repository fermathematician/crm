import { Router } from 'express';
import { AuthenticateUserController } from '../controllers/AuthenticateUserController.js';

const router = Router();

// Se o front-end chamar o /login através de post chamar o AuthController.login
router.post('/login', AuthenticateUserController.login);

export const authRoutes = router;