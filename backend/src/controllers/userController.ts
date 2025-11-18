import { Response } from 'express';
import { z } from 'zod';

import { AuthenticatedRequest } from '../middleware/auth.js';
import { createUser, getUserActivity, listSupervisors, listUsers, resetPassword, updateUser, updateUserStatus } from '../services/userService.js';

const createUserSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  role: z.enum(['global_admin', 'admin', 'manager', 'supervisor', 'employee']),
  supervisorId: z.string().uuid().optional(),
  joinedDate: z.string().optional(),
  password: z.string().min(8).optional()
});

const updateUserSchema = createUserSchema.partial().extend({
  isActive: z.boolean().optional()
});

const userStatusSchema = z.object({
  isActive: z.boolean()
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8)
});

export async function createUserHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const body = createUserSchema.parse(req.body);

    if (!['global_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await createUser({
      organizationId: req.user.organizationId,
      locationId: req.user.locationId,
      fullName: body.fullName,
      email: body.email,
      department: body.department,
      jobTitle: body.jobTitle,
      role: body.role,
      supervisorId: body.supervisorId,
      joinedDate: body.joinedDate,
      password: body.password
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ message: 'Invalid payload', issues: error.issues });
    }

    return res.status(500).json({ message: 'Unable to create user' });
  }
}

export async function listSupervisorsHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const result = await listSupervisors(req.user.locationId);

  return res.json(result.rows);
}

export async function listUsersHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const result = await listUsers(req.user.locationId);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch users' });
  }
}

export async function updateUserHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = req.params.id;
    const body = updateUserSchema.parse(req.body);

    if (!['global_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await updateUser(userId, req.user.locationId, body);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ message: 'Invalid payload', issues: error.issues });
    }

    return res.status(500).json({ message: 'Unable to update user' });
  }
}

export async function updateUserStatusHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = req.params.id;
    const body = userStatusSchema.parse(req.body);

    if (!['global_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await updateUserStatus(userId, req.user.locationId, body.isActive);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'User status updated', isActive: result.rows[0].isActive });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ message: 'Invalid payload', issues: error.issues });
    }

    return res.status(500).json({ message: 'Unable to update user status' });
  }
}

export async function getUserActivityHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = req.params.id;
    const hasElevatedRole = ['global_admin', 'admin', 'manager', 'supervisor'].includes(req.user.role);
    const isSelfRequest = req.user.id === userId;

    if (!hasElevatedRole && !isSelfRequest) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Only filter by location when viewing OTHER users' data and not a global/admin
    // When viewing your own data, no location filter should be applied
    const shouldFilterByLocation = !isSelfRequest && !['global_admin', 'admin'].includes(req.user.role);
    
    const activity = await getUserActivity(
      userId,
      shouldFilterByLocation ? req.user.locationId : undefined
    );

    if (!activity) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(activity);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch user activity' });
  }
}

export async function resetPasswordHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const userId = req.params.id;
    const body = resetPasswordSchema.parse(req.body);

    if (!['global_admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await resetPassword(userId, req.user.locationId, body.newPassword);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(422).json({ message: 'Invalid payload', issues: error.issues });
    }

    return res.status(500).json({ message: 'Unable to reset password' });
  }
}
