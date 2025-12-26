import { useParams } from 'react-router-dom';
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

  const courseData: Record<string, { code: string; name: string; students: StudentGrade[] }> = {
    '1': {
      code: 'CS101',
      name: 'Introduction to Programming',
      students: [
        { id: '1', name: 'John Smith', assignment1: 'A', assignment2: 'B+', midterm: 'B', final: 'Pending', average: 'B' },
        { id: '3', name: 'Michael Brown', assignment1: 'B', assignment2: 'B', midterm: 'B-', final: 'Pending', average: 'B-' },
        { id: '5', name: 'Anna Lee', assignment1: 'A-', assignment2: 'A', midterm: 'A', final: 'Pending', average: 'A-' },
      ],
    },
    '2': {
      code: 'CS201',
      name: 'Data Structures',
      students: [
        { id: '2', name: 'Emily Chen', assignment1: 'A', assignment2: 'A', midterm: 'A', final: 'A', average: 'A' },
        { id: '6', name: 'David Kim', assignment1: 'A-', assignment2: 'A', midterm: 'A-', final: 'A-', average: 'A-' },
      ],
    },
    '3': {
      code: 'CS301',
      name: 'Web Development',
      students: [
        { id: '4', name: 'Sarah Davis', assignment1: 'A', assignment2: 'A-', midterm: 'B+', final: 'Pending', average: 'A-' },
        { id: '7', name: 'Liam Patel', assignment1: 'A', assignment2: 'A', midterm: 'A', final: 'Pending', average: 'A' },
      ],
    },
  };

  const course = courseData[courseId || '1'];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📊 Grades - {course.code}: {course.name}</h1>
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
              {course.students.map(student => (
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
