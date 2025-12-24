
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Courses.module.css';
import React, { useState } from 'react';

export default function Courses() {
  const { user, logout } = useAuth();

  const dummyCourses = [
    { id: 1, name: 'Mathematics 101', instructor: 'Dr. Smith', students: 32, creditHours: 3 },
    { id: 2, name: 'Physics 201', instructor: 'Prof. Johnson', students: 28, creditHours: 4 },
    { id: 3, name: 'Chemistry 101', instructor: 'Dr. Williams', students: 35, creditHours: 3 },
  ];

  const [selectedCourse, setSelectedCourse] = useState(null);

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
        <h1>Courses</h1>
        <p className={styles.subtitle}>View and manage course information</p>
        
        <div className={styles.coursesGrid}>
          {dummyCourses.map((course) => (
            <div key={course.id} className={styles.courseCard}>
              <h3>{course.name}</h3>
              <p className={styles.instructor}>Instructor: {course.instructor}</p>
              <p className={styles.students}>{course.students} students enrolled</p>
              <button className={styles.detailsBtn} onClick={() => setSelectedCourse(course)}>
                View Details
              </button>
            </div>
          ))}
                {/* Modal for course details */}
                {selectedCourse && (
                  <div className={styles.modalOverlay} onClick={() => setSelectedCourse(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                      <h2>{selectedCourse.name} Details</h2>
                      <p><strong>Credit Hours:</strong> {selectedCourse.creditHours}</p>
                      <p><strong>Number of Students:</strong> {selectedCourse.students}</p>
                      <button className={styles.detailsBtn} onClick={() => setSelectedCourse(null)}>Close</button>
                    </div>
                  </div>
                )}
        </div>
      </div>
    </div>
  );
}
