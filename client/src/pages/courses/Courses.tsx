
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/pages.module.css';

export default function Courses() {
  const { user, logout, token } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningCourse, setAssigningCourse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
        
        // Fetch all courses
        const res = await fetch(`${base}/api/curriculum`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        });
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data = await res.json();
        setCourses(data);

        // If staff, also fetch my courses
        if (user?.role === 'STAFF' && token) {
          const myCoursesRes = await fetch(`${base}/api/curriculum/my-courses`, {
            headers: { 'Authorization': token ? `Bearer ${token}` : '' },
          });
          if (myCoursesRes.ok) {
            const myCoursesData = await myCoursesRes.json();
            setMyCourses(myCoursesData);
          }
        }
      } catch (err: any) {
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchCourses();
  }, [token, user?.role]);

  const assignCourseToMe = async (courseId: string) => {
    if (!token) return;
    setAssigningCourse(courseId);
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/curriculum/${courseId}/assign-instructor`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to assign course');
      }
      // Refresh my courses
      const myCoursesRes = await fetch(`${base}/api/curriculum/my-courses`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (myCoursesRes.ok) {
        const myCoursesData = await myCoursesRes.json();
        setMyCourses(myCoursesData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign course');
    } finally {
      setAssigningCourse(null);
    }
  };

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
        <p className={styles.subtitle}>
          {user?.role === 'STAFF' ? 'View all available courses and assign yourself as instructor' : 'View and manage course information'}
        </p>
        
        {/* Show my courses for staff */}
        {user?.role === 'STAFF' && (
          <div style={{ marginBottom: '3rem' }}>
            <h2>My Assigned Courses</h2>
            {myCourses.length === 0 ? (
              <p>No assigned courses yet.</p>
            ) : (
              <div className={styles.coursesGrid}>
                {myCourses.map((course) => (
                  <div key={course.id} className={styles.courseCard}>
                    <h3>{course.name}</h3>
                    <p>{course.code || 'N/A'}</p>
                    <p className={styles.students}>{course.enrolledStudents || 0} students enrolled</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Show all courses */}
        {loading ? (
          <div>Loading courses...</div>
        ) : error ? (
          <div style={{ color: 'red' }}>{error}</div>
        ) : (
          <div>
            <h2>{user?.role === 'STAFF' ? 'Available Courses to Assign' : 'All Courses'}</h2>
            <div className={styles.coursesGrid}>
              {courses.length === 0 ? (
                <div>No courses available.</div>
              ) : (
                courses.map((course) => {
                  const isAssigned = myCourses.some(c => c.id === course.id);
                  return (
                    <div key={course.id} className={styles.courseCard}>
                      <h3>{course.name}</h3>
                      <p className={styles.instructor}>
                        Instructor: {course.instructors?.length > 0 ? course.instructors.map((i: any) => i.name).join(', ') : course.instructor?.name || 'N/A'}
                      </p>
                      <p className={styles.students}>{course.enrolledStudents || 0} students enrolled</p>
                      {user?.role === 'STAFF' && !isAssigned && (
                        <button 
                          className={styles.detailsBtn}
                          onClick={() => assignCourseToMe(course.id)}
                          disabled={assigningCourse === course.id}
                        >
                          {assigningCourse === course.id ? 'Assigning...' : 'Assign to Me'}
                        </button>
                      )}
                      {user?.role === 'STAFF' && isAssigned && (
                        <button className={styles.detailsBtn} disabled style={{ opacity: 0.6 }}>
                          Assigned ✓
                        </button>
                      )}
                      {user?.role !== 'STAFF' && <button className={styles.detailsBtn}>View Details</button>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
