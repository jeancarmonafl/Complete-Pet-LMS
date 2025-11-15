import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useLanguageStore } from '../contexts/useLanguageStore';
export function LanguageToggle() {
    const { language, toggleLanguage } = useLanguageStore();
    return (_jsxs("button", { onClick: toggleLanguage, className: clsx('flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm font-medium transition-colors', 'hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-200 dark:hover:border-primary'), "aria-label": "Toggle language", children: [_jsx(GlobeAltIcon, { className: "h-4 w-4" }), _jsx("span", { children: language === 'en' ? 'EN' : 'ES' })] }));
}
