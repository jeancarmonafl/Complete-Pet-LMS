import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AcademicCapIcon, BookOpenIcon, ChartBarIcon, ClockIcon, UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from '../components/ThemeToggle';
import { TrainingFlowModal } from '../components/TrainingFlowModal';
import { SupervisorApprovalModal } from '../components/SupervisorApprovalModal';
import { useAuthStore } from '../contexts/useAuthStore';
import { useTrainingStore } from '../contexts/useTrainingStore';
export default function DashboardPage() {
    const { t } = useTranslation();
    const user = useAuthStore((state) => state.user);
    const [selectedTraining, setSelectedTraining] = useState(null);
    const [isTrainingModalOpen, setTrainingModalOpen] = useState(false);
    const [selectedApproval, setSelectedApproval] = useState(null);
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
    const handleStartTraining = (training) => {
        setSelectedTraining(training);
        setTrainingModalOpen(true);
    };
    const handleTrainingCompletion = ({ quizScore, signature }) => {
        if (!selectedTraining)
            return;
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
    const handleOpenApproval = (record) => {
        setSelectedApproval(record);
        setApprovalModalOpen(true);
    };
    const handleApproveRecord = (signature) => {
        if (!selectedApproval)
            return;
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-slate-900 dark:text-white", children: t('dashboardWelcome', { name: user?.fullName || 'Team Member' }) }), _jsxs("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-400", children: [user?.locationCode, " - Complete-Pet LMS \u00B7 ", t('systemAdministratorDashboard')] })] }), _jsx(ThemeToggle, {})] }), _jsx("section", { className: "grid gap-6 sm:grid-cols-2 xl:grid-cols-5", children: cards.map((card) => (_jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-medium text-slate-600 dark:text-slate-400", children: card.title }), _jsx(card.icon, { className: `h-5 w-5 ${card.accent.split(' ')[1]}` })] }), _jsx("p", { className: "mt-3 text-3xl font-bold text-slate-900 dark:text-white", children: card.value }), card.change && (_jsx("p", { className: "mt-2 text-xs text-slate-500 dark:text-slate-400", children: card.change }))] }, card.title))) }), _jsxs("section", { className: "grid gap-6 lg:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: t('pendingTrainings') || 'Pending trainings' }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: t('pendingTrainingsSubtitle') || 'Complete assigned trainings to stay compliant.' })] }) }), _jsx("div", { className: "mt-4 space-y-3", children: pendingTrainings.length === 0 ? (_jsx("div", { className: "rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200", children: t('allTrainingsCurrent') || 'All trainings are up to date.' })) : (pendingTrainings.map((training) => (_jsxs("div", { className: "flex flex-col gap-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-900 dark:text-white", children: training.title }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["Due ", new Date(training.dueDate).toLocaleDateString(), " \u00B7 ", training.durationMinutes, " min \u00B7", ' ', training.passPercentage, "% pass"] })] }), _jsx("button", { onClick: () => handleStartTraining(training), className: "rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90", children: t('startTraining') || 'Start training' })] }, training.id)))) })] }), _jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: t('pendingApprovals') || 'Approvals pending' }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: t('pendingApprovalsSubtitle') || 'Review completed trainings awaiting supervisor sign-off.' })] }) }), _jsx("div", { className: "mt-4 space-y-3", children: approvalsQueue.length === 0 ? (_jsx("div", { className: "rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200", children: t('noApprovalsPending') || 'No approvals pending.' })) : (approvalsQueue.map((record) => (_jsxs("div", { className: "flex flex-col gap-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold text-slate-900 dark:text-white", children: record.courseTitle }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: [record.employeeName, " \u00B7 ", new Date(record.completionDate).toLocaleString(), " \u00B7 ", record.quizScore, "%"] })] }), _jsx("button", { onClick: () => handleOpenApproval(record), className: "rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300", children: t('reviewAndApprove') || 'Review & approve' })] }, record.id)))) })] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsx("section", { className: "lg:col-span-2", children: _jsxs("div", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: t('quickActions') }), _jsx("div", { className: "mt-6 grid gap-4 sm:grid-cols-2", children: quickActions.map((action) => (_jsxs(Link, { to: action.href, className: "flex items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-primary hover:bg-slate-50 dark:border-slate-700 dark:hover:border-primary dark:hover:bg-slate-800", children: [_jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary", children: _jsx(action.icon, { className: "h-5 w-5" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: action.name }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: action.desc })] })] }, action.name))) })] }) }), _jsxs("div", { className: "space-y-6", children: [_jsxs("section", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: t('pendingActions') }), _jsxs("div", { className: "mt-4 rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-500/10", children: [_jsx("p", { className: "text-sm font-semibold text-emerald-700 dark:text-emerald-200", children: t('allUpToDate') }), _jsx("p", { className: "mt-1 text-xs text-emerald-600 dark:text-emerald-300", children: t('noPendingActions') })] })] }), _jsxs("section", { className: "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: t('systemStatus') }), _jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-slate-600 dark:text-slate-400", children: t('security') }), _jsx("span", { className: "inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200", children: t('active') })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-slate-600 dark:text-slate-400", children: t('compliance') }), _jsx("span", { className: "text-xs font-semibold text-slate-900 dark:text-white", children: "0%" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-slate-600 dark:text-slate-400", children: t('lastBackup') }), _jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["2 ", t('hoursAgo')] })] })] })] })] })] }), _jsx(TrainingFlowModal, { open: isTrainingModalOpen, training: selectedTraining, onClose: () => {
                    setTrainingModalOpen(false);
                    setSelectedTraining(null);
                }, onComplete: handleTrainingCompletion }), _jsx(SupervisorApprovalModal, { open: isApprovalModalOpen, record: selectedApproval, onClose: () => {
                    setApprovalModalOpen(false);
                    setSelectedApproval(null);
                }, onApprove: handleApproveRecord })] }));
}
