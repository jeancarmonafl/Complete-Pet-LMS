import { Router } from 'express';

import { createUserHandler, getUserActivityHandler, listSupervisorsHandler, listUsersHandler, resetPasswordHandler, updateUserHandler, updateUserStatusHandler } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate());
router.get('/', listUsersHandler);
router.post('/', createUserHandler);
// Static routes must come before dynamic routes
router.get('/supervisors', listSupervisorsHandler);
router.get('/:id/activity', getUserActivityHandler);
router.put('/:id', updateUserHandler);
router.patch('/:id/status', updateUserStatusHandler);
router.post('/:id/reset-password', resetPasswordHandler);

export default router;
