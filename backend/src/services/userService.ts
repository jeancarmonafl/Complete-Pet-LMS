import type { QueryResult } from 'pg';

import pool from '../config/database.js';
import { buildEmployeeId, buildLoginIdentifier } from '../utils/identifiers.js';
import { generateTemporaryPassword, hashPassword } from '../utils/password.js';

type Role = 'global_admin' | 'admin' | 'manager' | 'supervisor' | 'employee';

interface CreateUserPayload {
  organizationId: string;
  locationId: string;
  fullName: string;
  email?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  role: Role;
  supervisorId?: string | null;
  joinedDate?: string | null;
  password?: string | null;
}

export interface CreatedUserCredentials {
  id: string;
  employeeId: string;
  loginIdentifier: string;
  temporaryPassword: string;
  fullName: string;
  department?: string | null;
  jobTitle?: string | null;
  role: string;
}

async function fetchNextEmployeeSequence(locationId: string): Promise<number> {
  const result = await pool.query<{ next_sequence: number }>(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)), 0) + 1 AS next_sequence
     FROM users
     WHERE location_id = $1`,
    [locationId]
  );

  return result.rows[0].next_sequence;
}

export async function createUser(payload: CreateUserPayload): Promise<CreatedUserCredentials> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const nextSequence = await fetchNextEmployeeSequence(payload.locationId);
    const employeeId = buildEmployeeId(nextSequence);
    const loginIdentifier = buildLoginIdentifier(payload.fullName, employeeId, payload.email);
    const temporaryPassword = payload.password || generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    const insertResult = await client.query<{
      id: string;
    }>(
      `INSERT INTO users (
        organization_id,
        location_id,
        full_name,
        login_identifier,
        email,
        employee_id,
        password_hash,
        department,
        job_title,
        app_role,
        supervisor_id,
        joined_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id`,
      [
        payload.organizationId,
        payload.locationId,
        payload.fullName,
        loginIdentifier,
        payload.email ?? null,
        employeeId,
        passwordHash,
        payload.department ?? null,
        payload.jobTitle ?? null,
        payload.role,
        payload.supervisorId ?? null,
        payload.joinedDate ?? null
      ]
    );

    await client.query('COMMIT');

    return {
      id: insertResult.rows[0].id,
      employeeId,
      loginIdentifier,
      temporaryPassword,
      fullName: payload.fullName,
      department: payload.department,
      jobTitle: payload.jobTitle,
      role: payload.role
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listSupervisors(locationId: string): Promise<QueryResult> {
  return pool.query(
    `SELECT id, full_name AS fullName
     FROM users
     WHERE location_id = $1 AND app_role IN ('supervisor', 'manager', 'admin', 'global_admin')
     ORDER BY full_name`,
    [locationId]
  );
}

export async function listUsers(locationId: string): Promise<QueryResult> {
  return pool.query(
    `SELECT 
      id,
      full_name,
      email,
      employee_id,
      department,
      job_title,
      app_role as role,
      CASE WHEN is_active = true THEN 'active' ELSE 'inactive' END as status,
      is_active AS "isActive",
      created_at,
      joined_date
     FROM users
     WHERE location_id = $1
     ORDER BY created_at DESC`,
    [locationId]
  );
}

export async function updateUser(userId: string, locationId: string, updates: Record<string, any>): Promise<QueryResult> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  const fieldMap: Record<string, string> = {
    fullName: 'full_name',
    email: 'email',
    department: 'department',
    jobTitle: 'job_title',
    role: 'app_role',
    supervisorId: 'supervisor_id',
    joinedDate: 'joined_date',
    isActive: 'is_active'
  };

  for (const [key, dbColumn] of Object.entries(fieldMap)) {
    if (updates[key] !== undefined) {
      fields.push(`${dbColumn} = $${paramCount++}`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(userId);
  values.push(locationId);

  const query = `
    UPDATE users 
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount++} AND location_id = $${paramCount}
    RETURNING id
  `;

  return pool.query(query, values);
}

export async function updateUserStatus(userId: string, locationId: string, isActive: boolean): Promise<QueryResult> {
  return pool.query(
    `
      UPDATE users
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND location_id = $3
      RETURNING id, is_active AS "isActive"
    `,
    [isActive, userId, locationId]
  );
}

export async function resetPassword(userId: string, locationId: string, newPassword: string): Promise<QueryResult> {
  const passwordHash = await hashPassword(newPassword);
  
  return pool.query(
    `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND location_id = $3
      RETURNING id
    `,
    [passwordHash, userId, locationId]
  );
}

export async function getUserActivity(userId: string, locationId?: string) {
  const client = await pool.connect();

  try {
    const filterByLocation = Boolean(locationId);
    const userResult = await client.query(
      `
        SELECT
          id,
          full_name,
          employee_id,
          department,
          job_title,
          app_role AS role,
          joined_date,
          created_at,
          is_active
        FROM users
        WHERE id = $1
        ${filterByLocation ? 'AND location_id = $2' : ''}
      `,
      filterByLocation ? [userId, locationId] : [userId]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const summaryResult = await client.query(
      `
        SELECT 
          COUNT(*)::int AS total_assignments,
          COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_assignments,
          COUNT(*) FILTER (WHERE status <> 'completed')::int AS pending_assignments,
          COUNT(*) FILTER (
            WHERE deadline IS NOT NULL 
              AND deadline < NOW() 
              AND status <> 'completed'
          )::int AS overdue_assignments,
          ROUND(AVG(EXTRACT(EPOCH FROM (completed_date - started_date)))/3600, 2) AS avg_completion_hours
        FROM enrollments
        WHERE user_id = $1
      `,
      [userId]
    );

    const quizStatsResult = await client.query(
      `
        SELECT 
          ROUND(AVG(tr.quiz_score), 1) AS avg_quiz_score
        FROM training_records tr
        WHERE tr.user_id = $1
      `,
      [userId]
    );

    const activityResult = await client.query(
      `
        SELECT 
          e.id,
          c.title AS course_title,
          c.content_type,
          e.status,
          e.progress_percentage,
          e.deadline,
          e.started_date,
          e.completed_date,
          tr.quiz_score,
          tr.approval_status,
          tr.supervisor_signature_date
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN training_records tr ON tr.enrollment_id = e.id
        WHERE e.user_id = $1
        ORDER BY e.created_at DESC
      `,
      [userId]
    );

    return {
      user: userResult.rows[0],
      summary: {
        ...summaryResult.rows[0],
        avg_quiz_score: quizStatsResult.rows[0]?.avg_quiz_score ?? null
      },
      activity: activityResult.rows
    };
  } finally {
    client.release();
  }
}
