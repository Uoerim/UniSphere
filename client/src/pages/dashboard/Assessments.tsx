
import React, { useState } from 'react';
import styles from '../../styles/pages.module.css';

function AssessmentTable({ title, items, onAdd, onEdit, onRemove }) {
  const [newItem, setNewItem] = useState('');
  return (
    <div className={styles.card} style={{ marginBottom: 32 }}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{title}</span>
        <div>
          <input
            type="text"
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            placeholder={`Add new ${title.slice(0, -1).toLowerCase()}`}
            style={{ marginRight: 8, padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
          />
          <button
            className={`${styles.actionBtn} ${styles.primary}`}
            onClick={() => {
              if (newItem.trim()) {
                onAdd(newItem);
                setNewItem('');
              }
            }}
          >Add</button>
        </div>
      </div>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '70%' }}>Name</th>
              <th style={{ width: '30%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={2} style={{ textAlign: 'center', color: '#9ca3af' }}>No {title.toLowerCase()} yet.</td></tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      value={item}
                      onChange={e => onEdit(idx, e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14 }}
                    />
                  </td>
                  <td>
                    <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => onRemove(idx)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Assessments() {
  const [assignments, setAssignments] = useState(["Assignment 1", "Assignment 2"]);
  const [quizzes, setQuizzes] = useState(["Quiz 1"]);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Assessments</h1>
          <p className={styles.pageSubtitle}>Manage assignments and quizzes for your courses</p>
        </div>
      </div>
      <AssessmentTable
        title="Assignments"
        items={assignments}
        onAdd={item => setAssignments([...assignments, item])}
        onEdit={(idx, val) => setAssignments(assignments.map((a, i) => i === idx ? val : a))}
        onRemove={idx => setAssignments(assignments.filter((_, i) => i !== idx))}
      />
      <AssessmentTable
        title="Quizzes"
        items={quizzes}
        onAdd={item => setQuizzes([...quizzes, item])}
        onEdit={(idx, val) => setQuizzes(quizzes.map((q, i) => i === idx ? val : q))}
        onRemove={idx => setQuizzes(quizzes.filter((_, i) => i !== idx))}
      />
    </div>
  );
}
