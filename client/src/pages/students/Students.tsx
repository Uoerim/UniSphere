import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Students.module.css';


export default function Students() {
  const { user, logout } = useAuth();

  // Demo: Registered students for a course taught by this staff
  // In a real app, filter by staff's courses and fetch from API
  const registeredStudents = [
    { id: 101, name: 'John Smith', email: 'john.smith@university.edu', grade: 'Pending', course: 'CS101' },
    { id: 102, name: 'Michael Brown', email: 'michael.brown@university.edu', grade: 'Pending', course: 'CS101' },
    { id: 103, name: 'Anna Lee', email: 'anna.lee@university.edu', grade: 'B', course: 'CS101' },
    { id: 104, name: 'Emily Chen', email: 'emily.chen@university.edu', grade: 'A', course: 'CS201' },
    { id: 105, name: 'David Kim', email: 'david.kim@university.edu', grade: 'A-', course: 'CS201' },
    { id: 106, name: 'Sarah Davis', email: 'sarah.davis@university.edu', grade: 'B+', course: 'CS301' },
    { id: 107, name: 'Liam Patel', email: 'liam.patel@university.edu', grade: 'A', course: 'CS301' },
  ];

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

        {/* Registered Students in Staff's Courses */}
        <div className={styles.tableContainer} style={{ marginBottom: 32 }}>
          <h2 style={{ margin: '16px 0 8px 0' }}>Registered Students in Your Courses</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Course</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {registeredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.course}</td>
                  <td>{student.grade}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Other students table (existing) */}
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
