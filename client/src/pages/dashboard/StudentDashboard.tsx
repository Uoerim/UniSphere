import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpenIcon, FileTextIcon, CheckCircleIcon, TargetIcon, BellIcon, CalendarIcon, UserIcon, PinIcon } from '../../components/ui/Icons';
import styles from './RoleDashboard.module.css';

interface Course {
  id: string;
  name: string;
  code?: string;
  instructor?: any;
  schedule?: string;
  description?: string;
  isActive?: boolean;
  enrolledStudents?: number;
  [key: string]: any;
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
  const { user, token } = useAuth();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all courses
        const resAll = await fetch(`${import.meta.env.VITE_API_URL}/api/curriculum`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        });
        const all = await resAll.json();
        // Fetch enrolled courses
        const resEnrolled = await fetch(`${import.meta.env.VITE_API_URL}/api/curriculum/my-courses`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        });
        const enrolled = await resEnrolled.json();
        setAllCourses(all);
        setEnrolledCourses(enrolled);
      } catch (err: any) {
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchCourses();
    // Keep assignments and announcements as mock/demo for now
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
  }, [token]);

  // Helper to check if student is enrolled in a course
  const isEnrolled = (courseId: string) => enrolledCourses.some(c => c.id === courseId);

  // Register for a course
  const handleRegister = async (courseId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Enrolling in course:', courseId);
      // Get student entityId (from enrolledCourses or user)
      // Backend uses current user if not provided, so just call API
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/curriculum/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: null }) // null lets backend use current user
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to enroll');
      }
      console.log('Enrollment successful');
      // Refresh both enrolled and all courses
      const [resEnrolled, resAll] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/curriculum/my-courses`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        }),
        fetch(`${import.meta.env.VITE_API_URL}/api/curriculum`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        })
      ]);
      const enrolled = await resEnrolled.json();
      const all = await resAll.json();
      console.log('Updated enrolled courses:', enrolled);
      console.log('Updated all courses:', all);
      setEnrolledCourses(enrolled);
      setAllCourses(all);
    } catch (err: any) {
      console.error('Enrollment error:', err);
      setError(err.message || 'Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

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
          <h1>Welcome back, {user?.email?.split('@')[0] || 'Student'}!</h1>
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
          <div className={`${styles.statIcon} ${styles.primary}`}><BookOpenIcon size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{enrolledCourses.length}</div>
            <div className={styles.statTitle}>Enrolled Courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}><FileTextIcon size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{assignments.filter(a => a.status === 'pending').length}</div>
            <div className={styles.statTitle}>Pending Assignments</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}><CheckCircleIcon size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{assignments.filter(a => a.status === 'graded').length}</div>
            <div className={styles.statTitle}>Graded Work</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><TargetIcon size={20} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>68%</div>
            <div className={styles.statTitle}>Avg. Progress</div>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>

        {/* My Courses (enrolled) */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2><BookOpenIcon size={20} /> My Courses</h2>
          </div>
          <div className={styles.courseList}>
            {enrolledCourses.length === 0 ? (
              <div>No enrolled courses yet.</div>
            ) : (
              enrolledCourses.map(course => (
                <div key={course.id} className={styles.courseItem}>
                  <div className={styles.courseInfo}>
                    <div className={styles.courseCode}>{course.code || course.courseCode || 'N/A'}</div>
                    <div className={styles.courseName}>{course.name || course.courseName || 'Unnamed Course'}</div>
                    <div className={styles.courseDetails}>
                      <span><UserIcon size={14} /> {course.instructor?.name || course.instructor || 'N/A'}</span>
                      <span><CalendarIcon size={14} /> {course.schedule || 'TBD'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* All Courses (available for registration) */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2><FileTextIcon size={20} /> Register for Courses</h2>
          </div>
          <div className={styles.courseList}>
            {loading ? (
              <div>Loading courses...</div>
            ) : error ? (
              <div style={{ color: 'red' }}>{error}</div>
            ) : (
              allCourses.length === 0 ? (
                <div>No courses available.</div>
              ) : (
                allCourses.map(course => (
                  <div key={course.id} className={styles.courseItem}>
                    <div className={styles.courseInfo}>
                      <div className={styles.courseCode}>{course.code || course.courseCode || 'N/A'}</div>
                      <div className={styles.courseName}>{course.name || course.courseName || 'Unnamed Course'}</div>
                      <div className={styles.courseDetails}>
                        <span><UserIcon size={14} /> {course.instructor?.name || course.instructor || 'N/A'}</span>
                        <span><CalendarIcon size={14} /> {course.schedule || 'TBD'}</span>
                      </div>
                    </div>
                    <div>
                      {isEnrolled(course.id) ? (
                        <span style={{ color: 'green' }}>Enrolled</span>
                      ) : (
                        <button onClick={() => handleRegister(course.id)} style={{ marginLeft: 8 }}>
                          Register
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2><FileTextIcon size={20} /> Assignments</h2>
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

        {/* Today's Schedule - from enrolled courses */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2><CalendarIcon size={20} /> Today's Schedule</h2>
          </div>
          <div className={styles.scheduleList}>
            {enrolledCourses.length === 0 ? (
              <div>No enrolled courses with schedule.</div>
            ) : (
              enrolledCourses
                .filter(course => !!course.schedule)
                .map((course, idx, arr) => {
                  const conflicts = arr.filter((c, i) => i !== idx && c.schedule === course.schedule);
                  return (
                    <div key={course.id} className={styles.scheduleItem}>
                      <div className={styles.scheduleTime}>{course.schedule || 'TBD'}</div>
                      <div className={styles.scheduleContent}>
                        <div className={styles.scheduleTitle}>{course.name}</div>
                        <div className={styles.scheduleLocation}><PinIcon size={14} /> {course.room || 'TBD'}</div>
                        {conflicts.length > 0 && (
                          <div style={{ color: 'orange', fontWeight: 'bold', marginTop: 4 }}>
                            ⚠️ Schedule conflict with: {conflicts.map(c => c.name).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Announcements */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2><BellIcon size={20} /> Announcements</h2>
            <button className={styles.viewAllBtn}>View All</button>
          </div>
          <div className={styles.announcementList}>
            {announcements.map(announcement => (
              <div key={announcement.id} className={styles.announcementItem}>
                <div className={`${styles.announcementIcon} ${announcement.type === 'urgent' ? styles.urgent : ''}`}>
                  {announcement.type === 'urgent' ? <BellIcon size={16} /> : announcement.type === 'course' ? <BookOpenIcon size={16} /> : <PinIcon size={16} />}
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
