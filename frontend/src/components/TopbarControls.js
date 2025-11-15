import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { LanguageToggle } from './LanguageToggle';
import { ThemeToggle } from './ThemeToggle';
export function TopbarControls() {
    return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(ThemeToggle, {}), _jsx(LanguageToggle, {})] }));
}
