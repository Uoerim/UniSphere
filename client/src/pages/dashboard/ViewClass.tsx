import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/pages.module.css';

interface Student {
  id: string;
  name: string;
  attendance: string;
  status: 'present' | 'absent' | 'late';
}

interface CourseData {
  code: string;
  name: string;
  schedule: string;
  room: string;
  students: Student[];
}

export default function ViewClass() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/api/staff-dashboard/course/${courseId}/attendance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const attendanceData = await res.json();
          // Mock course info - in production fetch from courses endpoint
          setCourse({
            code: 'CS101',
            name: 'Introduction to Programming',
            schedule: 'Mon/Wed 10:00 AM',
            room: 'Lab 102',
            students: attendanceData,
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load class data');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, token]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  if (!course) return <div style={{ padding: '20px' }}>No course data</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📚 {course.code}: {course.name}</h1>
          <p className={styles.pageSubtitle}>Class Details & Attendance</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Class Information</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>Schedule</label>
            <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>🕐 {course.schedule}</div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '500', color: '#666' }}>Location</label>
            <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '4px' }}>📍 {course.room}</div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Attendance ({course.students.length} Students)</h2>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Attendance Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {course.students.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.attendance}</td>
                  <td>
                    <span className={`${styles.badge} ${student.status === 'present' ? styles.success : student.status === 'late' ? styles.warning : styles.danger}`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
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
