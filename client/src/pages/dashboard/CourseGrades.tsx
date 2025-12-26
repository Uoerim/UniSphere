import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/pages.module.css';

interface StudentGrade {
  id: string;
  name: string;
  assignment1: string;
  assignment2: string;
  midterm: string;
  final: string;
  average: string;
}

export default function CourseGrades() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/api/staff-dashboard/course/${courseId}/grades`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [courseId, token]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📊 Grades - {courseCode}: {courseName}</h1>
          <p className={styles.pageSubtitle}>View and manage student grades</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Student Grades</h2>
        </div>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Assignment 1</th>
                <th>Assignment 2</th>
                <th>Midterm</th>
                <th>Final</th>
                <th>Average</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.assignment1}</td>
                  <td>{student.assignment2}</td>
                  <td>{student.midterm}</td>
                  <td>{student.final}</td>
                  <td>
                    <strong>{student.average}</strong>
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
