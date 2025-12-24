import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './RoleDashboard.module.css';

interface Child {
  id: string;
  name: string;
  grade: string;
  attendance: number;
  gpa: number;
  avatar: string;
}

interface Grade {
  course: string;
  grade: string;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

interface Event {
  id: string;
  title: string;
  date: string;
  type: 'meeting' | 'event' | 'deadline';
}

interface Payment {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    // Mock data - in production, fetch from API
    const childrenData = [
      { id: '1', name: 'Alex Johnson', grade: '10th Grade', attendance: 95, gpa: 3.8, avatar: '👦' },
      { id: '2', name: 'Emma Johnson', grade: '7th Grade', attendance: 98, gpa: 3.9, avatar: '👧' },
    ];
    setChildren(childrenData);
    setSelectedChild(childrenData[0].id);

    setGrades([
      { course: 'Mathematics', grade: 'A', percentage: 92, trend: 'up' },
      { course: 'English', grade: 'A-', percentage: 88, trend: 'stable' },
      { course: 'Science', grade: 'B+', percentage: 85, trend: 'up' },
      { course: 'History', grade: 'A', percentage: 94, trend: 'up' },
      { course: 'Physical Education', grade: 'A', percentage: 96, trend: 'stable' },
    ]);

    setEvents([
      { id: '1', title: 'Parent-Teacher Conference', date: '2025-12-27', type: 'meeting' },
      { id: '2', title: 'Winter Concert', date: '2025-12-28', type: 'event' },
      { id: '3', title: 'Report Card Release', date: '2025-12-30', type: 'deadline' },
      { id: '4', title: 'Science Fair', date: '2026-01-10', type: 'event' },
    ]);

    setPayments([
      { id: '1', description: 'Spring Semester Tuition', amount: 5000, dueDate: '2026-01-15', status: 'pending' },
      { id: '2', description: 'Sports Equipment Fee', amount: 150, dueDate: '2025-12-20', status: 'paid' },
      { id: '3', description: 'Field Trip Fee', amount: 75, dueDate: '2025-12-28', status: 'pending' },
    ]);
  }, []);

  const currentChild = children.find(c => c.id === selectedChild) || children[0];

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return styles.success;
      case 'pending': return styles.warning;
      case 'overdue': return styles.danger;
      default: return '';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'meeting': return '👥';
      case 'event': return '🎉';
      case 'deadline': return '📋';
      default: return '📅';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  return (
    <div className={styles.container}>
      {/* Welcome Header */}
      <div className={`${styles.welcomeBanner} ${styles.parentBanner}`}>
        <div className={styles.welcomeContent}>
          <h1>Welcome, {user?.email?.split('@')[0] || 'Parent'}! 👨‍👩‍👧‍👦</h1>
          <p>Stay connected with your children's academic journey and school activities.</p>
        </div>
        <div className={styles.welcomeStats}>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>{children.length}</span>
            <span className={styles.statLabel}>Children</span>
          </div>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>{events.length}</span>
            <span className={styles.statLabel}>Upcoming Events</span>
          </div>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>{payments.filter(p => p.status === 'pending').length}</span>
            <span className={styles.statLabel}>Pending Payments</span>
          </div>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className={styles.childSelector}>
          {children.map(child => (
            <button
              key={child.id}
              className={`${styles.childTab} ${selectedChild === child.id ? styles.active : ''}`}
              onClick={() => setSelectedChild(child.id)}
            >
              <span className={styles.childAvatar}>{child.avatar}</span>
              <span className={styles.childName}>{child.name}</span>
              <span className={styles.childGrade}>{child.grade}</span>
            </button>
          ))}
        </div>
      )}

      {/* Child Overview Stats */}
      {currentChild && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.primary}`}>📊</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{currentChild.gpa}</div>
              <div className={styles.statTitle}>Current GPA</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.success}`}>✅</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{currentChild.attendance}%</div>
              <div className={styles.statTitle}>Attendance Rate</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.info}`}>📚</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>5</div>
              <div className={styles.statTitle}>Active Courses</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.warning}`}>🏆</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>3</div>
              <div className={styles.statTitle}>Achievements</div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* Academic Performance */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>📊 Academic Performance</h2>
            <button className={styles.viewAllBtn}>Full Report</button>
          </div>
          <div className={styles.gradeList}>
            {grades.map((grade, index) => (
              <div key={index} className={styles.gradeItem}>
                <div className={styles.gradeInfo}>
                  <div className={styles.courseName}>{grade.course}</div>
                  <div className={styles.gradeBar}>
                    <div 
                      className={styles.gradeFill} 
                      style={{ width: `${grade.percentage}%` }}
                    />
                  </div>
                </div>
                <div className={styles.gradeMeta}>
                  <span className={styles.gradeValue}>{grade.grade}</span>
                  <span className={styles.gradeTrend}>{getTrendIcon(grade.trend)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>📅 Upcoming Events</h2>
            <button className={styles.viewAllBtn}>View Calendar</button>
          </div>
          <div className={styles.eventList}>
            {events.map(event => (
              <div key={event.id} className={styles.eventItem}>
                <div className={styles.eventIcon}>{getEventIcon(event.type)}</div>
                <div className={styles.eventContent}>
                  <div className={styles.eventTitle}>{event.title}</div>
                  <div className={styles.eventDate}>
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <button className={styles.eventAction}>View</button>
              </div>
            ))}
          </div>
        </div>

        {/* Payments */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>💳 Payments & Fees</h2>
            <button className={styles.viewAllBtn}>Payment History</button>
          </div>
          <div className={styles.paymentList}>
            {payments.map(payment => (
              <div key={payment.id} className={styles.paymentItem}>
                <div className={styles.paymentInfo}>
                  <div className={styles.paymentTitle}>{payment.description}</div>
                  <div className={styles.paymentDue}>Due: {payment.dueDate}</div>
                </div>
                <div className={styles.paymentMeta}>
                  <span className={styles.paymentAmount}>${payment.amount}</span>
                  <span className={`${styles.badge} ${getPaymentStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className={`${styles.actionBtn} ${styles.primary}`} style={{ marginTop: '16px', width: '100%' }}>
            Make Payment
          </button>
        </div>

        {/* Communication */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>💬 Communication</h2>
          </div>
          <div className={styles.communicationOptions}>
            <button className={styles.commOption}>
              <span className={styles.commIcon}>✉️</span>
              <span>Message Teacher</span>
            </button>
            <button className={styles.commOption}>
              <span className={styles.commIcon}>📞</span>
              <span>Schedule Call</span>
            </button>
            <button className={styles.commOption}>
              <span className={styles.commIcon}>📋</span>
              <span>Request Meeting</span>
            </button>
            <button className={styles.commOption}>
              <span className={styles.commIcon}>📄</span>
              <span>View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
