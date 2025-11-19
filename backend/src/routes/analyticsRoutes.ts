import { Router } from 'express';

import { analyticsFiltersHandler, analyticsSummaryHandler } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate());
router.get('/summary', analyticsSummaryHandler);
router.get('/filters', analyticsFiltersHandler);

export default router;

