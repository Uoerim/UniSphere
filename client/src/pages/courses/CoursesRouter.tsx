import { useAuth } from '../../context/AuthContext';
import AdminCourses from './AdminCourses';
import StaffCourses from './StaffCourses';
import StudentCourses from './StudentCourses';
import ParentCourses from './ParentCourses';

/**
 * CoursesRouter - Routes to the appropriate courses page based on user role
 * Each role gets a different view with role-specific options
 */
export default function CoursesRouter() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminCourses />;
    case 'STAFF':
      return <StaffCourses />;
    case 'STUDENT':
      return <StudentCourses />;
    case 'PARENT':
      return <ParentCourses />;
    default:
      return <StudentCourses />; // Default fallback
  }
}
