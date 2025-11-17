import type { PoolClient } from 'pg';

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

export async function deleteCourse(
  courseId: string,
  organizationId: string,
  locationId?: string
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const filters: string[] = [courseId, organizationId];
    let condition = 'id = $1 AND organization_id = $2';

    if (locationId) {
      filters.push(locationId);
      condition += ` AND location_id = $${filters.length}`;
    }

    const courseResult = await client.query(
      `SELECT id FROM courses WHERE ${condition} FOR UPDATE`,
      filters
    );

    if (courseResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const { id: scopedCourseId } = courseResult.rows[0];

    await deleteCourseDependencies(client, scopedCourseId);

    const deleteResult = await client.query(
      'DELETE FROM courses WHERE id = $1 RETURNING *',
      [scopedCourseId]
    );

    await client.query('COMMIT');
    return deleteResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

type TableColumnMap = Map<string, Set<string>>;

async function deleteCourseDependencies(client: PoolClient, courseId: string) {
  const referencingResult = await client.query<{
    table_name: string;
    column_name: string;
  }>(
    `
      SELECT
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND ccu.table_name = 'courses'
        AND ccu.column_name = 'id'
    `
  );

  if (referencingResult.rowCount === 0) {
    return;
  }

  const tableColumnMap: TableColumnMap = new Map();

  for (const row of referencingResult.rows) {
    if (!tableColumnMap.has(row.table_name)) {
      tableColumnMap.set(row.table_name, new Set());
    }
    tableColumnMap.get(row.table_name)!.add(row.column_name);
  }

  const tableNames = Array.from(tableColumnMap.keys());
  const deletionOrder = await resolveDeletionOrder(client, tableNames);

  for (const tableName of deletionOrder) {
    const columns = tableColumnMap.get(tableName);
    if (!columns) continue;

    for (const columnName of columns) {
      const deleteSql = `DELETE FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(columnName)} = $1`;
      await client.query(deleteSql, [courseId]);
    }
  }
}

async function resolveDeletionOrder(client: PoolClient, tableNames: string[]) {
  if (tableNames.length === 0) {
    return [];
  }

  const dependencyResult = await client.query<{
    referencing_table: string;
    referenced_table: string;
  }>(
    `
      SELECT
        tc.table_name AS referencing_table,
        ccu.table_name AS referenced_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = ANY($1)
        AND ccu.table_name = ANY($2)
    `,
    [tableNames, [...tableNames, 'courses']]
  );

  const adjacency = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();

  tableNames.forEach((table) => {
    adjacency.set(table, new Set());
    inDegree.set(table, 0);
  });

  for (const row of dependencyResult.rows) {
    const from = row.referencing_table;
    const to = row.referenced_table;

    if (!adjacency.has(from) || !adjacency.has(to) || from === to) {
      continue;
    }

    const neighbors = adjacency.get(from)!;

    if (!neighbors.has(to)) {
      neighbors.add(to);
      inDegree.set(to, (inDegree.get(to) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  inDegree.forEach((degree, table) => {
    if (degree === 0) {
      queue.push(table);
    }
  });

  const ordered: string[] = [];

  while (queue.length > 0) {
    const table = queue.shift()!;
    ordered.push(table);

    adjacency.get(table)?.forEach((neighbor) => {
      const nextDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, nextDegree);

      if (nextDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  if (ordered.length !== tableNames.length) {
    const remaining = tableNames.filter((table) => !ordered.includes(table));
    return [...ordered, ...remaining];
  }

  return ordered;
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
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
