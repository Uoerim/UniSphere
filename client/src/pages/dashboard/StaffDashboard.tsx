
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './RoleDashboard.module.css';
import {
  FileTextIcon,
  UsersIcon,
  BookOpenIcon,
  ClipboardIcon,
  CalendarIcon,
  MegaphoneIcon,
  ChartIcon,
  MailIcon,
  ClockIcon,
  MapPinIcon
} from '../../components/ui/Icons';

// Types
interface Course {
  id: string;
  name: string;
  code?: string;
  students: number;
  schedule?: string;
  room?: string;
  capacity?: number;
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
  const { user, token } = useAuth();
  void token; // keep token available for future API calls without unused warnings
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatSchedule = (schedule?: string) => {
    if (!schedule) return 'Schedule TBD';
    try {
      const parsed = JSON.parse(schedule);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => {
          const days = Array.isArray(item.days) ? item.days.join(', ') : '';
          return `${days}${item.startTime && item.endTime ? `, ${item.startTime}–${item.endTime}` : ''}`;
        }).join(' | ');
      }
    } catch {
      // fall back to raw schedule string
    }
    return schedule;
  };

  useEffect(() => {
    const loadCourses = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/curriculum/my-courses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load courses');
        const data = await res.json();
        const normalized: Course[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          schedule: formatSchedule(c.schedule),
          room: c.room || 'TBD',
          capacity: c.capacity,
          students: c.enrolledStudents ?? 0,
        }));
        setCourses(normalized);
      } catch (err: any) {
        setError(err.message || 'Failed to load courses');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();

    setTasks([
      { id: '1', title: 'Grade CS101 Projects', type: 'grading', dueDate: '2025-12-26', priority: 'high' },
      { id: '2', title: 'Department Meeting', type: 'meeting', dueDate: '2025-12-24', priority: 'high' },
      { id: '3', title: 'Prepare Spring Syllabus', type: 'preparation', dueDate: '2025-12-30', priority: 'medium' },
      { id: '4', title: 'Submit Research Grant', type: 'admin', dueDate: '2026-01-05', priority: 'medium' },
      { id: '5', title: 'Review TA Applications', type: 'admin', dueDate: '2026-01-10', priority: 'low' },
    ]);
    setRecentStudents([]);
    setMessages([
      { id: '1', from: 'Dean Wilson', subject: 'Spring Planning', preview: 'Please review the attached...', time: '2h ago', unread: true },
      { id: '2', from: 'John Smith', subject: 'Question about Project', preview: 'Hi Professor, I had a question...', time: '4h ago', unread: true },
      { id: '3', from: 'HR', subject: 'Benefits Update', preview: 'Annual benefits enrollment...', time: 'Yesterday', unread: false },
    ]);
  }, [token]);

  // Helpers
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return styles.danger;
      case 'medium': return styles.warning;
      case 'low': return styles.info;
      default: return '';
    }
  };
  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'grading': return <FileTextIcon size={18} />;
      case 'meeting': return <UsersIcon size={18} />;
      case 'preparation': return <BookOpenIcon size={18} />;
      case 'admin': return <ClipboardIcon size={18} />;
      default: return <ClipboardIcon size={18} />;
    }
  };

  const totalStudents = courses.reduce((sum: number, c: Course) => sum + (c.students || 0), 0);
  const pendingGrading = recentStudents.filter((s: Student) => s.grade === 'Pending').length;
  const unreadMessages = messages.filter((m: Message) => m.unread).length;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your courses...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Welcome Header */}
      <div className={`${styles.welcomeBanner} ${styles.staffBanner}`}>
        <div className={styles.welcomeContent}>
          <h1>Welcome, {user?.email?.split('@')[0] || 'Professor'}</h1>
          <p>You have {tasks.filter((t: Task) => t.priority === 'high').length} high-priority tasks and {unreadMessages} unread messages.</p>
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
          <FileTextIcon size={16} /> Grade Assignments
        </button>
        <button className={`${styles.quickAction} ${styles.secondary}`}>
          <CalendarIcon size={16} /> Schedule Class
        </button>
        <button className={`${styles.quickAction} ${styles.secondary}`}>
          <MegaphoneIcon size={16} /> Post Announcement
        </button>
        <button className={`${styles.quickAction} ${styles.secondary}`}>
          <ChartIcon size={16} /> View Reports
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}><BookOpenIcon size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{courses.length}</div>
            <div className={styles.statTitle}>Active Courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}><UsersIcon size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{totalStudents}</div>
            <div className={styles.statTitle}>Total Students</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}><FileTextIcon size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{pendingGrading}</div>
            <div className={styles.statTitle}>Pending Grades</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><MailIcon size={24} /></div>
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
            <h2>My Courses</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/courses')}>Manage Courses</button>
          </div>
          <div className={styles.courseList}>
            {courses.length === 0 && (
              <div className={styles.emptyState}>
                <span>📚</span>
                <h3>No assigned courses yet</h3>
                <p>Assign an instructor to a course in Admin → Courses to see it here.</p>
              </div>
            )}
            {courses.map((course: Course) => (
              <div key={course.id} className={styles.staffCourseItem}>
                <div className={styles.courseHeader}>
                  <span className={styles.courseCode}>{course.code || '—'}</span>
                  <span className={styles.studentCount}>{course.students} students</span>
                </div>
                <div className={styles.courseName}>{course.name}</div>
                <div className={styles.courseDetails}>
                  <span><ClockIcon size={14} /> {course.schedule || 'Schedule TBD'}</span>
                  <span><MapPinIcon size={14} /> {course.room || 'Room TBD'}</span>
                </div>
                <div className={styles.courseActions}>
                  <button className={styles.smallBtn} onClick={() => navigate(`/class/${course.id}`)}>View Class</button>
                  <button className={styles.smallBtn} onClick={() => navigate(`/course-grades/${course.id}`)}>Grades</button>
                  <button className={styles.smallBtn} onClick={() => navigate(`/materials/${course.id}`)}>Materials</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Tasks & Deadlines</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/tasks')}>All Tasks</button>
          </div>
          <div className={styles.taskList}>
            {tasks.map((task: Task) => (
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
            <h2>Recent Submissions</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/submissions')}>View All</button>
          </div>
          <div className={styles.studentList}>
            {recentStudents.map((student: Student) => (
              <div key={student.id} className={styles.studentItem}>
                <div className={styles.studentAvatar}>
                  {student.name.split(' ').map((n) => n[0]).join('')}
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
            <h2>Messages</h2>
            <button className={styles.viewAllBtn} onClick={() => navigate('/messages')}>Inbox</button>
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
    </div>
  );
}
