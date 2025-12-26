import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/login/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import StudentManagement from './pages/students/StudentManagement';
import CoursesRouter from './pages/courses/CoursesRouter';
import Users from './pages/users/Users';
import Staff from './pages/staff/Staff';
import StaffManagement from './pages/staff/StaffManagement';
import Facilities from './pages/classrooms/Facilities';
import Departments from './pages/departments/Departments';
import ParentManagement from './pages/parents/ParentManagement';
import Assessments from './pages/assessments/Assessments';
import Assignments from './pages/assignments/Assignments';
import Announcements from './pages/announcements/Announcements';
import Events from './pages/events/Events';
import Settings from './pages/settings/Settings';

// Role-based Student page wrapper - uses auth context
function StudentsPage() {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <StudentManagement />;
  }
  return <Students />;
}

// Main Routes component that uses auth context
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="staff-old" element={<Staff />} />
        <Route path="courses" element={<CoursesRouter />} />
        <Route path="facilities" element={<Facilities />} />
        <Route path="departments" element={<Departments />} />
        <Route path="parents" element={<ParentManagement />} />
        <Route path="assessments" element={<Assessments />} />
        <Route path="assignments" element={<Assignments />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="events" element={<Events />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
