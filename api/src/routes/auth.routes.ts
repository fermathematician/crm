import { Router } from 'express';
import multer from 'multer'; 
import { AuthenticateUserController } from '../controllers/AuthenticateUserController.js';
import { CreateUserController } from '../controllers/CreateUserController.js';
import { ListLeadsController } from '../controllers/ListLeadsController.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { DetailUserController } from '../controllers/DetailUserController.js';
import { UpdateLeadController } from '../controllers/UpdateLeadController.js';
import { CreateLeadController } from '../controllers/CreateLeadController.js';
import { DeleteLeadController } from '../controllers/DeleteLeadController.js'; 
import { CreateContactController } from '../controllers/CreateContactController.js';
import { ListUsersController } from '../controllers/ListUsersController.js';
import { UpdateUserRoleController } from '../controllers/UpdateUserRoleController.js';
import { GetUserMetricsController } from '../controllers/GetUserMetricsController.js';
import { GetGlobalMetricsController } from '../controllers/GetGlobalMetricsController.js';
import { ImportLeadsController } from '../controllers/ImportLeadsController.js';
import { SendEmailController } from '../controllers/SendEmailController.js';

const router = Router();
const upload = multer({ dest: 'tmp/' });

const detailUserController = new DetailUserController(); 
const listLeadsController = new ListLeadsController();
const updateLeadController = new UpdateLeadController();
const createLeadController = new CreateLeadController();
const deleteLeadController = new DeleteLeadController(); 
const createContactController = new CreateContactController();
const listUsersController = new ListUsersController();
const updateUserRoleController = new UpdateUserRoleController();
const getUserMetricsController = new GetUserMetricsController();
const getGlobalMetricsController = new GetGlobalMetricsController();
const importLeadsController = new ImportLeadsController();
const sendEmailController = new SendEmailController();

router.post('/login', AuthenticateUserController.handle);
router.post('/register', CreateUserController.handle);

router.get('/me', ensureAuthenticated, detailUserController.handle);
router.get('/leads', ensureAuthenticated, listLeadsController.handle);
router.post('/leads', ensureAuthenticated, createLeadController.handle);
router.put('/leads/update', ensureAuthenticated, updateLeadController.handle);
router.delete('/leads/:lead_id', ensureAuthenticated, deleteLeadController.handle); 
router.post('/leads/:id/contacts', ensureAuthenticated, createContactController.handle);

router.get('/users', ensureAuthenticated, listUsersController.handle);
router.patch('/users/:id/role', ensureAuthenticated, updateUserRoleController.handle);
router.get('/users/:id/metrics', ensureAuthenticated, getUserMetricsController.handle);
router.get('/metrics/global', ensureAuthenticated, getGlobalMetricsController.handle);
router.post( '/leads/import', ensureAuthenticated, upload.single('file'), importLeadsController.handle);
router.post('/leads/:id/email', ensureAuthenticated, sendEmailController.handle);

export const authRoutes = router;