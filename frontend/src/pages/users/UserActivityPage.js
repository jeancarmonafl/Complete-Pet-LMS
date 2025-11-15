import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowLeftIcon, ChartBarIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/apiClient';
export default function UserActivityPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { id } = useParams();
    const { data, isLoading, isError } = useQuery({
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
        return (_jsx("div", { className: "flex min-h-[60vh] items-center justify-center text-slate-500 dark:text-slate-400", children: t('loading') || 'Loading...' }));
    }
    if (isError || !data) {
        return (_jsx("div", { className: "flex min-h-[60vh] items-center justify-center text-red-600 dark:text-red-400", children: t('unableToLoadActivity') || 'Unable to load user activity.' }));
    }
    const { user, activity } = data;
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("button", { onClick: () => navigate(-1), className: "mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300", children: [_jsx(ArrowLeftIcon, { className: "h-4 w-4" }), t('backToUsers') || 'Back to user directory'] }), _jsxs("h1", { className: "text-3xl font-semibold text-slate-900 dark:text-white", children: [user.full_name, " (", user.employee_id, ")"] }), _jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-300", children: [user.job_title || t('noJobTitle'), " \u00B7 ", user.department || t('unassigned'), " \u00B7 ", user.role] })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700", children: [_jsx("p", { className: "font-semibold text-slate-700 dark:text-slate-200", children: t('joinedCompany') || 'Joined' }), _jsx("p", { className: "text-slate-500 dark:text-slate-300", children: user.joined_date ? new Date(user.joined_date).toLocaleDateString() : new Date(user.created_at).toLocaleDateString() })] })] }), _jsx("section", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: summaryCards.map((card) => {
                    const Icon = card.icon;
                    return (_jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: `flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`, children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsx("p", { className: "mt-4 text-sm font-medium text-slate-500 dark:text-slate-400", children: card.title }), _jsx("p", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: card.value }), card.subtitle && (_jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: card.subtitle }))] }, card.title));
                }) }), _jsxs("section", { className: "rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: "flex flex-wrap items-center justify-between gap-4", children: _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: t('trainingPerformance') || 'Training performance' }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: t('trainingPerformanceSubtitle') || 'Detailed log of all assignments, completions, and approvals.' })] }) }), _jsx("div", { className: "mt-6 overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-100 dark:divide-slate-800", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/60", children: _jsx("tr", { children: [
                                            t('course') || 'Course',
                                            t('contentType') || 'Content',
                                            t('status') || 'Status',
                                            t('progress') || 'Progress',
                                            t('deadline') || 'Deadline',
                                            t('completedOn') || 'Completed',
                                            t('quizScore') || 'Quiz score',
                                            t('approvalStatus') || 'Approval'
                                        ].map((header) => (_jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300", children: header }, header))) }) }), _jsx("tbody", { className: "divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900", children: activity.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400", children: t('noActivityYet') || 'No training activity recorded yet.' }) })) : (activity.map((record) => (_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white", children: record.course_title }), _jsx("td", { className: "px-6 py-4 text-sm text-slate-500 dark:text-slate-400", children: record.content_type || '—' }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${record.status === 'completed'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                                                        : record.status === 'overdue'
                                                            ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-200'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200'}`, children: record.status || 'pending' }) }), _jsxs("td", { className: "px-6 py-4 text-sm text-slate-600 dark:text-slate-300", children: [record.progress_percentage ?? 0, "%"] }), _jsx("td", { className: "px-6 py-4 text-sm text-slate-600 dark:text-slate-300", children: record.deadline ? new Date(record.deadline).toLocaleDateString() : '—' }), _jsx("td", { className: "px-6 py-4 text-sm text-slate-600 dark:text-slate-300", children: record.completed_date ? new Date(record.completed_date).toLocaleDateString() : '—' }), _jsx("td", { className: "px-6 py-4 text-sm text-slate-600 dark:text-slate-300", children: record.quiz_score != null ? `${record.quiz_score}%` : '—' }), _jsx("td", { className: "px-6 py-4 text-sm capitalize text-slate-600 dark:text-slate-300", children: record.approval_status ? record.approval_status.replace('_', ' ') : '—' })] }, record.id)))) })] }) })] })] }));
}
