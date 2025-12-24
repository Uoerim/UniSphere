import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './RoleDashboard.module.css';

interface Course {
  id: string;
  name: string;
  code: string;
  students: number;
  schedule: string;
  room: string;
  registeredStudents: Student[];
}

interface Task {
  id: string;
  title: string;
  type: 'grading' | 'meeting' | 'preparation' | 'admin';
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface Student {
  id: string;
  name: string;
  course: string;
  lastSubmission: string;
  grade: string;
}

interface Message {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // Mock data - in production, fetch from API
    // Example students for each course
    const cs101Students: Student[] = [
      { id: '1', name: 'John Smith', course: 'CS101', lastSubmission: 'Project 3', grade: 'Pending' },
      { id: '3', name: 'Michael Brown', course: 'CS101', lastSubmission: 'Project 3', grade: 'Pending' },
      { id: '5', name: 'Anna Lee', course: 'CS101', lastSubmission: 'Quiz 2', grade: 'B' },
    ];
    const cs201Students: Student[] = [
      { id: '2', name: 'Emily Chen', course: 'CS201', lastSubmission: 'Assignment 5', grade: 'A' },
      { id: '6', name: 'David Kim', course: 'CS201', lastSubmission: 'Assignment 4', grade: 'A-' },
    ];
    const cs301Students: Student[] = [
      { id: '4', name: 'Sarah Davis', course: 'CS301', lastSubmission: 'Lab Report', grade: 'B+' },
      { id: '7', name: 'Liam Patel', course: 'CS301', lastSubmission: 'Lab 2', grade: 'A' },
    ];
    setCourses([
      { id: '1', name: 'Introduction to Programming', code: 'CS101', students: cs101Students.length, schedule: 'Mon/Wed 10:00 AM', room: 'Lab 102', registeredStudents: cs101Students },
      { id: '2', name: 'Data Structures', code: 'CS201', students: cs201Students.length, schedule: 'Tue/Thu 2:00 PM', room: 'Room 305', registeredStudents: cs201Students },
      { id: '3', name: 'Web Development', code: 'CS301', students: cs301Students.length, schedule: 'Mon/Wed 2:00 PM', room: 'Lab 104', registeredStudents: cs301Students },
    ]);

    setTasks([
      { id: '1', title: 'Grade CS101 Final Projects', type: 'grading', dueDate: '2025-12-26', priority: 'high' },
      { id: '2', title: 'Department Meeting', type: 'meeting', dueDate: '2025-12-24', priority: 'high' },
      { id: '3', title: 'Prepare Spring Syllabus', type: 'preparation', dueDate: '2025-12-30', priority: 'medium' },
      { id: '4', title: 'Submit Research Grant', type: 'admin', dueDate: '2026-01-05', priority: 'medium' },
      { id: '5', title: 'Review TA Applications', type: 'admin', dueDate: '2026-01-10', priority: 'low' },
    ]);

    setRecentStudents([
      { id: '1', name: 'John Smith', course: 'CS101', lastSubmission: 'Project 3', grade: 'Pending' },
      { id: '2', name: 'Emily Chen', course: 'CS201', lastSubmission: 'Assignment 5', grade: 'A' },
      { id: '3', name: 'Michael Brown', course: 'CS101', lastSubmission: 'Project 3', grade: 'Pending' },
      { id: '4', name: 'Sarah Davis', course: 'CS301', lastSubmission: 'Lab Report', grade: 'B+' },
    ]);

    setMessages([
      { id: '1', from: 'Dean Wilson', subject: 'Spring Semester Planning', preview: 'Please review the attached...', time: '2h ago', unread: true },
      { id: '2', from: 'Student - John Smith', subject: 'Question about Project', preview: 'Hi Professor, I had a question...', time: '4h ago', unread: true },
      { id: '3', from: 'HR Department', subject: 'Benefits Update', preview: 'Annual benefits enrollment...', time: 'Yesterday', unread: false },
    ]);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return styles.danger;
      case 'medium': return styles.warning;
      case 'low': return styles.info;
      default: return '';
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'grading': return '📝';
      case 'meeting': return '👥';
      case 'preparation': return '📚';
      case 'admin': return '📋';
      default: return '📌';
    }
  };

  const totalStudents = courses.reduce((sum, c) => sum + c.students, 0);
  const pendingGrading = recentStudents.filter(s => s.grade === 'Pending').length;
  const unreadMessages = messages.filter(m => m.unread).length;

  return (
    <div className={styles.container}>
      {/* Welcome Header */}
      <div className={`${styles.welcomeBanner} ${styles.staffBanner}`}>
        <div className={styles.welcomeContent}>
          <h1>Welcome, {user?.email?.split('@')[0] || 'Professor'}! 👨‍🏫</h1>
          <p>You have {tasks.filter(t => t.priority === 'high').length} high-priority tasks and {unreadMessages} unread messages.</p>
        </div>
        <div className={styles.welcomeStats}>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>{courses.length}</span>
            <span className={styles.statLabel}>Courses</span>
          </div>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>{totalStudents}</span>
            <span className={styles.statLabel}>Students</span>
          </div>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>{pendingGrading}</span>
            <span className={styles.statLabel}>To Grade</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <button className={`${styles.quickAction} ${styles.primary}`}>
          <span>📝</span> Grade Assignments
        </button>
        <button className={`${styles.quickAction} ${styles.secondary}`}>
          <span>📅</span> Schedule Class
        </button>
        <button className={`${styles.quickAction} ${styles.secondary}`}>
          <span>📢</span> Post Announcement
        </button>
        <button className={`${styles.quickAction} ${styles.secondary}`}>
          <span>📊</span> View Reports
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>📚</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{courses.length}</div>
            <div className={styles.statTitle}>Active Courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>👨‍🎓</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{totalStudents}</div>
            <div className={styles.statTitle}>Total Students</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>📝</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{pendingGrading}</div>
            <div className={styles.statTitle}>Pending Grades</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}>✉️</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{unreadMessages}</div>
            <div className={styles.statTitle}>Unread Messages</div>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* My Courses */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>📚 My Courses</h2>
            <button className={styles.viewAllBtn}>Manage Courses</button>
          </div>
          <div className={styles.courseList}>
            {courses.map(course => (
              <div key={course.id} className={styles.staffCourseItem}>
                <div className={styles.courseHeader}>
                  <span className={styles.courseCode}>{course.code}</span>
                  <span className={styles.studentCount}>👨‍🎓 {course.students}</span>
                </div>
                <div className={styles.courseName}>{course.name}</div>
                <div className={styles.courseDetails}>
                  <span>🕐 {course.schedule}</span>
                  <span>📍 {course.room}</span>
                </div>
                <div className={styles.courseActions}>
                  <button className={styles.smallBtn}>View Class</button>
                  <button className={styles.smallBtn}>Grades</button>
                  <button className={styles.smallBtn}>Materials</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>✅ Tasks & Deadlines</h2>
            <button className={styles.viewAllBtn}>All Tasks</button>
          </div>
          <div className={styles.taskList}>
            {tasks.map(task => (
              <div key={task.id} className={styles.taskItem}>
                <div className={styles.taskIcon}>{getTaskIcon(task.type)}</div>
                <div className={styles.taskContent}>
                  <div className={styles.taskTitle}>{task.title}</div>
                  <div className={styles.taskDue}>Due: {task.dueDate}</div>
                </div>
                <span className={`${styles.badge} ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Student Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>👨‍🎓 Recent Submissions</h2>
            <button className={styles.viewAllBtn}>View All</button>
          </div>
          <div className={styles.studentList}>
            {recentStudents.map(student => (
              <div key={student.id} className={styles.studentItem}>
                <div className={styles.studentAvatar}>
                  {student.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className={styles.studentInfo}>
                  <div className={styles.studentName}>{student.name}</div>
                  <div className={styles.studentMeta}>{student.course} • {student.lastSubmission}</div>
                </div>
                <span className={`${styles.badge} ${student.grade === 'Pending' ? styles.warning : styles.success}`}>
                  {student.grade}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>✉️ Messages</h2>
            <button className={styles.viewAllBtn}>Inbox</button>
          </div>
          <div className={styles.messageList}>
            {messages.map(message => (
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
    </div>
  );
}
