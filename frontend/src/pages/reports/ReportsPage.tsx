import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import api from '../../services/apiClient';

interface LeaderboardEntry {
  userId: string;
  fullName: string;
  department: string | null;
  jobTitle: string | null;
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  completionRate: number;
  avgQuizScore: number | null;
}

interface DepartmentEntry {
  department: string | null;
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  completionRate: number;
}

interface TrendPoint {
  label: string;
  completed: number;
  pending: number;
}

interface ContentTypeEntry {
  contentType: string;
  totalAssignments: number;
  completedAssignments: number;
  completionRate: number;
}

interface CourseHighlight {
  courseId: string;
  title: string;
  totalAssignments: number;
  completedAssignments: number;
  completionRate: number;
}

interface DueSoonEntry {
  enrollmentId: string;
  fullName: string;
  department: string | null;
  courseTitle: string;
  deadline: string;
  daysRemaining: number;
}

interface AnalyticsSummaryResponse {
  summary: {
    overallCompliance: number;
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    overdueAssignments: number;
    participantCount: number;
    avgQuizScore: number | null;
    avgCompletionHours: number | null;
    momentum: {
      current: number;
      previous: number;
      delta: number;
    };
  };
  leaderboards: {
    topEmployees: LeaderboardEntry[];
    bottomEmployees: LeaderboardEntry[];
    topDepartments: DepartmentEntry[];
    bottomDepartments: DepartmentEntry[];
  };
  trends: {
    monthly: TrendPoint[];
  };
  distributions: {
    contentTypes: ContentTypeEntry[];
    courseHighlights: CourseHighlight[];
  };
  risk: {
    dueSoon: DueSoonEntry[];
  };
}

interface FilterOptions {
  departments: string[];
  jobTitles: string[];
  courses: Array<{ id: string; title: string }>;
}

const defaultFilters = {
  department: 'all',
  jobTitle: 'all',
  courseId: 'all',
  startDate: '',
  endDate: ''
};

const chartColors = ['#0ea5e9', '#6366f1', '#22c55e', '#f97316', '#0f172a'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [formFilters, setFormFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);

  const queryFilters = useMemo(() => {
    const payload: Record<string, string> = {};
    if (appliedFilters.department !== 'all' && appliedFilters.department) {
      payload.department = appliedFilters.department;
    }
    if (appliedFilters.jobTitle !== 'all' && appliedFilters.jobTitle) {
      payload.jobTitle = appliedFilters.jobTitle;
    }
    if (appliedFilters.courseId !== 'all' && appliedFilters.courseId) {
      payload.courseId = appliedFilters.courseId;
    }
    if (appliedFilters.startDate) {
      payload.startDate = appliedFilters.startDate;
    }
    if (appliedFilters.endDate) {
      payload.endDate = appliedFilters.endDate;
    }
    return payload;
  }, [appliedFilters]);

  const filtersQuery = useQuery<FilterOptions>({
    queryKey: ['analyticsFilters'],
    queryFn: async () => {
      const response = await api.get('/analytics/filters');
      return response.data;
    },
    staleTime: 10 * 60 * 1000
  });

  const analyticsQuery = useQuery<AnalyticsSummaryResponse>({
    queryKey: ['analyticsSummary', queryFilters],
    queryFn: async () => {
      const response = await api.get('/analytics/summary', { params: queryFilters });
      return response.data;
    },
    placeholderData: (previous) => previous
  });

  const summary = analyticsQuery.data?.summary;
  const leaderboards = analyticsQuery.data?.leaderboards;
  const trends = analyticsQuery.data?.trends.monthly ?? [];
  const distributions = analyticsQuery.data?.distributions;
  const risk = analyticsQuery.data?.risk;
  const contentTypes = distributions?.contentTypes ?? [];
  const courseHighlights = distributions?.courseHighlights ?? [];
  const dueSoon = risk?.dueSoon ?? [];
  const topEmployees = leaderboards?.topEmployees ?? [];
  const bottomEmployees = leaderboards?.bottomEmployees ?? [];
  const topDepartments = leaderboards?.topDepartments ?? [];
  const bottomDepartments = leaderboards?.bottomDepartments ?? [];

  const handleInputChange = (field: keyof typeof formFilters, value: string) => {
    setFormFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRunReport = () => {
    setAppliedFilters(formFilters);
  };

  const handleReset = () => {
    setFormFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const handleExportCsv = () => {
    if (!analyticsQuery.data || !summary) return;

    const rows: string[][] = [
      ['Metric', 'Value'],
      [t('analyticsOverallCompliance'), `${summary.overallCompliance?.toFixed(1) ?? '0.0'}%`],
      [t('analyticsCompletedTrainings'), `${summary.completedAssignments}/${summary.totalAssignments}`],
      [t('analyticsPendingTrainings'), String(summary.pendingAssignments)],
      [t('analyticsOverdueTrainings'), String(summary.overdueAssignments)],
      [t('analyticsAvgQuizScore'), summary.avgQuizScore !== null ? summary.avgQuizScore.toString() : '—'],
      [
        t('analyticsAvgCompletionHours'),
        summary.avgCompletionHours !== null ? summary.avgCompletionHours.toString() : '—'
      ],
      [
        t('analyticsMomentum'),
        `${summary.momentum.current} (${summary.momentum.delta >= 0 ? '+' : ''}${summary.momentum.delta})`
      ],
      []
    ];

    rows.push(['Top Employees']);
    rows.push(['Name', 'Department', 'Completion Rate', 'Overdue']);
      topEmployees.forEach((entry) => {
      rows.push([
        entry.fullName,
        entry.department ?? '—',
        `${entry.completionRate.toFixed(1)}%`,
        String(entry.overdueAssignments)
      ]);
    });

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const filterOptions = filtersQuery.data;
  const isLoading = analyticsQuery.isLoading;
  const hasData = (summary?.totalAssignments ?? 0) > 0;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{t('reportsTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">{t('reportsSubtitle')}</p>
      </header>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('department')}
            <select
              value={formFilters.department}
              onChange={(event) => handleInputChange('department', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">{t('analyticsFiltersDepartmentPlaceholder')}</option>
              {filterOptions?.departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('jobTitle')}
            <select
              value={formFilters.jobTitle}
              onChange={(event) => handleInputChange('jobTitle', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">{t('analyticsFiltersJobPlaceholder')}</option>
              {filterOptions?.jobTitles.map((job) => (
                <option key={job} value={job}>
                  {job}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('course')}
            <select
              value={formFilters.courseId}
              onChange={(event) => handleInputChange('courseId', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">{t('analyticsFiltersCoursePlaceholder')}</option>
              {filterOptions?.courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('analyticsDateFrom')}
              <input
                type="date"
                value={formFilters.startDate}
                onChange={(event) => handleInputChange('startDate', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('analyticsDateTo')}
              <input
                type="date"
                value={formFilters.endDate}
                onChange={(event) => handleInputChange('endDate', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </label>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={handleRunReport}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            <ChartBarIcon className="h-4 w-4" />
            {t('runReport')}
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
          >
            <CloudArrowDownIcon className="h-4 w-4" />
            {t('exportCSV')}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300"
          >
            {t('analyticsResetFilters')}
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        <SummaryCard
          title={t('analyticsOverallCompliance')}
          description={t('analyticsParticipants', { count: summary?.participantCount ?? 0 })}
          value={`${summary?.overallCompliance?.toFixed(1) ?? '0.0'}%`}
          accent="bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-200"
          icon={ChartBarIcon}
          loading={isLoading}
        />
        <SummaryCard
          title={t('analyticsCompletedTrainings')}
          description={`${summary?.completedAssignments ?? 0} / ${summary?.totalAssignments ?? 0}`}
          value={String(summary?.completedAssignments ?? 0)}
          accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200"
          icon={UsersIcon}
          loading={isLoading}
        />
        <SummaryCard
          title={t('analyticsOverdueTrainings')}
          description={t('analyticsPendingTrainings')}
          value={String(summary?.overdueAssignments ?? 0)}
          accent="bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-200"
          icon={ArrowTrendingUpIcon}
          loading={isLoading}
        />
        <SummaryCard
          title={t('analyticsMomentum')}
          description={t('analyticsMomentumComparison')}
          value={`${summary?.momentum.current ?? 0}`}
          delta={summary?.momentum.delta ?? 0}
          accent="bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-200"
          icon={ArrowTrendingUpIcon}
          loading={isLoading}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
                {t('analyticsOverallCompliance')}
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {summary?.overallCompliance?.toFixed(1) ?? '0.0'}%
              </p>
            </div>
          </div>
          <div className="mt-6 h-48">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="70%"
                  outerRadius="100%"
                  data={[
                    {
                      name: 'compliance',
                      value: summary?.overallCompliance ?? 0,
                      fill: '#0ea5e9'
                    }
                  ]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background cornerRadius={12} dataKey="value" />
                </RadialBarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message={t('analyticsNoData')} />
            )}
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <p>
              {t('analyticsCompletedTrainings')}: {summary?.completedAssignments ?? 0}
            </p>
            <p>
              {t('analyticsPendingTrainings')}: {summary?.pendingAssignments ?? 0}
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
              {t('analyticsMonthlyTrend')}
            </p>
          </div>
          <div className="mt-4 h-64">
            {trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" stroke="#0ea5e9" strokeWidth={2} />
                  <Line type="monotone" dataKey="pending" stroke="#f97316" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message={t('analyticsNoData')} />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <LeaderboardCard
          title={t('analyticsTopEmployees')}
          entries={topEmployees}
          highlightColor="text-emerald-500"
        />
        <LeaderboardCard
          title={t('analyticsBottomEmployees')}
          entries={bottomEmployees}
          highlightColor="text-rose-500"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DepartmentChart
          title={t('analyticsTopDepartments')}
          data={topDepartments}
          color="#22c55e"
        />
        <DepartmentChart
          title={t('analyticsBottomDepartments')}
          data={bottomDepartments}
          color="#f97316"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
            {t('analyticsContentTypeMix')}
          </p>
          <div className="mt-4 h-56">
            {contentTypes.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={contentTypes}
                    dataKey="totalAssignments"
                    nameKey="contentType"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {contentTypes.map((entry, index) => (
                      <Cell key={entry.contentType} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message={t('analyticsNoData')} />
            )}
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {contentTypes.map((entry) => (
              <li key={entry.contentType} className="flex items-center justify-between">
                <span className="capitalize text-slate-600 dark:text-slate-300">
                  {entry.contentType}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {entry.completionRate.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
            {t('analyticsCourseHighlights')}
          </p>
          <div className="mt-4 space-y-4">
            {courseHighlights.length ? (
              courseHighlights.map((course) => (
                <div
                  key={course.courseId}
                  className="rounded-2xl border border-slate-100 p-4 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{course.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {course.completedAssignments}/{course.totalAssignments} {t('analyticsAssignments')}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {course.completionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${course.completionRate}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message={t('analyticsNoData')} />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
          {t('analyticsDueSoon')}
        </p>
        <div className="mt-4 space-y-3">
          {dueSoon.length ? (
            dueSoon.map((assignment) => (
              <div
                key={assignment.enrollmentId}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 p-4 text-sm dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {assignment.courseTitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {assignment.fullName} · {assignment.department ?? t('unknownStatus')}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500 dark:text-slate-300">
                  {assignment.daysRemaining > 0 ? (
                    <span>
                      {t('analyticsDaysRemaining', { count: assignment.daysRemaining })}
                    </span>
                  ) : (
                    <span className="text-rose-500">{t('analyticsDueToday')}</span>
                  )}
                  <p className="text-slate-400">
                    {new Date(assignment.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState message={t('analyticsNoData')} />
          )}
        </div>
      </section>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  description: string;
  value: string;
  accent: string;
  icon: typeof ChartBarIcon;
  delta?: number;
  loading?: boolean;
}

function SummaryCard({ title, description, value, accent, icon: Icon, delta, loading }: SummaryCardProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {loading ? '—' : value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          {typeof delta === 'number' && (
            <p
              className={`mt-1 text-xs font-semibold ${
                delta >= 0 ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {delta >= 0 ? '+' : ''}
              {delta} {t('analyticsMomentumUnits')}
            </p>
          )}
        </div>
        <span className={`rounded-full p-3 text-sm font-semibold ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

interface LeaderboardCardProps {
  title: string;
  entries: LeaderboardEntry[];
  highlightColor: string;
}

function LeaderboardCard({ title, entries, highlightColor }: LeaderboardCardProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{title}</p>
      </div>
      <div className="mt-4 space-y-3">
        {entries.length ? (
          entries.map((entry, index) => (
            <div
              key={entry.userId}
              className="flex items-center justify-between rounded-2xl border border-slate-100 p-4 text-sm dark:border-slate-800"
            >
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">
                  #{index + 1} {entry.fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {entry.department ?? '—'} · {entry.jobTitle ?? '—'}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${highlightColor}`}>
                  {entry.completionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {entry.completedAssignments}/{entry.totalAssignments} · {entry.overdueAssignments}{' '}
                  overdue
                </p>
              </div>
            </div>
          ))
        ) : (
          <EmptyState message={t('analyticsNoData')} />
        )}
      </div>
    </div>
  );
}

interface DepartmentChartProps {
  title: string;
  data: DepartmentEntry[];
  color: string;
}

function DepartmentChart({ title, data, color }: DepartmentChartProps) {
  const { t } = useTranslation();
  const chartData = data.map((entry) => ({
    ...entry,
    department: entry.department ?? '—'
  }));
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{title}</p>
      <div className="mt-4 h-64">
        {chartData.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="department" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="completionRate" fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState message={t('analyticsNoData')} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {message}
    </div>
  );
}
