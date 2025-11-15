import jwt from 'jsonwebtoken';
import env from '../config/env.js';
export function authenticate(required = true) {
    return (req, res, next) => {
        const header = req.headers.authorization;
        if (!header) {
            if (required) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            return next();
        }
        const token = header.replace('Bearer ', '');
        try {
            const payload = jwt.verify(token, env.JWT_SECRET);
            req.user = {
                id: payload.sub,
                organizationId: payload.organizationId,
                locationId: payload.locationId,
                role: payload.role
            };
            return next();
        }
        catch (error) {
            if (required) {
                return res.status(401).json({ message: 'Invalid token' });
            }
            return next();
        }
    };
}
export function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        return next();
    };
}
