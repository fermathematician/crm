import { Router } from 'express';
import { AuthenticateUserController } from '../controllers/AuthenticateUserController.js';
import { CreateUserController } from '../controllers/CreateUserController.js';
import { ListLeadsController } from '../controllers/ListLeadsController.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { DetailUserController } from '../controllers/DetailUserController.js';
import { UpdateLeadController } from '../controllers/UpdateLeadController.js';
import { CreateLeadController } from '../controllers/CreateLeadController.js';
import { DeleteLeadController } from '../controllers/DeleteLeadController.js'; 

const router = Router();
const detailUserController = new DetailUserController(); 
const listLeadsController = new ListLeadsController();
const updateLeadController = new UpdateLeadController();
const createLeadController = new CreateLeadController();
const deleteLeadController = new DeleteLeadController(); 

router.post('/login', AuthenticateUserController.handle);
router.post('/register', CreateUserController.handle);

router.get('/me', ensureAuthenticated, detailUserController.handle);
router.get('/leads', ensureAuthenticated, listLeadsController.handle);
router.post('/leads', ensureAuthenticated, createLeadController.handle);
router.put('/leads/update', ensureAuthenticated, updateLeadController.handle);
router.delete('/leads/:lead_id', ensureAuthenticated, deleteLeadController.handle); 

export const authRoutes = router;