import pool from '../config/database.js';

interface CoursePayload {
  organizationId: string;
  locationId: string;
  title: string;
  description?: string;
  category?: string;
  contentType: 'video' | 'pdf' | 'scorm' | 'other';
  contentUrl?: string;
  durationMinutes?: number;
  passPercentage?: number;
  isMandatory?: boolean;
  isPublished?: boolean;
  assignedDepartments?: string[];
  assignedPositions?: string[];
  assignToEntireCompany?: boolean;
  exceptionPositions?: string[];
  isActive?: boolean;
}

export async function createCourse(payload: CoursePayload) {
  const result = await pool.query(
    `INSERT INTO courses (
      organization_id,
      location_id,
      title,
      description,
      category,
      content_type,
      content_url,
      duration_minutes,
      pass_percentage,
      is_mandatory,
      is_published,
      assigned_departments,
      assigned_positions,
      assign_to_entire_company,
      exception_positions,
      is_active
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING *`,
    [
      payload.organizationId,
      payload.locationId,
      payload.title,
      payload.description ?? null,
      payload.category ?? null,
      payload.contentType,
      payload.contentUrl ?? null,
      payload.durationMinutes ?? null,
      payload.passPercentage ?? 80,
      payload.isMandatory ?? false,
      payload.isPublished ?? false,
      payload.assignedDepartments ?? null,
      payload.assignedPositions ?? null,
      payload.assignToEntireCompany ?? false,
      payload.exceptionPositions ?? null,
      payload.isActive ?? true
    ]
  );

  return result.rows[0];
}

export async function listCourses(organizationId: string, locationId: string) {
  const result = await pool.query(
    `SELECT * FROM courses WHERE organization_id = $1 AND location_id = $2 ORDER BY created_at DESC`,
    [organizationId, locationId]
  );

  return result.rows;
}

export async function updateCourse(courseId: string, locationId: string, updates: Partial<CoursePayload>) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  const fieldMap: Record<string, string> = {
    title: 'title',
    description: 'description',
    category: 'category',
    contentType: 'content_type',
    contentUrl: 'content_url',
    durationMinutes: 'duration_minutes',
    passPercentage: 'pass_percentage',
    isMandatory: 'is_mandatory',
    isPublished: 'is_published',
    assignedDepartments: 'assigned_departments',
    assignedPositions: 'assigned_positions',
    assignToEntireCompany: 'assign_to_entire_company',
    exceptionPositions: 'exception_positions',
    isActive: 'is_active'
  };

  for (const [key, dbColumn] of Object.entries(fieldMap)) {
    if (updates[key as keyof CoursePayload] !== undefined) {
      fields.push(`${dbColumn} = $${paramCount++}`);
      values.push(updates[key as keyof CoursePayload]);
    }
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(courseId);
  values.push(locationId);

  const query = `
    UPDATE courses 
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramCount++} AND location_id = $${paramCount}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function deleteCourse(courseId: string, locationId: string) {
  const result = await pool.query(
    `DELETE FROM courses WHERE id = $1 AND location_id = $2 RETURNING *`,
    [courseId, locationId]
  );
  return result.rows[0];
}

export async function updateCourseStatus(courseId: string, locationId: string, isActive: boolean) {
  const result = await pool.query(
    `
      UPDATE courses
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND location_id = $3
      RETURNING *
    `,
    [isActive, courseId, locationId]
  );

  return result.rows[0];
}
