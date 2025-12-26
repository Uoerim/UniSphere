import { useState } from 'react';
import styles from '../../styles/pages.module.css';

const initialSubmissions = [
  { id: '1', name: 'John Smith', course: 'CS101', lastSubmission: 'Project 3', grade: 'Pending' },
  { id: '2', name: 'Emily Chen', course: 'CS201', lastSubmission: 'Assignment 5', grade: 'A' },
  { id: '3', name: 'Michael Brown', course: 'CS101', lastSubmission: 'Project 3', grade: 'Pending' },
  { id: '4', name: 'Sarah Davis', course: 'CS301', lastSubmission: 'Lab Report', grade: 'B+' },
];

export default function Submissions() {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState('');

  const handleEdit = (submission: typeof initialSubmissions[0]) => {
    setEditingId(submission.id);
    setEditGrade(submission.grade);
  };

  const handleSave = (id: string) => {
    setSubmissions(submissions.map(s => s.id === id ? { ...s, grade: editGrade } : s));
    setEditingId(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Recent Submissions</h1>
          <p className={styles.pageSubtitle}>View and grade student submissions</p>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Submission</th>
                <th>Grade</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(submission => (
                <tr key={submission.id}>
                  <td>{submission.name}</td>
                  <td>{submission.course}</td>
                  <td>{submission.lastSubmission}</td>
                  {editingId === submission.id ? (
                    <>
                      <td><input type="text" value={editGrade} onChange={e => setEditGrade(e.target.value)} style={{width: '80px'}} /></td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => handleSave(submission.id)}>Save</button>
                        <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => setEditingId(null)} style={{marginLeft: '8px'}}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td><span className={`${styles.badge} ${submission.grade === 'Pending' ? styles.warning : styles.success}`}>{submission.grade}</span></td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => handleEdit(submission)}>Edit Grade</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
