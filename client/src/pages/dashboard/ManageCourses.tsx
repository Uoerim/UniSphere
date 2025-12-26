import { useState } from 'react';
import styles from '../../styles/pages.module.css';

const initialCourses = [
  { id: '1', name: 'Introduction to Programming', code: 'CS101', students: 3, schedule: 'Mon/Wed 10:00 AM', room: 'Lab 102' },
  { id: '2', name: 'Data Structures', code: 'CS201', students: 2, schedule: 'Tue/Thu 2:00 PM', room: 'Room 305' },
  { id: '3', name: 'Web Development', code: 'CS301', students: 2, schedule: 'Mon/Wed 2:00 PM', room: 'Lab 104' },
];

export default function ManageCourses() {
  const [courses, setCourses] = useState(initialCourses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', schedule: '', room: '' });

  const handleEdit = (course: typeof initialCourses[0]) => {
    setEditingId(course.id);
    setEditForm({ name: course.name, code: course.code, schedule: course.schedule, room: course.room });
  };

  const handleSave = (id: string) => {
    setCourses(courses.map(c => c.id === id ? { ...c, ...editForm } : c));
    setEditingId(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Manage Courses</h1>
          <p className={styles.pageSubtitle}>Edit your course details</p>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Schedule</th>
                <th>Room</th>
                <th>Students</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  {editingId === course.id ? (
                    <>
                      <td><input type="text" value={editForm.code} onChange={e => setEditForm({...editForm, code: e.target.value})} style={{width: '80px'}} /></td>
                      <td><input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{width: '200px'}} /></td>
                      <td><input type="text" value={editForm.schedule} onChange={e => setEditForm({...editForm, schedule: e.target.value})} style={{width: '150px'}} /></td>
                      <td><input type="text" value={editForm.room} onChange={e => setEditForm({...editForm, room: e.target.value})} style={{width: '100px'}} /></td>
                      <td>{course.students}</td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => handleSave(course.id)}>Save</button>
                        <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => setEditingId(null)} style={{marginLeft: '8px'}}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{course.code}</td>
                      <td>{course.name}</td>
                      <td>{course.schedule}</td>
                      <td>{course.room}</td>
                      <td>{course.students}</td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => handleEdit(course)}>Edit</button>
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
