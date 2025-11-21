import { Response } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middleware/auth.js';
import {
  createTrainingRecord,
  getPendingApprovals,
  getTrainingRecordsByLocation,
  approveTrainingRecord,
  denyTrainingRecord
} from '../services/trainingRecordService.js';

const createRecordSchema = z.object({
  courseId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  quizScore: z.number().min(0).max(100),
  passPercentage: z.number().min(0).max(100),
  employeeSignature: z.string().min(1),
  durationMinutes: z.number().positive(),
  quizAttemptId: z.string().uuid().optional()
});

export async function createTrainingRecordHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const body = createRecordSchema.parse(req.body);

    const record = await createTrainingRecord({
      userId: req.user.userId,
      organizationId: req.user.organizationId,
      locationId: req.user.locationId,
      ...body
    });

    return res.status(201).json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ message: 'Invalid payload', issues: error.issues });
    }

    console.error('Error creating training record:', error);
    return res.status(500).json({ message: 'Unable to create training record' });
  }
}

export async function getPendingApprovalsHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!['global_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const approvals = await getPendingApprovals(
      req.user.organizationId,
      req.user.locationId
    );

    return res.json(approvals);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return res.status(500).json({ message: 'Unable to fetch pending approvals' });
  }
}

export async function getTrainingRecordsHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const records = await getTrainingRecordsByLocation(
      req.user.organizationId,
      req.user.locationId
    );

    return res.json(records);
  } catch (error) {
    console.error('Error fetching training records:', error);
    return res.status(500).json({ message: 'Unable to fetch training records' });
  }
}

export async function approveTrainingRecordHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!['global_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const recordId = req.params.id;
    const { supervisorSignature } = req.body;

    if (!supervisorSignature) {
      return res.status(400).json({ message: 'Supervisor signature is required' });
    }

    const record = await approveTrainingRecord(
      recordId,
      req.user.userId,
      supervisorSignature,
      req.user.locationId
    );

    if (!record) {
      return res.status(404).json({ message: 'Training record not found' });
    }

    return res.json(record);
  } catch (error) {
    console.error('Error approving training record:', error);
    return res.status(500).json({ message: 'Unable to approve training record' });
  }
}

export async function denyTrainingRecordHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!['global_admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    const recordId = req.params.id;
    const { reason } = req.body;

    const result = await denyTrainingRecord(recordId, req.user.locationId, reason);

    return res.json(result);
  } catch (error) {
    console.error('Error denying training record:', error);
    return res.status(500).json({ message: 'Unable to deny training record' });
  }
}

