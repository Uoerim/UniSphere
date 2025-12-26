import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/api/staff-dashboard/messages/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [user?.id, token]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading messages...</div>;

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
