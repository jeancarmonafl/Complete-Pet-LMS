import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import env from '../config/env.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    locationId: string;
    role: string;
  };
}

export function authenticate(required = true) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
      if (required) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      return next();
    }

    const token = header.replace('Bearer ', '');

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        organizationId: string;
        locationId: string;
        role: string;
      };

      req.user = {
        id: payload.sub,
        organizationId: payload.organizationId,
        locationId: payload.locationId,
        role: payload.role
      };

      return next();
    } catch (error) {
      if (required) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      return next();
    }
  };
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}
