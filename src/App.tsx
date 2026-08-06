import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import InstitutionDashboard from './pages/dashboards/InstitutionDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import Complaints from './pages/dashboards/Complaints';
import UnderConstruction from './pages/dashboards/UnderConstruction';

import Institutions from './pages/dashboards/Institutions';
import Teachers from './pages/dashboards/Teachers';
import Students from './pages/dashboards/Students';
import Events from './pages/dashboards/Events';
import Notices from './pages/dashboards/Notices';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Route Redirector based on role
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  
  switch (user.role) {
    case 'SUPER_ADMIN': return <Navigate to="/dashboard/super-admin" replace />;
    case 'INSTITUTION': return <Navigate to="/dashboard/institution" replace />;
    case 'TEACHER': return <Navigate to="/dashboard/teacher" replace />;
    case 'STUDENT': return <Navigate to="/dashboard/student" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
              <p className="text-gray-600 mb-8">You do not have permission to view this page.</p>
              <a href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Return Home</a>
            </div>
          } />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardRedirect />} />
            <Route path="super-admin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="super-admin/institutions" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><Institutions /></ProtectedRoute>} />
            <Route path="super-admin/*" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />
            
            <Route path="institution" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><InstitutionDashboard /></ProtectedRoute>} />
            <Route path="institution/complaints" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Complaints /></ProtectedRoute>} />
            <Route path="institution/teachers" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Teachers /></ProtectedRoute>} />
            <Route path="institution/students" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Students /></ProtectedRoute>} />
            <Route path="institution/events" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Events /></ProtectedRoute>} />
            <Route path="institution/*" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />

            <Route path="teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="teacher/complaints" element={<ProtectedRoute allowedRoles={['TEACHER']}><Complaints /></ProtectedRoute>} />
            <Route path="teacher/events" element={<ProtectedRoute allowedRoles={['TEACHER']}><Events /></ProtectedRoute>} />
            <Route path="teacher/*" element={<ProtectedRoute allowedRoles={['TEACHER']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />

            <Route path="student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="student/complaints" element={<ProtectedRoute allowedRoles={['STUDENT']}><Complaints /></ProtectedRoute>} />
            <Route path="student/events" element={<ProtectedRoute allowedRoles={['STUDENT']}><Events /></ProtectedRoute>} />
            <Route path="student/*" element={<ProtectedRoute allowedRoles={['STUDENT']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
