
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
interface Student {
  id: string;
  name: string;
  course: string;
  lastSubmission: string;
  grade: string;
}

export default function StaffDashboard() {
  const { user, token } = useAuth();
  void token; // keep token available for future API calls without unused warnings
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayName = (abbr: string) => {
    const map: Record<string, string> = {
      Su: 'Sunday', Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday'
    };
    return map[abbr] || abbr;
  };

  const formatSchedule = (schedule?: string) => {
    if (!schedule) return 'Schedule TBD';

    const stringify = (value: unknown) => {
      if (Array.isArray(value)) {
        return value
          .map((item: any) => {
            if (!item) return '';
            const days = Array.isArray(item.days) ? item.days.map(dayName).join(', ') : '';
            const time = item.startTime && item.endTime ? `${item.startTime}–${item.endTime}` : '';
            return [days, time].filter(Boolean).join(' ');
          })
          .filter(Boolean)
          .join(' | ');
      }
      return '';
    };

    try {
      const parsed = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
      const formatted = stringify(parsed);
      if (formatted) return formatted;
    } catch {
      // fall back to raw schedule string
    }

    return schedule;
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      setError(null);
      try {
        // Fetch courses using the same method as StaffCourses page
        console.log('Fetching courses for user:', user.id);
        const coursesRes = await fetch('http://localhost:4000/api/curriculum', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Courses response status:', coursesRes.status);
        if (coursesRes.ok) {
          const allCourses = await coursesRes.json();
          // Filter courses where this staff member is the instructor
          const myCourses = allCourses.filter((course: any) => 
            course.instructor?.accountId === user?.id || 
            course.instructor?.email === user?.email
          );
          console.log('My courses filtered:', myCourses);
          // Transform to match dashboard format
          const formattedCourses = myCourses.map((course: any) => ({
            id: course.id,
            name: course.name,
            code: course.code,
            students: course.enrolledStudents || 0,
            schedule: course.schedule,
            room: course.room,
            capacity: course.capacity
          }));
          setCourses(formattedCourses);
        } else {
          console.error('Failed to fetch courses:', await coursesRes.text());
        }

        // Fetch submissions (recent student grades)
        const submissionsRes = await fetch(`http://localhost:4000/api/staff-dashboard/submissions/${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (submissionsRes.ok) {
          const submissionsData = await submissionsRes.json();
          setRecentStudents(submissionsData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id, token]);

  // Helpers
<<<<<<< HEAD
  const formatSchedule = (schedule: string | undefined) => {
    if (!schedule) return 'Schedule TBD';
    
    try {
      const data = JSON.parse(schedule);
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const dayMap: { [key: string]: string } = {
          'M': 'Monday', 'Tu': 'Tuesday', 'W': 'Wednesday', 
          'Th': 'Thursday', 'F': 'Friday', 'Sa': 'Saturday', 'Su': 'Sunday'
        };
        
        const formatTime = (time: string) => {
          const [hours, minutes] = time.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'pm' : 'am';
          const displayHour = hour % 12 || 12;
          return `${displayHour}:${minutes} ${ampm}`;
        };
        
        const days = item.days?.map((d: string) => dayMap[d] || d).join(', ') || 'TBD';
        const startTime = item.startTime ? formatTime(item.startTime) : '';
        const endTime = item.endTime ? formatTime(item.endTime) : '';
        
        return `${days} ${startTime}${endTime ? ` - ${endTime}` : ''}`;
      }
    } catch (e) {
      return schedule;
=======
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
>>>>>>> 006b741518276120c0aeb13a620e031c853bf89e
    }
    return 'Schedule TBD';
  };

  const totalStudents = courses.reduce((sum: number, c: Course) => sum + (c.students || 0), 0);
  const pendingGrading = recentStudents.filter((s: Student) => s.grade === 'Pending').length;

  console.log('Dashboard render - courses state:', courses);
  console.log('Dashboard render - courses.length:', courses.length);

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
<<<<<<< HEAD
          <h1>Welcome, {user?.email?.split('@')[0] || 'Professor'}! 👨‍🏫</h1>
          <p>Manage your courses and track student progress.</p>
=======
          <h1>Welcome, {user?.email?.split('@')[0] || 'Professor'}</h1>
          <p>You have {tasks.filter((t: Task) => t.priority === 'high').length} high-priority tasks and {unreadMessages} unread messages.</p>
>>>>>>> 006b741518276120c0aeb13a620e031c853bf89e
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
<<<<<<< HEAD
=======
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><MailIcon size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{unreadMessages}</div>
            <div className={styles.statTitle}>Unread Messages</div>
          </div>
        </div>
>>>>>>> 006b741518276120c0aeb13a620e031c853bf89e
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
<<<<<<< HEAD
                  <span>🕐 {formatSchedule(course.schedule)}</span>
                  <span>📍 {course.room || 'Room TBD'}</span>
=======
                  <span><ClockIcon size={14} /> {course.schedule || 'Schedule TBD'}</span>
                  <span><MapPinIcon size={14} /> {course.room || 'Room TBD'}</span>
>>>>>>> 006b741518276120c0aeb13a620e031c853bf89e
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

<<<<<<< HEAD
=======
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

>>>>>>> 006b741518276120c0aeb13a620e031c853bf89e
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
<<<<<<< HEAD
=======

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
>>>>>>> 006b741518276120c0aeb13a620e031c853bf89e
      </div>
    </div>
  );
}
