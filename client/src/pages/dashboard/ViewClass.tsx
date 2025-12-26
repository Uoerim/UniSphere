import { useParams } from 'react-router-dom';
import styles from '../../styles/pages.module.css';

interface Student {
  id: string;
  name: string;
  attendance: string;
  status: 'present' | 'absent' | 'late';
}

export default function ViewClass() {
  const { courseId } = useParams();

  const courseData: Record<string, { code: string; name: string; schedule: string; room: string; students: Student[] }> = {
    '1': {
      code: 'CS101',
      name: 'Introduction to Programming',
      schedule: 'Mon/Wed 10:00 AM',
      room: 'Lab 102',
      students: [
        { id: '1', name: 'John Smith', attendance: '95%', status: 'present' },
        { id: '3', name: 'Michael Brown', attendance: '88%', status: 'present' },
        { id: '5', name: 'Anna Lee', attendance: '92%', status: 'present' },
      ],
    },
    '2': {
      code: 'CS201',
      name: 'Data Structures',
      schedule: 'Tue/Thu 2:00 PM',
      room: 'Room 305',
      students: [
        { id: '2', name: 'Emily Chen', attendance: '98%', status: 'present' },
        { id: '6', name: 'David Kim', attendance: '94%', status: 'late' },
      ],
    },
    '3': {
      code: 'CS301',
      name: 'Web Development',
      schedule: 'Mon/Wed 2:00 PM',
      room: 'Lab 104',
      students: [
        { id: '4', name: 'Sarah Davis', attendance: '96%', status: 'present' },
        { id: '7', name: 'Liam Patel', attendance: '100%', status: 'present' },
      ],
    },
  };

  const course = courseData[courseId || '1'];

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
