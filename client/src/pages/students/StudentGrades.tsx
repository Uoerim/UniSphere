import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ChartIcon, BookOpenIcon, CalendarIcon } from '../../components/ui/Icons';
import styles from './Students.module.css';

interface CourseGrade {
  id: string;
  enrollmentId?: string;
  name?: string;
  courseName?: string;
  code?: string;
  courseCode?: string;
  grade?: string;
  attendance?: number;
  status?: 'active' | 'dropped';
  department?: string;
  enrolledAt?: string;
  [key: string]: any;
}

export default function StudentGrades() {
  const { token } = useAuth();
  const apiBase = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api');
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${apiBase}/students/me/courses`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch grades: ${response.status}`);
        }

        const data = await response.json();
        // Filter for active courses only
        const activeCourses = (data || []).filter((c: CourseGrade) => c.status === 'active');
        setCourseGrades(activeCourses);
      } catch (err: any) {
        console.error('Grades fetch error:', err);
        setError(err.message || 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchGrades();
    }
  }, [token, apiBase]);

  const getGradeColor = (grade: string | undefined): string => {
    if (!grade || grade === 'N/A') return '#999';
    const gradeUpper = grade.toUpperCase();
    if (gradeUpper.startsWith('A')) return '#22c55e';
    if (gradeUpper.startsWith('B')) return '#3b82f6';
    if (gradeUpper.startsWith('C')) return '#f59e0b';
    if (gradeUpper.startsWith('D')) return '#ef4444';
    if (gradeUpper.startsWith('F')) return '#dc2626';
    return '#999';
  };

  const getAttendanceColor = (attendance: number | undefined): string => {
    if (!attendance) return '#ef4444';
    if (attendance >= 80) return '#22c55e';
    if (attendance >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className={styles.content}>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading your grades...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ChartIcon size={28} /> My Grades
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          View your course grades and attendance for active courses
        </p>
      </div>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {courseGrades.length === 0 ? (
        <div style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center'
        }}>
          <BookOpenIcon size={48} style={{ color: '#d1d5db', marginBottom: '12px' }} />
          <p style={{ color: '#6b7280', marginBottom: '0' }}>
            No active courses with grades yet
          </p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Active Courses</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{courseGrades.length}</div>
            </div>
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Average Attendance</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                {courseGrades.length > 0
                  ? Math.round(courseGrades.reduce((sum, c) => sum + (c.attendance || 0), 0) / courseGrades.length)
                  : 0}%
              </div>
            </div>
          </div>

          {/* Grades Table */}
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Grade</th>
                  <th>Attendance</th>
                  <th>Enrolled</th>
                </tr>
              </thead>
              <tbody>
                {courseGrades.map(course => (
                  <tr key={course.enrollmentId || course.id}>
                    <td style={{ fontWeight: '500' }}>
                      {course.name || course.courseName || 'Unnamed Course'}
                    </td>
                    <td>
                      <span style={{
                        background: '#f3f4f6',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {course.code || course.courseCode || 'N/A'}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280' }}>{course.department || 'N/A'}</td>
                    <td>
                      <span style={{
                        background: getGradeColor(course.grade),
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '14px',
                        display: 'inline-block'
                      }}>
                        {course.grade ?? 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '100px',
                          height: '20px',
                          background: '#e5e7eb',
                          borderRadius: '10px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${course.attendance ?? 0}%`,
                            background: getAttendanceColor(course.attendance),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{ fontWeight: '600', minWidth: '35px' }}>
                          {course.attendance ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '14px' }}>
                      {course.enrolledAt
                        ? new Date(course.enrolledAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Attendance Legend */}
          <div style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '24px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Attendance Scale</h3>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', background: '#22c55e', borderRadius: '3px' }} />
                <span>80% or above</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', background: '#f59e0b', borderRadius: '3px' }} />
                <span>60% - 79%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '3px' }} />
                <span>Below 60%</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
