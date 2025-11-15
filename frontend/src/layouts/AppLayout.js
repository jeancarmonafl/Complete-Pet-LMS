import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AcademicCapIcon, BuildingOffice2Icon, ChartBarIcon, Cog6ToothIcon, HomeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/LanguageToggle';
import { Logo } from '../components/Logo';
import { useAuthStore } from '../contexts/useAuthStore';
import { formatRole } from '../utils/format';
export function AppLayout({ children }) {
    const { user, logout } = useAuthStore();
    const { t } = useTranslation();
    const navigation = [
        { name: t('dashboard'), href: '/app/dashboard', icon: HomeIcon },
        { name: t('userManagement'), href: '/app/users', icon: UserGroupIcon },
        { name: t('courseManagement'), href: '/app/courses', icon: BuildingOffice2Icon },
        { name: t('trainingMatrix'), href: '/app/matrix', icon: AcademicCapIcon },
        { name: t('reportsAnalytics'), href: '/app/reports', icon: ChartBarIcon },
        { name: t('administration'), href: '/app/admin', icon: Cog6ToothIcon },
        { name: t('systemSettings'), href: '/app/settings', icon: Cog6ToothIcon }
    ];
    return (_jsxs("div", { className: "flex min-h-screen bg-slate-50 dark:bg-slate-950", children: [_jsxs("aside", { className: "hidden w-64 shrink-0 border-r border-slate-100 bg-white/80 px-4 py-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col", children: [_jsxs("div", { className: "flex items-center gap-3 px-2", children: [_jsx(Logo, { size: "md", className: "shrink-0" }), _jsxs("div", { children: [_jsxs("p", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: ["Complete-Pet ", user?.locationCode] }), _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400 uppercase", children: formatRole(user?.role) })] })] }), _jsx("nav", { className: "mt-8 space-y-1", children: navigation.map((item) => (_jsxs(NavLink, { to: item.href, className: ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`, children: [_jsx(item.icon, { className: "h-5 w-5" }), item.name] }, item.name))) }), _jsxs("div", { className: "mt-auto space-y-3", children: [_jsx("div", { className: "px-2", children: _jsx(LanguageToggle, {}) }), _jsxs("div", { className: "rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400", children: [_jsx("p", { className: "font-semibold text-slate-700 dark:text-slate-200", children: user?.fullName }), _jsxs("p", { className: "uppercase", children: [user?.locationCode, " \u00B7 ", formatRole(user?.role)] })] }), _jsx("button", { onClick: logout, className: "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary", children: t('signOut') })] })] }), _jsx("div", { className: "flex flex-1 flex-col", children: _jsx("main", { className: "flex-1 bg-slate-50/60 px-4 py-8 dark:bg-slate-950/60 lg:px-10", children: children }) })] }));
}
