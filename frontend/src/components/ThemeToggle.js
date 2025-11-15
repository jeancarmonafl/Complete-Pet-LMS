import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../contexts/useThemeStore';
export function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const { t } = useTranslation();
    return (_jsx("button", { onClick: toggleTheme, className: clsx('flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm font-medium transition-colors', 'hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary'), "aria-label": "Toggle theme", children: theme === 'light' ? (_jsxs(_Fragment, { children: [_jsx(SunIcon, { className: "h-4 w-4" }), _jsx("span", { children: t('light') })] })) : (_jsxs(_Fragment, { children: [_jsx(MoonIcon, { className: "h-4 w-4" }), _jsx("span", { children: t('dark') })] })) }));
}
