import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            hasError: false,
            error: null
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4", children: _jsx("div", { className: "max-w-md w-full", children: _jsxs("div", { className: "rounded-2xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-800 dark:bg-slate-800", children: [_jsx("div", { className: "mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20", children: _jsx("svg", { className: "h-6 w-6 text-red-600 dark:text-red-400", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }), _jsx("h1", { className: "text-2xl font-bold text-slate-900 dark:text-white mb-2", children: "Something went wrong" }), _jsx("p", { className: "text-slate-600 dark:text-slate-300 mb-4", children: "The application encountered an error. Please try refreshing the page." }), this.state.error && (_jsxs("details", { className: "mb-4", children: [_jsx("summary", { className: "cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Error details" }), _jsx("pre", { className: "text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded overflow-auto text-red-600 dark:text-red-400", children: this.state.error.toString() })] })), _jsx("button", { onClick: () => window.location.reload(), className: "w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition", children: "Refresh Page" })] }) }) }));
        }
        return this.props.children;
    }
}
export default ErrorBoundary;
