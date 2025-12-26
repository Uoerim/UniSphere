import { useState, useEffect } from 'react';
import styles from '../students/Students.module.css';
import api from '../../lib/api';

interface Student {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  parentEmail?: string;
  createdAt: string;
}

export default function StudentPage() {
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Student[]>('/students');
      setStudentList(response.data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = studentList.filter(student =>
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>Student Directory</h1>
        <p style={{ color: '#666', marginBottom: '16px' }}>Browse and manage students</p>
        <input
          type="text"
          placeholder="Search students by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fee', color: '#c33', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Parent Email</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student.id}>
                <td>{student.firstName} {student.lastName}</td>
                <td>{student.email}</td>
                <td>{student.parentEmail || '—'}</td>
                <td>{new Date(student.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
          No students found
        </div>
      )}
    </div>
  );
}
