import { useAuth } from '../../context/AuthContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styles from '../../pages/dashboard/Dashboard.module.css';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getRolePages = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Users', path: '/users' },
          { name: 'Students', path: '/students' },
          { name: 'Courses', path: '/courses' },
        ];
      case 'STAFF':
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Users', path: '/users' },
          { name: 'Students', path: '/students' },
          { name: 'Courses', path: '/courses' },
        ];
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'My Courses', path: '/courses' },
          { name: 'Grades', path: '/grades' },
        ];
      case 'PARENT':
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Children', path: '/children' },
          { name: 'Attendance', path: '/attendance' },
        ];
      default:
        return [];
    }
  };

  const pages = getRolePages();

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>{user?.role} Portal</h2>
        <nav className={styles.nav}>
          {pages.map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className={`${styles.navLink} ${location.pathname === page.path ? styles.active : ''}`}
            >
              {page.name}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  );
}
