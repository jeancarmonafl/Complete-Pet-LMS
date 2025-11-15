import jwt from 'jsonwebtoken';

import env from '../config/env.js';
import pool from '../config/database.js';
import { verifyPassword } from '../utils/password.js';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    fullName: string;
    role: string;
    organizationId: string;
    locationId: string;
    locationCode: string;
  };
}

export async function login(
  identifier: string,
  password: string,
  locationCode: string
): Promise<LoginResponse> {
  const normalizedIdentifier = identifier.toLowerCase();
  const normalizedLocationCode = locationCode.toUpperCase();

  const query = await pool.query(
    `SELECT u.id,
            u.full_name AS "fullName",
            u.password_hash AS "passwordHash",
            u.app_role AS role,
            u.organization_id AS "organizationId",
            u.location_id AS "locationId",
            l.code AS "locationCode",
            u.is_active AS "isActive"
     FROM users u
     INNER JOIN locations l ON l.id = u.location_id
     WHERE (u.login_identifier = $1 OR u.email = $1)
       AND l.code = $2`,
    [normalizedIdentifier, normalizedLocationCode]
  );

  const user = query.rows[0];
  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    throw new Error('Invalid credentials');
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  
  if (!passwordValid) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    {
      sub: user.id,
      organizationId: user.organizationId,
      locationId: user.locationId,
      role: user.role,
      locationCode: user.locationCode
    },
    env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      locationId: user.locationId,
      locationCode: user.locationCode
    }
  };
}
