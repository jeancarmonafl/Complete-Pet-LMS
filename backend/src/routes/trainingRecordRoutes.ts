import { Router } from 'express';

import {
  createTrainingRecordHandler,
  getPendingApprovalsHandler,
  getTrainingRecordsHandler,
  approveTrainingRecordHandler,
  denyTrainingRecordHandler
} from '../controllers/trainingRecordController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate());
router.get('/pending-approvals', getPendingApprovalsHandler);
router.get('/', getTrainingRecordsHandler);
router.post('/', createTrainingRecordHandler);
router.patch('/:id/approve', approveTrainingRecordHandler);
router.patch('/:id/deny', denyTrainingRecordHandler);

export default router;

