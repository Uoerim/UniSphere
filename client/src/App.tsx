import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ChangePasswordModal from './components/ui/ChangePasswordModal';
import Login from './pages/login/Login';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import StudentManagement from './pages/students/StudentManagement';
import StudentGrades from './pages/students/StudentGrades';
import CoursesRouter from './pages/courses/CoursesRouter';
import Users from './pages/users/Users';
import Staff from './pages/staff/Staff';
import StaffManagement from './pages/staff/StaffManagement';
import Departments from './pages/departments/Departments';
import ParentManagement from './pages/parents/ParentManagement';
import Assessments from './pages/assessments/Assessments';
import Assignments from './pages/assignments/Assignments';
import Facilities from './pages/classrooms/Facilities';
import ManageCourses from './pages/dashboard/ManageCourses';
import Tasks from './pages/dashboard/Tasks';
import Submissions from './pages/dashboard/Submissions';
import Messages from './pages/dashboard/Messages';
import ViewClass from './pages/dashboard/ViewClass';
import CourseGrades from './pages/dashboard/CourseGrades';
import CourseMaterials from './pages/dashboard/CourseMaterials';
import Announcements from './pages/announcements/Announcements';
import Events from './pages/events/Events';
import Settings from './pages/settings/Settings';
// Parent portal pages
import MyChildren from './pages/parent/MyChildren';
import ChildDetails from './pages/parent/ChildDetails';

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
  const { user, token, mustChangePassword, clearMustChangePassword } = useAuth();

  return (
    <>
      {/* Password change modal - shows when user logged in with temp password */}
      {user && mustChangePassword && (
        <ChangePasswordModal
          isOpen={true}
          token={token}
          onSuccess={clearMustChangePassword}
        />
      )}

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
          <Route path="grades" element={<StudentGrades />} />
          <Route path="manage-courses" element={<ManageCourses />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="submissions" element={<Submissions />} />
          <Route path="messages" element={<Messages />} />
          <Route path="class/:courseId" element={<ViewClass />} />
          <Route path="course-grades/:courseId" element={<CourseGrades />} />
          <Route path="materials/:courseId" element={<CourseMaterials />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="events" element={<Events />} />
          <Route path="settings" element={<Settings />} />
          {/* Parent Portal Routes */}
          <Route path="children" element={<MyChildren />} />
          <Route path="children/:childId" element={<ChildDetails />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <AppRoutes />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
