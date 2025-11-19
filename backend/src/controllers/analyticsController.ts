import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middleware/auth.js';
import { getAnalyticsFilters, getAnalyticsSummary } from '../services/analyticsService.js';

const ELEVATED_ROLES = ['global_admin', 'admin'];

const normalizeDate = (value?: string | string[]) => {
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

export async function analyticsSummaryHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const isElevated = ELEVATED_ROLES.includes(req.user.role);
    const requestedLocation =
      typeof req.query.locationId === 'string' && req.query.locationId !== 'all'
        ? req.query.locationId
        : undefined;

    const effectiveLocationId = isElevated ? requestedLocation : req.user.locationId;

    const summary = await getAnalyticsSummary({
      organizationId: req.user.organizationId,
      locationId: effectiveLocationId,
      department: typeof req.query.department === 'string' && req.query.department !== 'all' ? req.query.department : undefined,
      jobTitle: typeof req.query.jobTitle === 'string' && req.query.jobTitle !== 'all' ? req.query.jobTitle : undefined,
      courseId: typeof req.query.courseId === 'string' && req.query.courseId !== 'all' ? req.query.courseId : undefined,
      startDate: normalizeDate(req.query.startDate as string | undefined),
      endDate: normalizeDate(req.query.endDate as string | undefined)
    });

    return res.json(summary);
  } catch (error) {
    console.error('Analytics summary error', error);
    return res.status(500).json({ message: 'Unable to fetch analytics summary' });
  }
}

export async function analyticsFiltersHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const isElevated = ELEVATED_ROLES.includes(req.user.role);
    const requestedLocation =
      typeof req.query.locationId === 'string' && req.query.locationId !== 'all'
        ? req.query.locationId
        : undefined;

    const filters = await getAnalyticsFilters({
      organizationId: req.user.organizationId,
      locationId: isElevated ? requestedLocation : req.user.locationId
    });

    return res.json(filters);
  } catch (error) {
    console.error('Analytics filters error', error);
    return res.status(500).json({ message: 'Unable to fetch analytics filters' });
  }
}

