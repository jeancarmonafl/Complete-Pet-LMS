import { AcademicCapIcon, BookOpenIcon, ChartBarIcon, ClockIcon, UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { TrainingFlowModal } from '../components/TrainingFlowModal';
import { SupervisorApprovalModal } from '../components/SupervisorApprovalModal';
import { useAuthStore } from '../contexts/useAuthStore';
import { useTrainingStore, TrainingAssignment, TrainingRecord } from '../contexts/useTrainingStore';

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [selectedTraining, setSelectedTraining] = useState<TrainingAssignment | null>(null);
  const [isTrainingModalOpen, setTrainingModalOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<TrainingRecord | null>(null);
  const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
  const { pendingTrainings, approvalsQueue, completeTraining, approveTraining } = useTrainingStore();

  const cards = [
    { 
      title: t('totalUsers'), 
      value: '1', 
      change: '+5% ' + t('thisMonth'),
      accent: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200',
      icon: UsersIcon 
    },
    { 
      title: t('activeCourses'), 
      value: '0',
      change: '2 ' + t('newCourses'),
      accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200',
      icon: BookOpenIcon
    },
    { 
      title: t('activeEnrollments'), 
      value: '0',
      change: '85% ' + t('engagement'),
      accent: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-200',
      icon: AcademicCapIcon
    },
    { 
      title: t('completionRate'), 
      value: '0%',
      change: t('aboveTarget'),
      accent: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-200',
      icon: ChartBarIcon
    },
    { 
      title: t('pendingApprovals'), 
      value: '0',
      accent: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-200',
      icon: ClockIcon
    }
  ];

  const handleStartTraining = (training: TrainingAssignment) => {
    setSelectedTraining(training);
    setTrainingModalOpen(true);
  };

  const handleTrainingCompletion = ({ quizScore, signature }: { quizScore: number; signature: string }) => {
    if (!selectedTraining) return;

    const employeeId = user?.id ? `EMP-${user.id.substring(0, 4).toUpperCase()}` : 'EMP000';

    completeTraining(selectedTraining.id, {
      assignmentId: selectedTraining.id,
      courseId: selectedTraining.courseId,
      courseTitle: selectedTraining.title,
      completionDate: new Date().toISOString(),
      quizScore,
      passPercentage: selectedTraining.passPercentage,
      employeeId,
      employeeName: user?.fullName || 'Team Member',
      employeeSignature: signature,
      contentType: selectedTraining.contentType,
      durationMinutes: selectedTraining.durationMinutes
    });

    setSelectedTraining(null);
    setTrainingModalOpen(false);
  };

  const handleOpenApproval = (record: TrainingRecord) => {
    setSelectedApproval(record);
    setApprovalModalOpen(true);
  };

  const handleApproveRecord = (signature: string) => {
    if (!selectedApproval) return;

    approveTraining(selectedApproval.id, {
      name: user?.fullName || 'Supervisor',
      signature
    });

    setSelectedApproval(null);
    setApprovalModalOpen(false);
  };

  const quickActions = [
    { name: t('manageCourses'), desc: t('createEditCourses'), icon: BookOpenIcon, href: '/app/courses' },
    { name: t('manageUsers'), desc: t('manageUserAccounts'), icon: UserGroupIcon, href: '/app/users' },
    { name: t('viewMatrix'), desc: t('viewCompletionRecords'), icon: AcademicCapIcon, href: '/app/matrix' },
    { name: t('viewReports'), desc: t('trainingAnalytics'), icon: ChartBarIcon, href: '/app/reports' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('dashboardWelcome', { name: user?.fullName || 'Team Member' })}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{user?.locationCode} - Complete-Pet LMS · {t('systemAdministratorDashboard')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{card.title}</p>
              <card.icon className={`h-5 w-5 ${card.accent.split(' ')[1]}`} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{card.value}</p>
            {card.change && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{card.change}</p>
            )}
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('pendingTrainings') || 'Pending Trainings'}</h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {pendingTrainings.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                {t('allTrainingsCurrent') || 'All trainings are up to date.'}
              </div>
            ) : (
              pendingTrainings.map((training) => (
                <div
                  key={training.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{training.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Due {new Date(training.dueDate).toLocaleDateString()} · {training.durationMinutes} min ·{' '}
                      {training.passPercentage}% pass
                    </p>
                  </div>
                  <button
                    onClick={() => handleStartTraining(training)}
                    className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90"
                  >
                    {t('startTraining') || 'Start Training'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('pendingApprovals') || 'Approvals pending'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('pendingApprovalsSubtitle') || 'Review completed trainings awaiting supervisor sign-off.'}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {approvalsQueue.length === 0 ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
                {t('noApprovalsPending') || 'No Approvals Pending ✅'}
              </div>
            ) : (
              approvalsQueue.map((record) => (
                <div
                  key={record.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{record.courseTitle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {record.employeeName} · {new Date(record.completionDate).toLocaleString()} · {record.quizScore}%
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenApproval(record)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
                  >
                    {t('reviewAndApprove') || 'Review & approve'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('quickActions')}</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-primary hover:bg-slate-50 dark:border-slate-700 dark:hover:border-primary dark:hover:bg-slate-800"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{action.name}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pending Actions */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('pendingActions')}</h2>
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-500/10">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">{t('allUpToDate')}</p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">{t('noPendingActions')}</p>
            </div>
          </section>

          {/* System Status */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('systemStatus')}</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t('security')}</span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {t('active')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t('compliance')}</span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t('lastBackup')}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">2 {t('hoursAgo')}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <TrainingFlowModal
        open={isTrainingModalOpen}
        training={selectedTraining}
        onClose={() => {
          setTrainingModalOpen(false);
          setSelectedTraining(null);
        }}
        onComplete={handleTrainingCompletion}
      />

      <SupervisorApprovalModal
        open={isApprovalModalOpen}
        record={selectedApproval}
        onClose={() => {
          setApprovalModalOpen(false);
          setSelectedApproval(null);
        }}
        onApprove={handleApproveRecord}
      />
    </div>
  );
}
