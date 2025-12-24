import Messages from './pages/dashboard/Messages';
import Schedule from './pages/dashboard/Schedule';
import Assessments from './pages/dashboard/Assessments';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/login/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import CoursesRouter from './pages/courses/CoursesRouter';
import Users from './pages/users/Users';
import Staff from './pages/staff/Staff';
import StaffManagement from './pages/staff/StaffManagement';
import Classrooms from './pages/classrooms/Classrooms';
// ...existing code...
import Announcements from './pages/announcements/Announcements';
import Events from './pages/events/Events';
import Settings from './pages/settings/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="students" element={<Students />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="staff-old" element={<Staff />} />
            <Route path="courses" element={<CoursesRouter />} />
            <Route path="classrooms" element={<Classrooms />} />
// ...existing code...
            <Route path="assessments" element={<Assessments />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="messages" element={<Messages />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="events" element={<Events />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
