import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Students.module.css';

export default function Students() {
  const { user, logout } = useAuth();

  const dummyStudents = [
    { id: 1, name: 'John Doe', email: 'john@example.com', grade: 'A' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', grade: 'B+' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', grade: 'A-' },
  ];

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
              className={styles.navLink}
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
        <h1>Students</h1>
        <p className={styles.subtitle}>Manage student information and records</p>
        
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dummyStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.grade}</td>
                  <td>
                    <button className={styles.viewBtn}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
