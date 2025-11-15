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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token);
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<AuthLayout><LandingPage /></AuthLayout>} />
      <Route path="/:location/login" element={<AuthLayout><LoginPage /></AuthLayout>} />

      {/* Protected routes */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="users/:id/activity" element={<UserActivityPage />} />
                <Route path="courses" element={<CourseManagementPage />} />
                <Route path="matrix" element={<TrainingMatrixPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="settings" element={<SystemSettingsPage />} />
                <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;


