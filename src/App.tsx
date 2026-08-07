import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import InstitutionDashboard from './pages/dashboards/InstitutionDashboard';
import TeacherDashboard from './pages/dashboards/TeacherDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import TeacherStudents from './pages/dashboards/TeacherStudents';
import TeacherHomework from './pages/dashboards/TeacherHomework';
import StudentHomework from './pages/dashboards/StudentHomework';
import TeacherAttendance from './pages/dashboards/TeacherAttendance';
import StudentAttendance from './pages/dashboards/StudentAttendance';
import Timetable from './pages/dashboards/Timetable';
import Complaints from './pages/dashboards/Complaints';
import UnderConstruction from './pages/dashboards/UnderConstruction';

import Institutions from './pages/dashboards/Institutions';
import Teachers from './pages/dashboards/Teachers';
import Students from './pages/dashboards/Students';
import Events from './pages/dashboards/Events';
import Notices from './pages/dashboards/Notices';
import StudyGroups from './pages/dashboards/StudyGroups';
import ClassesAndSections from './pages/dashboards/ClassesAndSections';
import InstitutionSettings from './pages/dashboards/InstitutionSettings';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold tracking-wider text-slate-300">Loading VAKS AI...</span>
        </div>
      </div>
    );
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
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={
              <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center text-2xl font-bold mb-4">!</div>
                <h1 className="text-3xl font-extrabold mb-2">Access Denied</h1>
                <p className="text-slate-400 mb-8 max-w-md text-center">You do not have permission to view this section of VAKS AI.</p>
                <a href="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30">Return Home</a>
              </div>
            } />
            
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardRedirect />} />
              <Route path="super-admin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
              <Route path="super-admin/institutions" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><Institutions /></ProtectedRoute>} />
              <Route path="super-admin/study-groups" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><StudyGroups /></ProtectedRoute>} />
              <Route path="super-admin/*" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />
              
              <Route path="institution" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><InstitutionDashboard /></ProtectedRoute>} />
              <Route path="institution/classes" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><ClassesAndSections /></ProtectedRoute>} />
              <Route path="institution/study-groups" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><StudyGroups /></ProtectedRoute>} />
              <Route path="institution/complaints" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Complaints /></ProtectedRoute>} />
              <Route path="institution/teachers" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Teachers /></ProtectedRoute>} />
              <Route path="institution/students" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Students /></ProtectedRoute>} />
              <Route path="institution/events" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Events /></ProtectedRoute>} />
              <Route path="institution/timetable" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Timetable /></ProtectedRoute>} />
              <Route path="institution/notices" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Notices /></ProtectedRoute>} />
              <Route path="institution/settings" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><InstitutionSettings /></ProtectedRoute>} />
              <Route path="institution/*" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />

              <Route path="teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
              <Route path="teacher/study-groups" element={<ProtectedRoute allowedRoles={['TEACHER']}><StudyGroups /></ProtectedRoute>} />
              <Route path="teacher/students" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherStudents /></ProtectedRoute>} />
              <Route path="teacher/homework" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherHomework /></ProtectedRoute>} />
              <Route path="teacher/attendance" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherAttendance /></ProtectedRoute>} />
              <Route path="teacher/timetable" element={<ProtectedRoute allowedRoles={['TEACHER']}><Timetable /></ProtectedRoute>} />
              <Route path="teacher/events" element={<ProtectedRoute allowedRoles={['TEACHER']}><Events /></ProtectedRoute>} />
              <Route path="teacher/notices" element={<ProtectedRoute allowedRoles={['TEACHER']}><Notices /></ProtectedRoute>} />
              <Route path="teacher/complaints" element={<ProtectedRoute allowedRoles={['TEACHER']}><Complaints /></ProtectedRoute>} />
              <Route path="teacher/*" element={<ProtectedRoute allowedRoles={['TEACHER']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />

              <Route path="student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="student/study-groups" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudyGroups /></ProtectedRoute>} />
              <Route path="student/events" element={<ProtectedRoute allowedRoles={['STUDENT']}><Events /></ProtectedRoute>} />
              <Route path="student/homework" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentHomework /></ProtectedRoute>} />
              <Route path="student/attendance" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentAttendance /></ProtectedRoute>} />
              <Route path="student/timetable" element={<ProtectedRoute allowedRoles={['STUDENT']}><Timetable /></ProtectedRoute>} />
              <Route path="student/notices" element={<ProtectedRoute allowedRoles={['STUDENT']}><Notices /></ProtectedRoute>} />
              <Route path="student/complaints" element={<ProtectedRoute allowedRoles={['STUDENT']}><Complaints /></ProtectedRoute>} />
              <Route path="student/*" element={<ProtectedRoute allowedRoles={['STUDENT']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
