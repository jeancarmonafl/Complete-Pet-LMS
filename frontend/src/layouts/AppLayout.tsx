import { AcademicCapIcon, BuildingOffice2Icon, ChartBarIcon, Cog6ToothIcon, HomeIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { LanguageToggle } from '../components/LanguageToggle';
import { Logo } from '../components/Logo';
import { useAuthStore } from '../contexts/useAuthStore';
import { formatRole } from '../utils/format';

export function AppLayout({ children }: PropsWithChildren) {
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

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 shrink-0 border-r border-slate-100 bg-white/80 px-4 py-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2">
          <Logo size="md" className="shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Complete-Pet {user?.locationCode}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">{formatRole(user?.role)}</p>
          </div>
        </div>
        <nav className="mt-8 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <div className="px-2">
            <LanguageToggle />
          </div>
          <div className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{user?.fullName}</p>
            <p className="uppercase">{user?.locationCode} · {formatRole(user?.role)}</p>
          </div>
          <button
            onClick={logout}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary"
          >
            {t('signOut')}
          </button>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <main className="flex-1 bg-slate-50/60 px-4 py-8 dark:bg-slate-950/60 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
