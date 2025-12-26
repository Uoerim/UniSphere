import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/pages.module.css';

interface Submission {
  id: string;
  name: string;
  course: string;
  lastSubmission: string;
  grade: string;
}

export default function Submissions() {
  const { user, token } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/api/staff-dashboard/submissions/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        }
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, [user?.id, token]);

  const handleEdit = (submission: Submission) => {
    setEditingId(submission.id);
    setEditGrade(submission.grade);
  };

  const handleSave = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/staff-dashboard/submissions/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ grade: editGrade })
      });
      if (res.ok) {
        setSubmissions(submissions.map(s => s.id === id ? { ...s, grade: editGrade } : s));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Failed to save grade:', err);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading submissions...</div>;

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
