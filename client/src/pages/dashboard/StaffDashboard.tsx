
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './RoleDashboard.module.css';

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
          <h1>Welcome, {user?.email?.split('@')[0] || 'Professor'}! 👨‍🏫</h1>
          <p>Manage your courses and track student progress.</p>
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
      </div>

      <div className={styles.mainGrid}>
        {/* My Courses */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>📚 My Courses</h2>
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
                  <span className={styles.studentCount}>👨‍🎓 {course.students}</span>
                </div>
                <div className={styles.courseName}>{course.name}</div>
                <div className={styles.courseDetails}>
                  <span>🕐 {formatSchedule(course.schedule)}</span>
                  <span>📍 {course.room || 'Room TBD'}</span>
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

        {/* Recent Student Activity */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>👨‍🎓 Recent Submissions</h2>
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
      </div>
    </div>
  );
}
