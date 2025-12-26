
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './RoleDashboard.module.css';
import {
  FileTextIcon,
  UsersIcon,
  BookOpenIcon,
  ClipboardIcon,
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

export default function StaffDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  void token; // keep token available for future API calls without unused warnings
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  void error; // suppress unused warning

  // Format schedule for readability
  const formatSchedule = (schedule?: any): string => {
    if (!schedule) return 'Schedule TBD';
    try {
      const parsed = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
      if (Array.isArray(parsed)) {
        return parsed
          .map((s: any) => {
            const days = Array.isArray(s?.days) ? s.days.join(', ') : (s?.day || '');
            const time = s?.startTime && s?.endTime ? `${s.startTime}-${s.endTime}` : '';
            return [days, time].filter(Boolean).join(' ');
          })
          .filter(Boolean)
          .join(' | ');
      }
    } catch {
      // fall back to raw string
    }
    return typeof schedule === 'string' ? schedule : 'Schedule TBD';
  };

  const loadCourses = async () => {
    if (!token || !user) return;
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/curriculum/my-courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load courses');
      const allCourses = await res.json();
      const normalized: Course[] = allCourses.map((c: any) => ({
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
    }
  };

  const loadDashboardData = async () => {
    if (!user?.id || !token) return;
    setLoading(true);
    setError(null);
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const headers = { 'Authorization': `Bearer ${token}` };

      const [tasksRes, submissionsRes] = await Promise.all([
        fetch(`${base}/api/staff-dashboard/tasks/${user.id}`, { headers }),
        fetch(`${base}/api/staff-dashboard/submissions/${user.id}`, { headers }),
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
        console.log('✅ Tasks loaded:', tasksData.length);
      } else {
        console.warn('❌ Failed to load tasks:', tasksRes.status);
        setTasks([]);
      }
      
      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        setRecentStudents(submissionsData);
        console.log('✅ Submissions loaded:', submissionsData.length);
      } else {
        console.warn('❌ Failed to load submissions:', submissionsRes.status);
        setRecentStudents([]);
      }
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
    void loadDashboardData();
  }, [token, user]);

  // Helpers for calculating dashboard stats
  const totalStudents = courses.reduce((sum: number, c: Course) => sum + (c.students || 0), 0);
  const pendingGrading = recentStudents.filter((s: Student) => s.grade === 'Pending').length;
  const highPriorityTasks = tasks.filter((t: Task) => t.priority === 'high').length;

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
          <p>You have {highPriorityTasks} high-priority tasks and {pendingGrading} assignments to grade.</p>
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
          <div className={`${styles.statIcon} ${styles.info}`}><ClipboardIcon size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{tasks.length}</div>
            <div className={styles.statTitle}>Total Tasks</div>
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
                  <button className={styles.smallBtn} onClick={() => {}}>View Class</button>
                  <button className={styles.smallBtn} onClick={() => {}}>Grades</button>
                  <button className={styles.smallBtn} onClick={() => {}}>Materials</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Student Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Recent Submissions</h2>
            <button className={styles.viewAllBtn} onClick={() => {}}>View All</button>
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
      </div>
    </div>
  );
}
