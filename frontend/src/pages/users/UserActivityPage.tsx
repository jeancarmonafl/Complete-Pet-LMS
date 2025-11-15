import { ArrowLeftIcon, ChartBarIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../../services/apiClient';

interface ActivityRecord {
  id: string;
  course_title: string;
  content_type: string;
  status: string;
  progress_percentage: number;
  deadline: string | null;
  started_date: string | null;
  completed_date: string | null;
  quiz_score: number | null;
  approval_status: string | null;
  supervisor_signature_date: string | null;
}

interface UserActivityResponse {
  user: {
    id: string;
    full_name: string;
    employee_id: string;
    department: string | null;
    job_title: string | null;
    role: string;
    joined_date: string | null;
    created_at: string;
    is_active: boolean;
  };
  summary: {
    total_assignments: number;
    completed_assignments: number;
    pending_assignments: number;
    overdue_assignments: number;
    avg_completion_hours: number | null;
    avg_quiz_score: number | null;
  };
  activity: ActivityRecord[];
}

export default function UserActivityPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const { data, isLoading, isError } = useQuery<UserActivityResponse>({
    queryKey: ['userActivity', id],
    queryFn: async () => {
      const response = await api.get(`/users/${id}/activity`);
      return response.data;
    },
    enabled: Boolean(id)
  });

  const summaryCards = data
    ? [
        {
          title: t('totalTrainings') || 'Total trainings',
          value: String(data.summary.total_assignments ?? 0),
          icon: UsersIcon,
          iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200',
          subtitle: undefined
        },
        {
          title: t('completedTrainings') || 'Completed',
          value: String(data.summary.completed_assignments ?? 0),
          icon: CheckCircleIcon,
          iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200',
          subtitle: undefined
        },
        {
          title: t('pendingTrainings') || 'Pending',
          value: String(data.summary.pending_assignments ?? 0),
          icon: ClockIcon,
          iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200',
          subtitle: undefined
        },
        {
          title: t('overdueTrainings') || 'Overdue',
          value: String(data.summary.overdue_assignments ?? 0),
          icon: ExclamationTriangleIcon,
          iconBg: 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-200',
          subtitle: undefined
        },
        {
          title: t('avgCompletionTime') || 'Avg completion (hrs)',
          value: data.summary.avg_completion_hours ? data.summary.avg_completion_hours.toString() : '—',
          icon: ClockIcon,
          iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-200',
          subtitle: undefined
        },
        {
          title: t('avgQuizScore') || 'Avg quiz score',
          value: data.summary.avg_quiz_score ? `${data.summary.avg_quiz_score}%` : '—',
          icon: ChartBarIcon,
          iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200',
          subtitle: undefined
        }
      ]
    : [];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500 dark:text-slate-400">
        {t('loading') || 'Loading...'}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-red-600 dark:text-red-400">
        {t('unableToLoadActivity') || 'Unable to load user activity.'}
      </div>
    );
  }

  const { user, activity } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {t('backToUsers') || 'Back to user directory'}
          </button>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            {user.full_name} ({user.employee_id})
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            {user.job_title || t('noJobTitle')} · {user.department || t('unassigned')} · {user.role}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
          <p className="font-semibold text-slate-700 dark:text-slate-200">{t('joinedCompany') || 'Joined'}</p>
          <p className="text-slate-500 dark:text-slate-300">
            {user.joined_date ? new Date(user.joined_date).toLocaleDateString() : new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
              {card.subtitle && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.subtitle}</p>
              )}
            </div>
          );
        })}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('trainingPerformance') || 'Training performance'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('trainingPerformanceSubtitle') || 'Detailed log of all assignments, completions, and approvals.'}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                {[
                  t('course') || 'Course',
                  t('contentType') || 'Content',
                  t('status') || 'Status',
                  t('progress') || 'Progress',
                  t('deadline') || 'Deadline',
                  t('completedOn') || 'Completed',
                  t('quizScore') || 'Quiz score',
                  t('approvalStatus') || 'Approval'
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {activity.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('noActivityYet') || 'No training activity recorded yet.'}
                  </td>
                </tr>
              ) : (
                activity.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">{record.course_title}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{record.content_type || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          record.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                            : record.status === 'overdue'
                            ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-200'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200'
                        }`}
                      >
                        {record.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {record.progress_percentage ?? 0}%
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {record.deadline ? new Date(record.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {record.completed_date ? new Date(record.completed_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {record.quiz_score != null ? `${record.quiz_score}%` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-slate-600 dark:text-slate-300">
                      {record.approval_status ? record.approval_status.replace('_', ' ') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

