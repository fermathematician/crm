import { Router } from 'express';
import { AuthenticateUserController } from '../controllers/AuthenticateUserController.js';
import { CreateUserController } from '../controllers/CreateUserController.js';

const router = Router();

router.post('/login', AuthenticateUserController.handle);
router.post('/register', CreateUserController.handle);

export const authRoutes = router;