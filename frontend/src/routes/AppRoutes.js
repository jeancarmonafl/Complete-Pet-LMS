import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../contexts/useAuthStore';
import { AppLayout } from '../layouts/AppLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import AdminPage from '../pages/admin/AdminPage';
import DashboardPage from '../pages/DashboardPage';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import CourseManagementPage from '../pages/management/CourseManagementPage';
import ReportsPage from '../pages/reports/ReportsPage';
import SystemSettingsPage from '../pages/settings/SystemSettingsPage';
import TrainingMatrixPage from '../pages/training/TrainingMatrixPage';
import UserActivityPage from '../pages/users/UserActivityPage';
import UserManagementPage from '../pages/users/UserManagementPage';
function ProtectedRoute({ children }) {
    const token = useAuthStore((state) => state.token);
    if (!token) {
        return _jsx(Navigate, { to: "/", replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
function AppRoutes() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(AuthLayout, { children: _jsx(LandingPage, {}) }) }), _jsx(Route, { path: "/:location/login", element: _jsx(AuthLayout, { children: _jsx(LoginPage, {}) }) }), _jsx(Route, { path: "/app/*", element: _jsx(ProtectedRoute, { children: _jsx(AppLayout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "dashboard", element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "users", element: _jsx(UserManagementPage, {}) }), _jsx(Route, { path: "users/:id/activity", element: _jsx(UserActivityPage, {}) }), _jsx(Route, { path: "courses", element: _jsx(CourseManagementPage, {}) }), _jsx(Route, { path: "matrix", element: _jsx(TrainingMatrixPage, {}) }), _jsx(Route, { path: "reports", element: _jsx(ReportsPage, {}) }), _jsx(Route, { path: "admin", element: _jsx(AdminPage, {}) }), _jsx(Route, { path: "settings", element: _jsx(SystemSettingsPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/app/dashboard", replace: true }) })] }) }) }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
export default AppRoutes;
