import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AnimatedBackground } from '../components/AnimatedBackground';
import { TopbarControls } from '../components/TopbarControls';
export function AuthLayout({ children }) {
    return (_jsxs("div", { className: "relative min-h-screen", children: [_jsx(AnimatedBackground, {}), _jsx("div", { className: "absolute right-6 top-6 z-10", children: _jsx(TopbarControls, {}) }), _jsx("div", { className: "relative mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-4 py-10", children: children })] }));
}
