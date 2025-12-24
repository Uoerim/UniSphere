import React, { useState } from 'react';
import styles from '../../styles/pages.module.css';

const initialMessages = [
  { id: 1, from: 'John Smith', role: 'Student', subject: 'Project Help', content: 'Can you help me with the project?', time: '2025-12-23 14:00' },
  { id: 2, from: 'Emily Chen', role: 'Parent', subject: 'Progress Inquiry', content: 'How is my child doing in class?', time: '2025-12-22 09:30' },
  { id: 3, from: 'Dr. Brown', role: 'Staff', subject: 'Meeting Reminder', content: 'Don’t forget the department meeting tomorrow.', time: '2025-12-21 16:45' },
];

export default function Messages() {
  const [messages] = useState(initialMessages);
  const [selected, setSelected] = useState(null);

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Messages</h1>
          <p className={styles.pageSubtitle}>View messages from students, parents, and staff</p>
        </div>
      </div>
      <div className={styles.card} style={{ display: 'flex', minHeight: 400 }}>
        <div style={{ flex: 1, borderRight: '1px solid #f3f4f6', paddingRight: 24 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Inbox</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {messages.map(msg => (
              <li
                key={msg.id}
                onClick={() => setSelected(msg)}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  background: selected?.id === msg.id ? '#f8fafc' : 'transparent',
                  fontWeight: selected?.id === msg.id ? 700 : 400,
                }}
              >
                <div style={{ fontSize: 15 }}>{msg.subject}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{msg.from} ({msg.role})</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{msg.time}</div>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 2, paddingLeft: 24 }}>
          {selected ? (
            <div>
              <h2 style={{ marginBottom: 8 }}>{selected.subject}</h2>
              <div style={{ color: '#6b7280', marginBottom: 8 }}>
                From: {selected.from} ({selected.role})<br />
                Sent: {selected.time}
              </div>
              <div style={{ fontSize: 15 }}>{selected.content}</div>
            </div>
          ) : (
            <div style={{ color: '#9ca3af', fontSize: 16, marginTop: 40 }}>Select a message to view its content.</div>
          )}
        </div>
      </div>
    </div>
  );
}
