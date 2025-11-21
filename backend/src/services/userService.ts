import type { QueryResult } from 'pg';

import pool from '../config/database.js';
import { buildEmployeeId, buildLoginIdentifier } from '../utils/identifiers.js';
import { generateTemporaryPassword, hashPassword } from '../utils/password.js';

type Role = 'global_admin' | 'admin' | 'manager' | 'supervisor' | 'employee';

interface CourseAssignmentRuleRow {
  id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  duration_minutes: number | null;
  pass_percentage: number | null;
  assigned_departments: string[] | null;
  assigned_positions: string[] | null;
  assign_to_entire_company: boolean;
  exception_positions: string[] | null;
}

interface ActivityRow {
  id: string;
  course_id: string;
  course_title: string;
  content_type: string;
  content_url: string | null;
  duration_minutes: number | null;
  pass_percentage: number | null;
  status: string | null;
  progress_percentage: number | null;
  deadline: string | null;
  started_date: string | null;
  completed_date: string | null;
  quiz_score: number | null;
  approval_status: string | null;
  supervisor_signature_date: string | null;
}

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

function normalizeString(value?: string | null): string {
  return value?.trim().toLowerCase() ?? '';
}

function matchesScope(value: string | null, scope?: string[] | null): boolean {
  if (!scope || scope.length === 0) {
    return false;
  }

  const normalizedValue = normalizeString(value);
  return scope.some((entry) => normalizeString(entry) === normalizedValue);
}

function shouldAssignCourseToUser(
  course: CourseAssignmentRuleRow,
  user: { department: string | null; job_title: string | null }
): boolean {
  const exceptionPositions = course.exception_positions ?? [];
  const isException = matchesScope(user.job_title, exceptionPositions);

  if (isException) {
    return false;
  }

  if (course.assign_to_entire_company) {
    return true;
  }

  const hasDepartmentScope = Boolean(course.assigned_departments?.length);
  const hasPositionScope = Boolean(course.assigned_positions?.length);
  const departmentMatches = matchesScope(user.department, course.assigned_departments);
  const positionMatches = matchesScope(user.job_title, course.assigned_positions);

  if (hasDepartmentScope && hasPositionScope) {
    return departmentMatches || positionMatches;
  }

  if (hasDepartmentScope) {
    return departmentMatches;
  }

  if (hasPositionScope) {
    return positionMatches;
  }

  return true;
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
          organization_id,
          location_id,
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

    const user = userResult.rows[0];

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
          e.course_id,
          c.title AS course_title,
          c.content_type,
          c.content_url,
          c.content_url_en,
          c.content_url_es,
          c.content_url_ne,
          c.duration_minutes,
          c.pass_percentage,
          e.status,
          e.progress_percentage,
          e.deadline,
          e.started_date,
          e.completed_date,
          tr.quiz_score,
          tr.approval_status,
          tr.supervisor_signature_date,
          q.questions AS quiz_questions
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        LEFT JOIN training_records tr ON tr.enrollment_id = e.id
        LEFT JOIN quizzes q ON q.course_id = c.id AND q.is_active = TRUE
        WHERE e.user_id = $1
        ORDER BY e.created_at DESC
      `,
      [userId]
    );

    const assignableCoursesResult = await client.query<CourseAssignmentRuleRow>(
      `
        SELECT
          id,
          title,
          content_type,
          content_url,
          content_url_en,
          content_url_es,
          content_url_ne,
          duration_minutes,
          pass_percentage,
          assigned_departments,
          assigned_positions,
          assign_to_entire_company,
          exception_positions
        FROM courses
        WHERE organization_id = $1
          AND location_id = $2
          AND COALESCE(is_active, true) = true
          AND COALESCE(is_published, false) = true
      `,
      [user.organization_id, user.location_id]
    );

    const existingActivity = activityResult.rows as ActivityRow[];
    const existingActivityByCourse = new Map(existingActivity.map((entry) => [entry.course_id, entry]));

    // Fetch quiz questions for missing assignments
    const missingCourseIds = assignableCoursesResult.rows
      .filter((course) => shouldAssignCourseToUser(course, { department: user.department, job_title: user.job_title }))
      .filter((course) => !existingActivityByCourse.has(course.id))
      .map((course) => course.id);

    let quizQuestionsMap = new Map<string, any>();
    if (missingCourseIds.length > 0) {
      const quizzesResult = await client.query(
        `SELECT course_id, questions FROM quizzes WHERE course_id = ANY($1) AND is_active = TRUE`,
        [missingCourseIds]
      );
      quizzesResult.rows.forEach((row) => {
        quizQuestionsMap.set(row.course_id, row.questions);
      });
    }

    const missingAssignments = assignableCoursesResult.rows
      .filter((course) => shouldAssignCourseToUser(course, { department: user.department, job_title: user.job_title }))
      .filter((course) => !existingActivityByCourse.has(course.id))
      .map<ActivityRow>((course) => ({
        id: `virtual-${course.id}`,
        course_id: course.id,
        course_title: course.title,
        content_type: course.content_type,
        content_url: course.content_url,
        content_url_en: (course as any).content_url_en,
        content_url_es: (course as any).content_url_es,
        content_url_ne: (course as any).content_url_ne,
        duration_minutes: course.duration_minutes,
        pass_percentage: course.pass_percentage,
        status: 'not_started',
        progress_percentage: 0,
        deadline: null,
        started_date: null,
        completed_date: null,
        quiz_score: null,
        approval_status: null,
        supervisor_signature_date: null,
        quiz_questions: quizQuestionsMap.get(course.id) || null
      }));

    const combinedActivity = [...existingActivity, ...missingAssignments];
    const summaryRow = summaryResult.rows[0];
    const totalAssignments = summaryRow.total_assignments + missingAssignments.length;
    const pendingAssignments = summaryRow.pending_assignments + missingAssignments.length;

    return {
      user,
      summary: {
        ...summaryRow,
        total_assignments: totalAssignments,
        pending_assignments: pendingAssignments,
        avg_quiz_score: quizStatsResult.rows[0]?.avg_quiz_score ?? null
      },
      activity: combinedActivity
    };
  } finally {
    client.release();
  }
}
