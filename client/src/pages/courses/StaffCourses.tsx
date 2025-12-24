import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './Courses.module.css';

interface Student {
  id: string;
  name: string;
  email?: string;
}

interface Course {
  id: string;
  name: string;
  description?: string;
  code?: string;
  credits?: number;
  department?: string;
  semester?: string;
  courseType?: string;
  capacity?: number;
  room?: string;
  schedule?: string;
  isActive: boolean;
  createdAt: string;
  enrolledStudents: number;
  students?: Student[];
}

/**
 * StaffCourses - View courses assigned to the current staff member
 * Features: View assigned courses, see enrolled students
 */
export default function StaffCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [courseStudents, setCourseStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all courses and filter for ones where this staff is the instructor
      const response = await fetch('http://localhost:4000/api/curriculum', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch courses');

      const data = await response.json();
      
      // Filter courses where this staff member is the instructor
      const myCourses = data.filter((course: any) => 
        course.instructor?.accountId === user?.id || 
        course.instructor?.email === user?.email
      );
      
      setCourses(myCourses);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseStudents = async (course: Course) => {
    setLoadingStudents(true);
    setCourseStudents([]);
    setSelectedCourse(course);
    setShowStudentsModal(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/curriculum/${course.id}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const students = await response.json();
        setCourseStudents(students);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoadingStudents(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your courses...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>My Courses</h1>
          <p className={styles.subtitle}>Courses you are teaching this semester</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️</span> {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>📚</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{courses.length}</div>
            <div className={styles.statLabel}>My Courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>✅</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{courses.filter(c => c.isActive).length}</div>
            <div className={styles.statLabel}>Active Courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>👨‍🎓</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>
              {courses.reduce((acc, c) => acc + (c.enrolledStudents || 0), 0)}
            </div>
            <div className={styles.statLabel}>Total Students</div>
          </div>
        </div>
      </div>

      {/* Courses */}
      {courses.length === 0 ? (
        <div className={styles.emptyState}>
          <span>📚</span>
          <h3>No Courses Assigned</h3>
          <p>You don't have any courses assigned to you yet. Contact your administrator for course assignments.</p>
        </div>
      ) : (
        <div className={styles.coursesGrid}>
          {courses.map(course => (
            <div key={course.id} className={`${styles.courseCard} ${!course.isActive ? styles.inactive : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.courseCode}>{course.code}</div>
                <div className={`${styles.statusBadge} ${course.isActive ? styles.active : styles.inactive}`}>
                  {course.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <h3 className={styles.courseName}>{course.name}</h3>
              {course.description && (
                <p className={styles.courseDescription}>{course.description}</p>
              )}
              <div className={styles.courseMeta}>
                {course.department && (
                  <span className={styles.metaItem}>🏛️ {course.department}</span>
                )}
                {course.credits && (
                  <span className={styles.metaItem}>📊 {course.credits} Credits</span>
                )}
                {course.semester && (
                  <span className={styles.metaItem}>📅 {course.semester}</span>
                )}
              </div>
              <div className={styles.courseDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Room:</span>
                  <span className={styles.detailValue}>{course.room || 'TBD'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Schedule:</span>
                  <span className={styles.detailValue}>{course.schedule || 'TBD'}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Enrolled:</span>
                  <span className={styles.detailValue}>
                    {course.enrolledStudents} / {course.capacity || 30}
                  </span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <button 
                  className={styles.viewBtn} 
                  onClick={() => fetchCourseStudents(course)}
                >
                  👨‍🎓 View Students
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Students Modal */}
      {showStudentsModal && selectedCourse && (
        <div className={styles.modalOverlay} onClick={() => setShowStudentsModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Students in {selectedCourse.code}</h2>
              <button className={styles.closeBtn} onClick={() => setShowStudentsModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {loadingStudents ? (
                <div className={styles.loadingContainer}>
                  <div className={styles.spinner}></div>
                  <p>Loading students...</p>
                </div>
              ) : courseStudents.length === 0 ? (
                <div className={styles.emptyState}>
                  <span>👨‍🎓</span>
                  <h3>No Students Enrolled</h3>
                  <p>There are no students enrolled in this course yet.</p>
                </div>
              ) : (
                <div className={styles.studentsList}>
                  <table className={styles.coursesTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseStudents.map((student, index) => (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>{student.name}</td>
                          <td>{student.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowStudentsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
