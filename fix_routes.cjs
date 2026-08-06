const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// The route definitions block starts at <Route path="institution/events"
const oldRoutes = `<Route path="institution/events" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Events /></ProtectedRoute>} />
            <Route path="institution/*" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />
            <Route path="teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="teacher/complaints" element={<ProtectedRoute allowedRoles={['TEACHER']}><Complaints /></ProtectedRoute>} />
            <Route path="teacher/events" element={<ProtectedRoute allowedRoles={['TEACHER']}><Events /></ProtectedRoute>} />
            <Route path="teacher/*" element={<ProtectedRoute allowedRoles={['TEACHER']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />
            <Route path="student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="student/complaints" element={<ProtectedRoute allowedRoles={['STUDENT']}><Complaints /></ProtectedRoute>} />
            <Route path="student/events" element={<ProtectedRoute allowedRoles={['STUDENT']}><Events /></ProtectedRoute>} />
            <Route path="student/*" element={<ProtectedRoute allowedRoles={['STUDENT']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />`;

const newRoutes = `<Route path="institution/events" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Events /></ProtectedRoute>} />
            <Route path="institution/notices" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><Notices /></ProtectedRoute>} />
            <Route path="institution/*" element={<ProtectedRoute allowedRoles={['INSTITUTION']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />

            <Route path="teacher" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="teacher/complaints" element={<ProtectedRoute allowedRoles={['TEACHER']}><Complaints /></ProtectedRoute>} />
            <Route path="teacher/events" element={<ProtectedRoute allowedRoles={['TEACHER']}><Events /></ProtectedRoute>} />
            <Route path="teacher/notices" element={<ProtectedRoute allowedRoles={['TEACHER']}><Notices /></ProtectedRoute>} />
            <Route path="teacher/students" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherStudents /></ProtectedRoute>} />
            <Route path="teacher/homework" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherHomework /></ProtectedRoute>} />
            <Route path="teacher/attendance" element={<ProtectedRoute allowedRoles={['TEACHER']}><TeacherAttendance /></ProtectedRoute>} />
            <Route path="teacher/timetable" element={<ProtectedRoute allowedRoles={['TEACHER']}><Timetable /></ProtectedRoute>} />
            <Route path="teacher/*" element={<ProtectedRoute allowedRoles={['TEACHER']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />

            <Route path="student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="student/complaints" element={<ProtectedRoute allowedRoles={['STUDENT']}><Complaints /></ProtectedRoute>} />
            <Route path="student/events" element={<ProtectedRoute allowedRoles={['STUDENT']}><Events /></ProtectedRoute>} />
            <Route path="student/notices" element={<ProtectedRoute allowedRoles={['STUDENT']}><Notices /></ProtectedRoute>} />
            <Route path="student/homework" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentHomework /></ProtectedRoute>} />
            <Route path="student/attendance" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentAttendance /></ProtectedRoute>} />
            <Route path="student/timetable" element={<ProtectedRoute allowedRoles={['STUDENT']}><Timetable /></ProtectedRoute>} />
            <Route path="student/*" element={<ProtectedRoute allowedRoles={['STUDENT']}><UnderConstruction title="Module Pending" /></ProtectedRoute>} />`;

code = code.replace(oldRoutes, newRoutes);
fs.writeFileSync('src/App.tsx', code);
