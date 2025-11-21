import pool from '../config/database.js';

interface CreateTrainingRecordPayload {
  userId: string;
  courseId: string;
  enrollmentId: string;
  organizationId: string;
  locationId: string;
  quizScore: number;
  passPercentage: number;
  employeeSignature: string;
  durationMinutes: number;
  quizAttemptId?: string;
}

export async function createTrainingRecord(payload: CreateTrainingRecordPayload) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Create training record with pending_review status
    const recordResult = await client.query(
      `
        INSERT INTO training_records (
          organization_id,
          location_id,
          user_id,
          course_id,
          enrollment_id,
          quiz_attempt_id,
          completion_date,
          quiz_score,
          employee_signature_data,
          employee_signature_date,
          approval_status
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, NOW(), 'pending_review')
        RETURNING *
      `,
      [
        payload.organizationId,
        payload.locationId,
        payload.userId,
        payload.courseId,
        payload.enrollmentId,
        payload.quizAttemptId || null,
        payload.quizScore,
        payload.employeeSignature
      ]
    );

    // Update enrollment status to completed
    await client.query(
      `
        UPDATE enrollments
        SET status = 'completed',
            completed_date = NOW(),
            progress_percentage = 100,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
      `,
      [payload.enrollmentId, payload.userId]
    );

    // Create quiz attempt record
    if (payload.quizAttemptId) {
      // Quiz attempt already exists, just reference it
    } else {
      // Create a new quiz attempt
      const quizResult = await client.query(
        `SELECT id FROM quizzes WHERE course_id = $1 AND is_active = TRUE LIMIT 1`,
        [payload.courseId]
      );

      if (quizResult.rows.length > 0) {
        const quizId = quizResult.rows[0].id;
        const attemptResult = await client.query(
          `
            INSERT INTO quiz_attempts (
              user_id,
              course_id,
              quiz_id,
              answers,
              score,
              percentage,
              passed,
              attempt_number,
              time_taken_seconds
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)
            RETURNING id
          `,
          [
            payload.userId,
            payload.courseId,
            quizId,
            JSON.stringify([]), // Empty answers for now
            payload.quizScore,
            payload.quizScore,
            payload.quizScore >= payload.passPercentage,
            Math.floor((payload.durationMinutes || 5) * 60)
          ]
        );

        // Update training record with quiz_attempt_id
        await client.query(
          `UPDATE training_records SET quiz_attempt_id = $1 WHERE id = $2`,
          [attemptResult.rows[0].id, recordResult.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');
    return recordResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getPendingApprovals(organizationId: string, locationId: string) {
  const result = await pool.query(
    `
      SELECT
        tr.id,
        tr.user_id,
        tr.course_id,
        tr.completion_date,
        tr.quiz_score,
        tr.employee_signature_data,
        tr.employee_signature_date,
        tr.approval_status,
        u.full_name AS employee_name,
        u.employee_id,
        c.title AS course_title,
        c.pass_percentage,
        c.duration_minutes
      FROM training_records tr
      JOIN users u ON tr.user_id = u.id
      JOIN courses c ON tr.course_id = c.id
      WHERE tr.organization_id = $1
        AND tr.location_id = $2
        AND tr.approval_status = 'pending_review'
      ORDER BY tr.completion_date DESC
    `,
    [organizationId, locationId]
  );

  return result.rows;
}

export async function getTrainingRecordsByLocation(organizationId: string, locationId: string) {
  const result = await pool.query(
    `
      SELECT
        tr.id,
        tr.user_id,
        tr.course_id,
        tr.completion_date,
        tr.quiz_score,
        tr.employee_signature_data,
        tr.employee_signature_date,
        tr.supervisor_id,
        tr.supervisor_signature_data,
        tr.supervisor_signature_date,
        tr.approval_status,
        u.full_name AS employee_name,
        u.employee_id,
        c.title AS course_title,
        c.pass_percentage,
        c.duration_minutes
      FROM training_records tr
      JOIN users u ON tr.user_id = u.id
      JOIN courses c ON tr.course_id = c.id
      WHERE tr.organization_id = $1
        AND tr.location_id = $2
        AND tr.approval_status = 'approved'
      ORDER BY tr.completion_date DESC
    `,
    [organizationId, locationId]
  );

  return result.rows;
}

export async function approveTrainingRecord(
  recordId: string,
  supervisorId: string,
  supervisorSignature: string,
  locationId: string
) {
  const result = await pool.query(
    `
      UPDATE training_records
      SET approval_status = 'approved',
          supervisor_id = $1,
          supervisor_signature_data = $2,
          supervisor_signature_date = NOW(),
          updated_at = NOW()
      WHERE id = $3 AND location_id = $4
      RETURNING *
    `,
    [supervisorId, supervisorSignature, recordId, locationId]
  );

  return result.rows[0];
}

export async function denyTrainingRecord(recordId: string, locationId: string, reason?: string) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get training record details
    const recordResult = await client.query(
      `SELECT user_id, course_id, enrollment_id, quiz_attempt_id 
       FROM training_records 
       WHERE id = $1 AND location_id = $2`,
      [recordId, locationId]
    );

    if (recordResult.rows.length === 0) {
      throw new Error('Training record not found');
    }

    const record = recordResult.rows[0];

    // Delete quiz attempt if exists
    if (record.quiz_attempt_id) {
      await client.query(
        `DELETE FROM quiz_attempts WHERE id = $1`,
        [record.quiz_attempt_id]
      );
    }

    // Delete training record
    await client.query(
      `DELETE FROM training_records WHERE id = $1`,
      [recordId]
    );

    // Reset enrollment to in_progress
    await client.query(
      `
        UPDATE enrollments
        SET status = 'in_progress',
            completed_date = NULL,
            progress_percentage = 0,
            updated_at = NOW()
        WHERE id = $1
      `,
      [record.enrollment_id]
    );

    await client.query('COMMIT');
    return { success: true, message: 'Training record denied and reset' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

