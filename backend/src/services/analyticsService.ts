import pool from '../config/database.js';

type AnalyticsFilters = {
  organizationId: string;
  locationId?: string;
  department?: string;
  jobTitle?: string;
  courseId?: string;
  startDate?: string;
  endDate?: string;
};

const numberOr = (value: unknown, fallback = 0) => {
  if (value === null || value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildWhereClauseFactory = (baseFilters: string[]) => {
  return (extra: string[] = []) => {
    const clauses = [...baseFilters, ...extra];
    return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  };
};

export async function getAnalyticsSummary(filters: AnalyticsFilters) {
  const client = await pool.connect();

  try {
    const params: Array<string> = [filters.organizationId];
    const baseFilters: string[] = ['u.organization_id = $1'];

    if (filters.locationId) {
      params.push(filters.locationId);
      baseFilters.push(`u.location_id = $${params.length}`);
    }

    if (filters.department) {
      params.push(filters.department);
      baseFilters.push(`u.department = $${params.length}`);
    }

    if (filters.jobTitle) {
      params.push(filters.jobTitle);
      baseFilters.push(`u.job_title = $${params.length}`);
    }

    if (filters.courseId) {
      params.push(filters.courseId);
      baseFilters.push(`e.course_id = $${params.length}`);
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      baseFilters.push(`e.created_at >= $${params.length}`);
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      baseFilters.push(`e.created_at <= $${params.length}`);
    }

    const buildWhereClause = buildWhereClauseFactory(baseFilters);

    const baseFromClause = `
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN training_records tr ON tr.enrollment_id = e.id
    `;

    const summaryResult = await client.query(
      `
        SELECT
          COUNT(*)::int AS total_assignments,
          COALESCE(SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed_assignments,
          COALESCE(SUM(CASE WHEN e.status <> 'completed' THEN 1 ELSE 0 END), 0)::int AS pending_assignments,
          COALESCE(SUM(CASE WHEN e.deadline IS NOT NULL AND e.status <> 'completed' AND e.deadline < NOW() THEN 1 ELSE 0 END), 0)::int AS overdue_assignments,
          COUNT(DISTINCT e.user_id)::int AS participant_count,
          ROUND(
            CASE WHEN COUNT(*) = 0 THEN 0
                 ELSE (SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100
            END,
            1
          ) AS overall_compliance,
          ROUND(AVG(tr.quiz_score), 1) AS avg_quiz_score,
          ROUND(AVG(EXTRACT(EPOCH FROM (e.completed_date - e.started_date)))/3600, 1) AS avg_completion_hours
        ${baseFromClause}
        ${buildWhereClause()}
      `,
      params
    );

    const momentumResult = await client.query(
      `
        SELECT
          COUNT(*) FILTER (WHERE e.status = 'completed' AND e.completed_date >= NOW() - INTERVAL '30 days')::int AS current_period,
          COUNT(*) FILTER (
            WHERE e.status = 'completed'
              AND e.completed_date >= NOW() - INTERVAL '60 days'
              AND e.completed_date < NOW() - INTERVAL '30 days'
          )::int AS previous_period
        ${baseFromClause}
        ${buildWhereClause()}
      `,
      params
    );

    const topEmployeesResult = await client.query(
      `
        SELECT
          u.id AS user_id,
          u.full_name,
          u.department,
          u.job_title,
          COUNT(*)::int AS total_assignments,
          COALESCE(SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed_assignments,
          COALESCE(SUM(CASE WHEN e.deadline IS NOT NULL AND e.status <> 'completed' AND e.deadline < NOW() THEN 1 ELSE 0 END), 0)::int AS overdue_assignments,
          ROUND(
            CASE WHEN COUNT(*) = 0 THEN 0
                 ELSE (SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100
            END,
            1
          ) AS completion_rate,
          ROUND(AVG(tr.quiz_score), 1) AS avg_quiz_score
        ${baseFromClause}
        ${buildWhereClause()}
        GROUP BY u.id, u.full_name, u.department, u.job_title
        HAVING COUNT(*) > 0
        ORDER BY completion_rate DESC, overdue_assignments ASC, avg_quiz_score DESC
        LIMIT 10
      `,
      params
    );

    const bottomEmployeesResult = await client.query(
      `
        SELECT
          u.id AS user_id,
          u.full_name,
          u.department,
          u.job_title,
          COUNT(*)::int AS total_assignments,
          COALESCE(SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed_assignments,
          COALESCE(SUM(CASE WHEN e.deadline IS NOT NULL AND e.status <> 'completed' AND e.deadline < NOW() THEN 1 ELSE 0 END), 0)::int AS overdue_assignments,
          ROUND(
            CASE WHEN COUNT(*) = 0 THEN 0
                 ELSE (SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100
            END,
            1
          ) AS completion_rate,
          ROUND(AVG(tr.quiz_score), 1) AS avg_quiz_score
        ${baseFromClause}
        ${buildWhereClause()}
        GROUP BY u.id, u.full_name, u.department, u.job_title
        HAVING COUNT(*) > 0
        ORDER BY completion_rate ASC, overdue_assignments DESC, total_assignments DESC
        LIMIT 10
      `,
      params
    );

    const topDepartmentsResult = await client.query(
      `
        SELECT
          u.department,
          COUNT(*)::int AS total_assignments,
          COALESCE(SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed_assignments,
          COALESCE(SUM(CASE WHEN e.deadline IS NOT NULL AND e.status <> 'completed' AND e.deadline < NOW() THEN 1 ELSE 0 END), 0)::int AS overdue_assignments,
          ROUND(
            CASE WHEN COUNT(*) = 0 THEN 0
                 ELSE (SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100
            END,
            1
          ) AS completion_rate
        ${baseFromClause}
        ${buildWhereClause(['u.department IS NOT NULL'])}
        GROUP BY u.department
        ORDER BY completion_rate DESC, overdue_assignments ASC
        LIMIT 5
      `,
      params
    );

    const bottomDepartmentsResult = await client.query(
      `
        SELECT
          u.department,
          COUNT(*)::int AS total_assignments,
          COALESCE(SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed_assignments,
          COALESCE(SUM(CASE WHEN e.deadline IS NOT NULL AND e.status <> 'completed' AND e.deadline < NOW() THEN 1 ELSE 0 END), 0)::int AS overdue_assignments,
          ROUND(
            CASE WHEN COUNT(*) = 0 THEN 0
                 ELSE (SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100
            END,
            1
          ) AS completion_rate
        ${baseFromClause}
        ${buildWhereClause(['u.department IS NOT NULL'])}
        GROUP BY u.department
        ORDER BY completion_rate ASC, overdue_assignments DESC
        LIMIT 5
      `,
      params
    );

    const monthlyTrendResult = await client.query(
      `
        SELECT
          date_trunc('month', COALESCE(e.completed_date, e.created_at)) AS period,
          TO_CHAR(date_trunc('month', COALESCE(e.completed_date, e.created_at)), 'Mon YYYY') AS label,
          COUNT(*) FILTER (WHERE e.status = 'completed')::int AS completed,
          COUNT(*) FILTER (WHERE e.status <> 'completed')::int AS pending
        ${baseFromClause}
        ${buildWhereClause(["COALESCE(e.completed_date, e.created_at) >= NOW() - INTERVAL '6 months'"])}
        GROUP BY period
        ORDER BY period
      `,
      params
    );

    const contentTypeResult = await client.query(
      `
        SELECT
          c.content_type,
          COUNT(*)::int AS total_assignments,
          COALESCE(SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed_assignments,
          ROUND(
            CASE WHEN COUNT(*) = 0 THEN 0
                 ELSE (SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100
            END,
            1
          ) AS completion_rate
        ${baseFromClause}
        ${buildWhereClause()}
        GROUP BY c.content_type
      `,
      params
    );

    const courseHighlightsResult = await client.query(
      `
        SELECT
          c.id,
          c.title,
          COUNT(*)::int AS total_assignments,
          COALESCE(SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END), 0)::int AS completed_assignments,
          ROUND(
            CASE WHEN COUNT(*) = 0 THEN 0
                 ELSE (SUM(CASE WHEN e.status = 'completed' THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100
            END,
            1
          ) AS completion_rate
        ${baseFromClause}
        ${buildWhereClause()}
        GROUP BY c.id, c.title
        HAVING COUNT(*) > 0
        ORDER BY completion_rate DESC, completed_assignments DESC
        LIMIT 5
      `,
      params
    );

    const dueSoonResult = await client.query(
      `
        SELECT
          e.id,
          u.full_name,
          u.department,
          c.title AS course_title,
          e.deadline,
          CEIL(EXTRACT(EPOCH FROM (e.deadline - NOW())) / 86400)::int AS days_remaining
        ${baseFromClause}
        ${buildWhereClause([
          "e.status <> 'completed'",
          'e.deadline IS NOT NULL',
          "e.deadline <= NOW() + INTERVAL '21 days'",
          'e.deadline >= NOW()'
        ])}
        ORDER BY e.deadline ASC
        LIMIT 10
      `,
      params
    );

    const summaryRow = summaryResult.rows[0] ?? {};
    const momentumRow = momentumResult.rows[0] ?? { current_period: 0, previous_period: 0 };

    return {
      summary: {
        overallCompliance: numberOr(summaryRow.overall_compliance),
        totalAssignments: numberOr(summaryRow.total_assignments),
        completedAssignments: numberOr(summaryRow.completed_assignments),
        pendingAssignments: numberOr(summaryRow.pending_assignments),
        overdueAssignments: numberOr(summaryRow.overdue_assignments),
        participantCount: numberOr(summaryRow.participant_count),
        avgQuizScore: summaryRow.avg_quiz_score !== null ? numberOr(summaryRow.avg_quiz_score) : null,
        avgCompletionHours:
          summaryRow.avg_completion_hours !== null ? numberOr(summaryRow.avg_completion_hours) : null,
        momentum: {
          current: numberOr(momentumRow.current_period),
          previous: numberOr(momentumRow.previous_period),
          delta: numberOr(momentumRow.current_period) - numberOr(momentumRow.previous_period)
        }
      },
      leaderboards: {
        topEmployees: topEmployeesResult.rows.map((row) => ({
          userId: row.user_id,
          fullName: row.full_name,
          department: row.department,
          jobTitle: row.job_title,
          totalAssignments: numberOr(row.total_assignments),
          completedAssignments: numberOr(row.completed_assignments),
          overdueAssignments: numberOr(row.overdue_assignments),
          completionRate: numberOr(row.completion_rate),
          avgQuizScore: row.avg_quiz_score !== null ? numberOr(row.avg_quiz_score) : null
        })),
        bottomEmployees: bottomEmployeesResult.rows.map((row) => ({
          userId: row.user_id,
          fullName: row.full_name,
          department: row.department,
          jobTitle: row.job_title,
          totalAssignments: numberOr(row.total_assignments),
          completedAssignments: numberOr(row.completed_assignments),
          overdueAssignments: numberOr(row.overdue_assignments),
          completionRate: numberOr(row.completion_rate),
          avgQuizScore: row.avg_quiz_score !== null ? numberOr(row.avg_quiz_score) : null
        })),
        topDepartments: topDepartmentsResult.rows.map((row) => ({
          department: row.department,
          totalAssignments: numberOr(row.total_assignments),
          completedAssignments: numberOr(row.completed_assignments),
          overdueAssignments: numberOr(row.overdue_assignments),
          completionRate: numberOr(row.completion_rate)
        })),
        bottomDepartments: bottomDepartmentsResult.rows.map((row) => ({
          department: row.department,
          totalAssignments: numberOr(row.total_assignments),
          completedAssignments: numberOr(row.completed_assignments),
          overdueAssignments: numberOr(row.overdue_assignments),
          completionRate: numberOr(row.completion_rate)
        }))
      },
      trends: {
        monthly: monthlyTrendResult.rows.map((row) => ({
          label: row.label,
          completed: numberOr(row.completed),
          pending: numberOr(row.pending)
        }))
      },
      distributions: {
        contentTypes: contentTypeResult.rows.map((row) => ({
          contentType: row.content_type ?? 'unspecified',
          totalAssignments: numberOr(row.total_assignments),
          completedAssignments: numberOr(row.completed_assignments),
          completionRate: numberOr(row.completion_rate)
        })),
        courseHighlights: courseHighlightsResult.rows.map((row) => ({
          courseId: row.id,
          title: row.title,
          totalAssignments: numberOr(row.total_assignments),
          completedAssignments: numberOr(row.completed_assignments),
          completionRate: numberOr(row.completion_rate)
        }))
      },
      risk: {
        dueSoon: dueSoonResult.rows.map((row) => ({
          enrollmentId: row.id,
          fullName: row.full_name,
          department: row.department,
          courseTitle: row.course_title,
          deadline: row.deadline,
          daysRemaining: numberOr(row.days_remaining)
        }))
      }
    };
  } finally {
    client.release();
  }
}

export async function getAnalyticsFilters(filters: { organizationId: string; locationId?: string }) {
  const client = await pool.connect();

  try {
    const params: Array<string> = [filters.organizationId];
    const clauses: string[] = ['organization_id = $1'];

    if (filters.locationId) {
      params.push(filters.locationId);
      clauses.push(`location_id = $${params.length}`);
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const departmentsResult = await client.query(
      `
        SELECT DISTINCT department
        FROM users
        ${whereClause}
        AND department IS NOT NULL
        ORDER BY department
      `,
      params
    );

    const jobTitlesResult = await client.query(
      `
        SELECT DISTINCT job_title
        FROM users
        ${whereClause}
        AND job_title IS NOT NULL
        ORDER BY job_title
      `,
      params
    );

    const coursesResult = await client.query(
      `
        SELECT id, title
        FROM courses
        WHERE organization_id = $1
          ${filters.locationId ? `AND location_id = $2` : ''}
          AND COALESCE(is_active, true) = true
          AND COALESCE(is_published, false) = true
        ORDER BY title
      `,
      filters.locationId ? params : [filters.organizationId]
    );

    return {
      departments: departmentsResult.rows.map((row) => row.department),
      jobTitles: jobTitlesResult.rows.map((row) => row.job_title),
      courses: coursesResult.rows.map((row) => ({
        id: row.id,
        title: row.title
      }))
    };
  } finally {
    client.release();
  }
}

