import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './RoleDashboard.module.css';

interface Course {
  id: string;
  name: string;
  code: string;
  instructor: string;
  schedule: string;
  progress: number;
}

interface Assignment {
  id: string;
  title: string;
  course: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'general' | 'course' | 'urgent';
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // Mock data for demo - in production, fetch from API
    setCourses([
      { id: '1', name: 'Introduction to Programming', code: 'CS101', instructor: 'Dr. Smith', schedule: 'Mon/Wed 10:00 AM', progress: 75 },
      { id: '2', name: 'Calculus I', code: 'MATH201', instructor: 'Prof. Johnson', schedule: 'Tue/Thu 2:00 PM', progress: 60 },
      { id: '3', name: 'Physics Fundamentals', code: 'PHY101', instructor: 'Dr. Williams', schedule: 'Mon/Wed/Fri 9:00 AM', progress: 45 },
      { id: '4', name: 'English Composition', code: 'ENG101', instructor: 'Ms. Davis', schedule: 'Tue/Thu 11:00 AM', progress: 90 },
    ]);

    setAssignments([
      { id: '1', title: 'Programming Project 3', course: 'CS101', dueDate: '2025-12-26', status: 'pending' },
      { id: '2', title: 'Calculus Problem Set 5', course: 'MATH201', dueDate: '2025-12-25', status: 'pending' },
      { id: '3', title: 'Lab Report 4', course: 'PHY101', dueDate: '2025-12-24', status: 'submitted' },
      { id: '4', title: 'Essay Draft', course: 'ENG101', dueDate: '2025-12-20', status: 'graded', grade: 'A-' },
    ]);

    setAnnouncements([
      { id: '1', title: 'Winter Break Schedule', content: 'Campus will be closed from Dec 25 to Jan 2', date: '2025-12-23', type: 'general' },
      { id: '2', title: 'CS101 Final Exam', content: 'Final exam will be held on Jan 5, Room 302', date: '2025-12-22', type: 'course' },
      { id: '3', title: 'Library Extended Hours', content: 'Library open 24/7 during finals week', date: '2025-12-21', type: 'general' },
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return styles.warning;
      case 'submitted': return styles.info;
      case 'graded': return styles.success;
      default: return '';
    }
  };

  const getDaysUntil = (date: string) => {
    const diff = Math.ceil((new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due Today';
    if (diff === 1) return 'Due Tomorrow';
    return `${diff} days left`;
  };

  return (
    <div className={styles.container}>
      {/* Welcome Header */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <h1>Welcome back, {user?.email?.split('@')[0] || 'Student'}! 📚</h1>
          <p>Keep up the great work! You're making excellent progress this semester.</p>
        </div>
        <div className={styles.welcomeStats}>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>4</span>
            <span className={styles.statLabel}>Active Courses</span>
          </div>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>3.7</span>
            <span className={styles.statLabel}>Current GPA</span>
          </div>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>2</span>
            <span className={styles.statLabel}>Pending Tasks</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>📖</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{courses.length}</div>
            <div className={styles.statTitle}>Enrolled Courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>📝</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{assignments.filter(a => a.status === 'pending').length}</div>
            <div className={styles.statTitle}>Pending Assignments</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>✅</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{assignments.filter(a => a.status === 'graded').length}</div>
            <div className={styles.statTitle}>Graded Work</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}>🎯</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>68%</div>
            <div className={styles.statTitle}>Avg. Progress</div>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* My Courses */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>📚 My Courses</h2>
            <button className={styles.viewAllBtn}>View All</button>
          </div>
          <div className={styles.courseList}>
            {courses.map(course => (
              <div key={course.id} className={styles.courseItem}>
                <div className={styles.courseInfo}>
                  <div className={styles.courseCode}>{course.code}</div>
                  <div className={styles.courseName}>{course.name}</div>
                  <div className={styles.courseDetails}>
                    <span>👨‍🏫 {course.instructor}</span>
                    <span>🕐 {course.schedule}</span>
                  </div>
                </div>
                <div className={styles.progressSection}>
                  <div className={styles.progressLabel}>Progress</div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill} 
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <div className={styles.progressValue}>{course.progress}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>📝 Assignments</h2>
            <button className={styles.viewAllBtn}>View All</button>
          </div>
          <div className={styles.assignmentList}>
            {assignments.map(assignment => (
              <div key={assignment.id} className={styles.assignmentItem}>
                <div className={styles.assignmentInfo}>
                  <div className={styles.assignmentTitle}>{assignment.title}</div>
                  <div className={styles.assignmentCourse}>{assignment.course}</div>
                </div>
                <div className={styles.assignmentMeta}>
                  <span className={`${styles.badge} ${getStatusColor(assignment.status)}`}>
                    {assignment.status === 'graded' ? `Graded: ${assignment.grade}` : assignment.status}
                  </span>
                  <span className={styles.dueDate}>
                    {getDaysUntil(assignment.dueDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>📅 Today's Schedule</h2>
          </div>
          <div className={styles.scheduleList}>
            <div className={styles.scheduleItem}>
              <div className={styles.scheduleTime}>9:00 AM</div>
              <div className={styles.scheduleContent}>
                <div className={styles.scheduleTitle}>Physics Fundamentals</div>
                <div className={styles.scheduleLocation}>📍 Room 201, Science Building</div>
              </div>
            </div>
            <div className={styles.scheduleItem}>
              <div className={styles.scheduleTime}>10:00 AM</div>
              <div className={styles.scheduleContent}>
                <div className={styles.scheduleTitle}>Introduction to Programming</div>
                <div className={styles.scheduleLocation}>📍 Lab 102, Computer Center</div>
              </div>
            </div>
            <div className={styles.scheduleItem}>
              <div className={styles.scheduleTime}>2:00 PM</div>
              <div className={styles.scheduleContent}>
                <div className={styles.scheduleTitle}>Study Group - Calculus</div>
                <div className={styles.scheduleLocation}>📍 Library, Floor 2</div>
              </div>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>📢 Announcements</h2>
            <button className={styles.viewAllBtn}>View All</button>
          </div>
          <div className={styles.announcementList}>
            {announcements.map(announcement => (
              <div key={announcement.id} className={styles.announcementItem}>
                <div className={`${styles.announcementIcon} ${announcement.type === 'urgent' ? styles.urgent : ''}`}>
                  {announcement.type === 'urgent' ? '🔔' : announcement.type === 'course' ? '📖' : '📌'}
                </div>
                <div className={styles.announcementContent}>
                  <div className={styles.announcementTitle}>{announcement.title}</div>
                  <div className={styles.announcementText}>{announcement.content}</div>
                  <div className={styles.announcementDate}>{announcement.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
