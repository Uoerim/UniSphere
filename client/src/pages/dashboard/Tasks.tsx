import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/pages.module.css';

interface Task {
  id: string;
  title: string;
  type: string;
  dueDate: string;
  priority: string;
}

export default function Tasks() {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', dueDate: '', priority: 'medium' });
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', dueDate: '', priority: 'medium' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/api/staff-dashboard/tasks/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
        }
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user?.id, token]);

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm({ title: task.title, dueDate: task.dueDate, priority: task.priority });
  };

  const handleSave = async (id: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`http://localhost:4000/api/staff-dashboard/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setTasks(tasks.map(t => t.id === id ? { ...t, ...editForm } : t));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/staff-dashboard/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleAddTask = async () => {
    console.log('Add task clicked:', newTask, 'User ID:', user?.id);
    
    if (!newTask.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    
    if (!user?.id || !token) {
      alert('User not authenticated');
      return;
    }

    try {
      console.log(`Posting to: http://localhost:4000/api/staff-dashboard/tasks/${user.id}`);
      const res = await fetch(`http://localhost:4000/api/staff-dashboard/tasks/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTask.title,
          dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
          priority: newTask.priority,
          type: 'admin'
        })
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error('Error response:', errorData);
        alert(`Failed to add task: ${res.statusText}`);
        return;
      }
      
      const task = await res.json();
      console.log('Task created:', task);
      setTasks([...tasks, task]);
      setNewTask({ title: '', dueDate: '', priority: 'medium' });
      setIsAdding(false);
    } catch (err: any) {
      console.error('Failed to create task:', err);
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading tasks...</div>;

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
