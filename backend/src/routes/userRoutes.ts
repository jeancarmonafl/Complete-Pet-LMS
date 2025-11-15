import { Router } from 'express';

import { createUserHandler, getUserActivityHandler, listSupervisorsHandler, listUsersHandler, updateUserHandler, updateUserStatusHandler } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate());
router.get('/', listUsersHandler);
router.post('/', createUserHandler);
router.get('/:id/activity', getUserActivityHandler);
router.put('/:id', updateUserHandler);
router.get('/supervisors', listSupervisorsHandler);
router.patch('/:id/status', updateUserStatusHandler);

export default router;
