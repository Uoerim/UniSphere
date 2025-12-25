import { useState } from 'react';
import styles from './RoleDashboard.module.css';

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
}

export default function Messages() {
  const [messages] = useState<Message[]>([
    { id: '1', from: 'Dean Wilson', subject: 'Spring Planning', preview: 'Please review the attached...', time: '2h ago', unread: true },
    { id: '2', from: 'John Smith', subject: 'Question about Project', preview: 'Hi Professor, I had a question...', time: '4h ago', unread: true },
    { id: '3', from: 'HR', subject: 'Benefits Update', preview: 'Annual benefits enrollment...', time: 'Yesterday', unread: false },
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>✉️ Messages</h2>
        </div>
        <div className={styles.messageList}>
          {messages.map((message: Message) => (
            <div key={message.id} className={`${styles.messageItem} ${message.unread ? styles.unread : ''}`}>
              <div className={styles.messageContent}>
                <div className={styles.messageFrom}>{message.from}</div>
                <div className={styles.messageSubject}>{message.subject}</div>
                <div className={styles.messagePreview}>{message.preview}</div>
              </div>
              <div className={styles.messageTime}>{message.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
