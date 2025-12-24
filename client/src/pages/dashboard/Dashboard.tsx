import { useAuth } from '../../context/AuthContext';
import DashboardHome from './DashboardHome';
import StudentDashboard from './StudentDashboard';
import ParentDashboard from './ParentDashboard';
import StaffDashboard from './StaffDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role?.toUpperCase();

  // Render appropriate dashboard based on user role
  switch (role) {
    case 'STUDENT':
      return <StudentDashboard />;
    case 'PARENT':
      return <ParentDashboard />;
    case 'STAFF':
      return <StaffDashboard />;
    case 'ADMIN':
    default:
      return <DashboardHome />;
  }
}
