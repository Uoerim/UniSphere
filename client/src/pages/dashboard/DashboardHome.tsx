import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UsersIcon, UserIcon, BookOpenIcon, CalendarIcon, ZapIcon, CpuIcon, CodeIcon, MailIcon, PhoneIcon, PartyIcon, MoreVerticalIcon, GamepadIcon } from '../../components/ui/Icons';
import styles from './DashboardHome.module.css';

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalCourses: number;
  totalEvents: number;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalStaff: 0,
    totalCourses: 0,
    totalEvents: 0,
  });
  const [activeTab, setActiveTab] = useState('All lessons');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const chartData = [85.3, 64.7, 84.2, 45.6, 43.5, 74.4];
  const chartLabels = ['Algorithms', 'Object program.', 'Database program.', 'Web develop.', 'Mobile application', 'Machine learning'];

  const scheduleItems = [
    { name: 'Electronics lesson', time: '9:45 - 10:30, 21 lesson', color: 'blue', icon: <ZapIcon size={16} /> },
    { name: 'Electronics lesson', time: '11:00 - 11:40, 23 lesson', color: 'blue', icon: <ZapIcon size={16} /> },
    { name: 'Robotics lesson', time: '12:00 - 12:45, 23 lesson', color: 'green', icon: <CpuIcon size={16} /> },
    { name: 'C++ lesson', time: '13:45 - 14:30, 21 lesson', color: 'orange', icon: <CodeIcon size={16} /> },
  ];

  const subjectScores = [
    { score: 92, name: 'Algorithms structures', level: 'high' },
    { score: 83, name: 'Object program.', level: 'high' },
    { score: 78, name: 'Database program.', level: 'medium' },
    { score: 97, name: 'Web develop.', level: 'high' },
    { score: 96, name: 'Mobile application', level: 'high' },
    { score: 89, name: 'Machine learning', level: 'high' },
  ];

  const teachers = [
    { name: 'Mary Johnson', role: 'Science (mentor)', initials: 'MJ' },
    { name: 'James Brown', role: 'Foreign language (Chinese)', initials: 'JB' },
  ];

  const events = [
    { title: 'The main event in your life "Robot Fest" will coming soon in...', date: '14 December 2023', time: '12:00 pm', icon: <CpuIcon size={24} /> },
    { title: 'Webinar of new tools in Minecraft', date: '21 December 2023', time: '11:00 pm', icon: <GamepadIcon size={24} /> },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <div className={styles.container}>
      {/* Welcome Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <h1>Hello {userName.charAt(0).toUpperCase() + userName.slice(1)}!</h1>
          <p>You have <strong>3 new tasks</strong> & It is a lot of work for today! So let's start</p>
          <span className={styles.welcomeLink}>review it!</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}><UsersIcon size={24} /></div>
          <div className={styles.statContent}>
            <h3>{stats.totalStudents || 1247}</h3>
            <p>Total Students</p>
            <span className={`${styles.statTrend} ${styles.up}`}>↑ 12% from last month</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}><UserIcon size={24} /></div>
          <div className={styles.statContent}>
            <h3>{stats.totalStaff || 84}</h3>
            <p>Total Staff</p>
            <span className={`${styles.statTrend} ${styles.up}`}>↑ 3% from last month</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}><BookOpenIcon size={24} /></div>
          <div className={styles.statContent}>
            <h3>{stats.totalCourses || 56}</h3>
            <p>Active Courses</p>
            <span className={`${styles.statTrend} ${styles.up}`}>↑ 8% from last month</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><PartyIcon size={24} /></div>
          <div className={styles.statContent}>
            <h3>{stats.totalEvents || 12}</h3>
            <p>Upcoming Events</p>
            <span className={`${styles.statTrend} ${styles.down}`}>↓ 2% from last month</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Performance Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Performance</span>
            <span className={styles.cardAction}>December ▾</span>
          </div>
          
          <div className={styles.performanceHeader}>
            <div>
              <div className={styles.performanceScore}>95.4</div>
              <div className={styles.performanceLabel}>
                <strong>The best lessons:</strong>
                Introduction to Programming
              </div>
            </div>
            <div className={styles.tabButtons}>
              {['All lessons'].map((tab) => (
                <button
                  key={tab}
                  className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.chartContainer}>
            {chartData.map((value, index) => (
              <div
                key={index}
                className={styles.chartBar}
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
          <div className={styles.chartLabels}>
            {chartLabels.map((label, index) => (
              <span key={index} className={styles.chartLabel}>{label}</span>
            ))}
          </div>

          <div className={styles.subjectGrid}>
            {subjectScores.slice(0, 6).map((subject, index) => (
              <div key={index} className={styles.subjectCard}>
                <div className={`${styles.subjectScore} ${styles[subject.level]}`}>
                  {subject.score}%
                </div>
                <div className={styles.subjectName}>{subject.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar & Schedule Card */}
        <div className={styles.card}>
          <div className={styles.calendar}>
            <div className={styles.calendarHeader}>
              <span className={styles.calendarTitle}>Calendar</span>
              <div className={styles.calendarNav}>
                <button className={styles.calendarNavBtn}>Today ▾</button>
              </div>
            </div>
            <div className={styles.eventsLabel}>6 events today</div>
          </div>

          <div className={styles.scheduleList}>
            {scheduleItems.map((item, index) => (
              <div key={index} className={`${styles.scheduleItem} ${styles[item.color]}`}>
                <div className={styles.scheduleIcon}>{item.icon}</div>
                <div className={styles.scheduleInfo}>
                  <div className={styles.scheduleName}>{item.name}</div>
                  <div className={styles.scheduleTime}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className={styles.bottomGrid}>
        {/* Linked Teachers */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Linked Teachers</span>
            <span className={styles.cardAction}>See all</span>
          </div>
          {teachers.map((teacher, index) => (
            <div key={index} className={styles.listItem}>
              <div className={styles.listAvatar}>{teacher.initials}</div>
              <div className={styles.listInfo}>
                <div className={styles.listName}>{teacher.name}</div>
                <div className={styles.listRole}>{teacher.role}</div>
              </div>
              <div className={styles.listActions}>
                <button className={styles.listActionBtn}><MailIcon size={16} /></button>
                <button className={styles.listActionBtn}><PhoneIcon size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>Upcoming events</span>
            <span className={styles.cardAction}>See all</span>
          </div>
          {events.map((event, index) => (
            <div key={index} className={styles.eventItem}>
              <div className={styles.eventImage}>{event.icon}</div>
              <div className={styles.eventInfo}>
                <div className={styles.eventTitle}>{event.title}</div>
                <div className={styles.eventMeta}>
                  <CalendarIcon size={14} /> {event.date} • {event.time}
                </div>
              </div>
              <div className={styles.eventActions}>
                <button className={styles.eventMoreBtn}><MoreVerticalIcon size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
