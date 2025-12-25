import { useState } from 'react';
import styles from '../../styles/pages.module.css';

const initialTasks = [
  { id: '1', title: 'Grade CS101 Projects', type: 'grading', dueDate: '2025-12-26', priority: 'high' },
  { id: '2', title: 'Department Meeting', type: 'meeting', dueDate: '2025-12-24', priority: 'high' },
  { id: '3', title: 'Prepare Spring Syllabus', type: 'preparation', dueDate: '2025-12-30', priority: 'medium' },
  { id: '4', title: 'Submit Research Grant', type: 'admin', dueDate: '2026-01-05', priority: 'medium' },
  { id: '5', title: 'Review TA Applications', type: 'admin', dueDate: '2026-01-10', priority: 'low' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState(initialTasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', dueDate: '', priority: 'medium' });
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'medium' });

  const handleEdit = (task: typeof initialTasks[0]) => {
    setEditingId(task.id);
    setEditForm({ title: task.title, dueDate: task.dueDate, priority: task.priority });
  };

  const handleSave = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...editForm } : t));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      const task = {
        id: Date.now().toString(),
        title: newTask.title,
        type: 'admin' as const,
        dueDate: newTask.dueDate,
        priority: newTask.priority as 'high' | 'medium' | 'low',
      };
      setTasks([...tasks, task]);
      setNewTask({ title: '', dueDate: '', priority: 'medium' });
      setIsAdding(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>All Tasks</h1>
          <p className={styles.pageSubtitle}>Manage your tasks and deadlines</p>
        </div>
        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setIsAdding(!isAdding)} style={{marginTop: '8px'}}>
          {isAdding ? '✕ Cancel' : '+ Add Task'}
        </button>
      </div>
      {isAdding && (
        <div className={styles.card} style={{marginBottom: '16px'}}>
          <div style={{display: 'flex', gap: '12px', alignItems: 'flex-end'}}>
            <div style={{flex: 1}}>
              <label style={{display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500'}}>Task Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                placeholder="Enter task title"
                style={{width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box'}}
                onKeyPress={e => e.key === 'Enter' && handleAddTask()}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500'}}>Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                style={{padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '500'}}>Priority</label>
              <select
                value={newTask.priority}
                onChange={e => setNewTask({...newTask, priority: e.target.value})}
                style={{padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <button
              className={`${styles.actionBtn} ${styles.primary}`}
              onClick={handleAddTask}
            >
              Add
            </button>
          </div>
        </div>
      )}
      <div className={styles.card}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Task</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  {editingId === task.id ? (
                    <>
                      <td><input type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} style={{width: '250px'}} /></td>
                      <td><input type="date" value={editForm.dueDate} onChange={e => setEditForm({...editForm, dueDate: e.target.value})} /></td>
                      <td>
                        <select value={editForm.priority} onChange={e => setEditForm({...editForm, priority: e.target.value})}>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => handleSave(task.id)}>Save</button>
                        <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => setEditingId(null)} style={{marginLeft: '8px'}}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{task.title}</td>
                      <td>{task.dueDate}</td>
                      <td><span className={`${styles.badge} ${task.priority === 'high' ? styles.danger : task.priority === 'medium' ? styles.warning : styles.info}`}>{task.priority}</span></td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.secondary}`} onClick={() => handleEdit(task)}>Edit</button>
                        <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(task.id)} style={{marginLeft: '8px'}}>Delete</button>
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
