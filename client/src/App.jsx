import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import SubmitComplaintPage from './pages/SubmitComplaintPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ComplaintDetailsPage from './pages/ComplaintDetailsPage';
import UserProfilePage from './pages/UserProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import AdminComplaintManagementPage from './pages/AdminComplaintManagementPage';
import AdminComplaintDetailsPage from './pages/AdminComplaintDetailsPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Route Guard for authenticated users
function ProtectedRoute({ adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <DashboardLayout />;
}

// Route Guard for public-only pages (e.g. login/register when already logged in)
function PublicOnlyRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  return <PublicLayout />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Pages with PublicLayout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      {/* Auth Pages (Redirect if already logged in) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* User Protected Routes with DashboardLayout */}
      <Route element={<ProtectedRoute adminOnly={false} />}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/complaints/new" element={<SubmitComplaintPage />} />
        <Route path="/complaints" element={<MyComplaintsPage />} />
        <Route path="/complaints/:id" element={<ComplaintDetailsPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Route>

      {/* Admin Protected Routes with DashboardLayout */}
      <Route path="/admin" element={<ProtectedRoute adminOnly={true} />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="complaints" element={<AdminComplaintManagementPage />} />
        <Route path="complaints/:id" element={<AdminComplaintDetailsPage />} />
        <Route path="users" element={<AdminUserManagementPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
