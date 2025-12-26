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

interface CourseGrade extends Course {
  enrollmentId?: string;
  grade?: string;
  attendance?: number;
  status?: 'active' | 'dropped';
  enrolledAt?: string;
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

// Format schedule objects/JSON into readable text (e.g., Mon, Wed 10:30-12:00)
const formatSchedule = (schedule: any): string => {
  if (!schedule) return 'N/A';

  const dayMap: Record<string, string> = {
    Mo: 'Mon', Tu: 'Tue', We: 'Wed', Th: 'Thu', Fr: 'Fri', Sa: 'Sat', Su: 'Sun',
    Mon: 'Mon', Tue: 'Tue', Wed: 'Wed', Thu: 'Thu', Fri: 'Fri', Sat: 'Sat', Sun: 'Sun',
  };

  const formatSlot = (slot: any) => {
    const days = Array.isArray(slot?.days) ? slot.days.map((d: string) => dayMap[d] || d).join(', ') : '';
    const time = slot?.startTime && slot?.endTime ? `${slot.startTime}-${slot.endTime}` : '';
    return [days, time].filter(Boolean).join(' ');
  };

  try {
    const parsed = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
    if (Array.isArray(parsed)) {
      const slots = parsed.map(formatSlot).filter(Boolean);
      return slots.length ? slots.join(' | ') : 'N/A';
    }
    if (parsed && typeof parsed === 'object') {
      const slot = formatSlot(parsed);
      return slot || 'N/A';
    }
  } catch (_) {
    // fall back to raw string if parsing fails
  }

  return typeof schedule === 'string' ? schedule : 'N/A';
};
export default function StudentDashboard() {
  const { user, token } = useAuth();
  const apiBase = (import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:4000/api');
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [courseGrades, setCourseGrades] = useState<CourseGrade[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [gpa, setGpa] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const resEnrolled = await fetch(`${apiBase}/curriculum/my-courses`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        });
        if (!resEnrolled.ok) throw new Error(`Failed to fetch enrolled courses: ${resEnrolled.status}`);
        const enrolled = await resEnrolled.json();
        setEnrolledCourses(enrolled || []);
      } catch (err: any) {
        console.error('Course fetch error:', err);
      }
    };
    const fetchProfile = async () => {
      try {
        const resProfile = await fetch(`${apiBase}/students/me`, {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        });
        if (resProfile.ok) {
          const profile = await resProfile.json();
          setGpa(profile?.gpa ?? null);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    };
       if (token) {
         fetchCourses();
         fetchProfile();
         const fetchGrades = async () => {
           try {
             const resGrades = await fetch(`${apiBase}/students/me/courses`, {
               headers: { 'Authorization': token ? `Bearer ${token}` : '' },
             });
             if (!resGrades.ok) throw new Error(`Failed to fetch course grades: ${resGrades.status}`);
             const grades = await resGrades.json();
             setCourseGrades(grades || []);
           } catch (err: any) {
             console.error('Grades fetch error:', err);
           }
         };
         fetchGrades();
         
         // Fetch real assignments
         const fetchAssignments = async () => {
           try {
             const resAssignments = await fetch(`${apiBase}/assignments`, {
               headers: { 'Authorization': token ? `Bearer ${token}` : '' },
             });
             if (!resAssignments.ok) throw new Error(`Failed to fetch assignments: ${resAssignments.status}`);
             const assignmentsData = await resAssignments.json();
             
             // Transform backend data to match the Assignment interface
             const transformedAssignments = assignmentsData.map((a: any) => ({
               id: a.id,
               title: a.title || a.name || 'Untitled Assignment',
               course: a.course?.code || a.course?.name || 'N/A',
               dueDate: a.dueDate || a.deadline || '',
               status: a.status?.toLowerCase() === 'published' ? 'pending' : 
                       a.status?.toLowerCase() === 'closed' ? 'submitted' : 'pending',
               grade: a.grade
             }));
             setAssignments(transformedAssignments);
           } catch (err: any) {
             console.error('Assignments fetch error:', err);
             // Keep empty array on error
             setAssignments([]);
           }
         };
         fetchAssignments();
         
         // Fetch real announcements
         const fetchAnnouncements = async () => {
           try {
             const resAnnouncements = await fetch(`${apiBase}/community/announcements`, {
               headers: { 'Authorization': token ? `Bearer ${token}` : '' },
             });
             if (!resAnnouncements.ok) throw new Error(`Failed to fetch announcements: ${resAnnouncements.status}`);
             const announcementsData = await resAnnouncements.json();
             
             // Transform backend data to match the Announcement interface
             const transformedAnnouncements = announcementsData.map((a: any) => ({
               id: a.id,
               title: a.title || 'Untitled Announcement',
               content: a.content || a.message || '',
               date: a.createdAt || a.date || new Date().toISOString(),
               type: a.type?.toLowerCase() || 'general'
             }));
             setAnnouncements(transformedAnnouncements.slice(0, 3)); // Show only 3 most recent
           } catch (err: any) {
             console.error('Announcements fetch error:', err);
             setAnnouncements([]);
           }
         };
         fetchAnnouncements();
       }
  }, [token]);

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

  // Calculate average progress from course grades
  const calculateAvgProgress = () => {
    if (courseGrades.length === 0) return '—';
    
    const gradesWithScores = courseGrades.filter(c => c.grade);
    if (gradesWithScores.length === 0) return '—';
    
    // Convert letter grades to percentages (approximate)
    const gradeToPercent = (grade: string): number => {
      const g = grade.replace(/[+-]/g, '').toUpperCase();
      const map: Record<string, number> = {
        'A': 95, 'B': 85, 'C': 75, 'D': 65, 'F': 50
      };
      return map[g] || 0;
    };
    
    const total = gradesWithScores.reduce((sum, c) => sum + gradeToPercent(c.grade || ''), 0);
    const avg = Math.round(total / gradesWithScores.length);
    return `${avg}%`;
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
            <span className={styles.statNumber}>{enrolledCourses.length}</span>
            <span className={styles.statLabel}>Active Courses</span>
          </div>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>{gpa ?? '—'}</span>
            <span className={styles.statLabel}>Current GPA</span>
          </div>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>{assignments.filter(a => a.status === 'pending').length}</span>
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
            <div className={styles.statValue}>{calculateAvgProgress()}</div>
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
                    <div className={styles.courseCode}>{course.code || 'N/A'}</div>
                    <div className={styles.courseName}>{course.name || course.courseName || 'Unnamed Course'}</div>
                    {course.department && (
                      <div className={styles.courseDepartment} style={{fontSize: '0.85rem', color: '#666', marginTop: '2px'}}>
                        📚 {course.department}
                      </div>
                    )}
                    <div className={styles.courseDetails}>
                      <span><UserIcon size={14} /> {course.instructor?.name || course.instructor || 'N/A'}</span>
                      <span><CalendarIcon size={14} /> {formatSchedule(course.schedule)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2><FileTextIcon size={20} /> Assignments</h2>
            <button className={styles.viewAllBtn} onClick={() => window.location.href = '/assignments'}>View All</button>
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
                      <div className={styles.scheduleTime}>{formatSchedule(course.schedule) || 'TBD'}</div>
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
            <button className={styles.viewAllBtn} onClick={() => window.location.href = '/announcements'}>View All</button>
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
