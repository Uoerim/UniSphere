import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Courses.module.css';

export default function Courses() {
  const { user, logout } = useAuth();


  // Example: Filter courses by staff member's email or name (replace with real logic as needed)
  // For demo, assume user?.email or user?.name matches instructor
  const allCourses = [
    { id: 1, name: 'Mathematics 101', instructor: 'mahmoudkhalil', students: 32 },
    { id: 2, name: 'Physics 201', instructor: 'Prof. Johnson', students: 28 },
    { id: 3, name: 'Chemistry 101', instructor: 'mahmoudkhalil', students: 35 },
  ];
  // Use username before @ as instructor key
  const staffKey = user?.email?.split('@')[0]?.toLowerCase();
  const staffCourses = allCourses.filter(
    (course) => course.instructor.toLowerCase() === staffKey
  );

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
    <div className={styles.content}>
      <h1>Courses</h1>
      <p className={styles.subtitle}>View and manage course information</p>
      <div className={styles.coursesGrid}>
        {staffCourses.length === 0 ? (
          <p>No courses assigned to you.</p>
        ) : (
          staffCourses.map((course) => (
            <div key={course.id} className={styles.courseCard}>
              <h3>{course.name}</h3>
              <p className={styles.students}>{course.students} students enrolled</p>
              <button className={styles.detailsBtn}>View Details</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
