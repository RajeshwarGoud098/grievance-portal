import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TrackPage from './pages/TrackPage';

// User pages
import UserDashboard from './pages/user/UserDashboard';
import SubmitComplaint from './pages/user/SubmitComplaint';
import MyComplaints from './pages/user/MyComplaints';
import ComplaintDetail from './pages/user/ComplaintDetail';

// Manager/Admin pages
import ManagerDashboard from './pages/manager/ManagerDashboard';
import DepartmentComplaints from './pages/manager/DepartmentComplaints';
import ComplaintManage from './pages/manager/ComplaintManage';
import AdminUsers from './pages/manager/AdminUsers';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-center" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={user.role === 'user' ? '/dashboard' : '/manager'} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/track" element={<TrackPage />} />

      {/* User routes */}
      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
      <Route path="/submit" element={<ProtectedRoute allowedRoles={['user']}><SubmitComplaint /></ProtectedRoute>} />
      <Route path="/my-complaints" element={<ProtectedRoute allowedRoles={['user']}><MyComplaints /></ProtectedRoute>} />
      <Route path="/complaint/:id" element={<ProtectedRoute allowedRoles={['user']}><ComplaintDetail /></ProtectedRoute>} />

      {/* Manager / Admin routes */}
      <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/manager/complaints" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><DepartmentComplaints /></ProtectedRoute>} />
      <Route path="/manager/complaint/:id" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><ComplaintManage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' },
            success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
