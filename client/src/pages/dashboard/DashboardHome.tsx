import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  UsersIcon, UserIcon, BookOpenIcon, CalendarIcon, 
  BuildingIcon, ClipboardIcon, FileTextIcon, MegaphoneIcon,
  TrendingUpIcon, ActivityIcon, BookIcon
} from '../../components/ui/Icons';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import styles from './DashboardHome.module.css';

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalParents: number;
  totalCourses: number;
  activeCourses: number;
  totalEvents: number;
  totalDepartments: number;
  totalRooms: number;
  totalAssessments: number;
  totalAssignments: number;
  totalAnnouncements: number;
  totalUsers: number;
  entityDistribution: { type: string; count: number }[];
  userDistribution: { role: string; count: number }[];
  recentActivity: { id: string; type: string; name: string; createdAt: string }[];
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#ef4444',
  STAFF: '#4f6ef7',
  STUDENT: '#10b981',
  PARENT: '#f59e0b'
};

const TYPE_LABELS: Record<string, string> = {
  STUDENT: 'Students',
  STAFF: 'Staff',
  PARENT: 'Parents',
  COURSE: 'Courses',
  DEPARTMENT: 'Departments',
  ROOM: 'Rooms',
  EVENT: 'Events',
  ANNOUNCEMENT: 'Announcements',
  ASSESSMENT: 'Assessments',
  ASSIGNMENT: 'Assignments',
  BUILDING: 'Buildings'
};

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'STUDENT': return <UsersIcon size={16} />;
      case 'STAFF': return <UserIcon size={16} />;
      case 'COURSE': return <BookOpenIcon size={16} />;
      case 'DEPARTMENT': return <BuildingIcon size={16} />;
      case 'EVENT': return <CalendarIcon size={16} />;
      case 'ASSESSMENT': return <ClipboardIcon size={16} />;
      case 'ASSIGNMENT': return <FileTextIcon size={16} />;
      case 'ANNOUNCEMENT': return <MegaphoneIcon size={16} />;
      default: return <ActivityIcon size={16} />;
    }
  };

  const userName = user?.email?.split('@')[0] || 'Admin';
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const entityChartData = stats?.entityDistribution
    .filter(e => e.count > 0)
    .map(e => ({
      name: TYPE_LABELS[e.type] || e.type,
      value: e.count
    })) || [];

  const userChartData = stats?.userDistribution
    .filter(u => u.count > 0)
    .map(u => ({
      name: u.role.charAt(0) + u.role.slice(1).toLowerCase(),
      value: u.count,
      fill: ROLE_COLORS[u.role] || '#6b7280'
    })) || [];

  // Create overview data for bar chart
  const overviewData = [
    { name: 'Users', value: stats?.totalUsers || 0, fill: '#4f6ef7' },
    { name: 'Courses', value: stats?.totalCourses || 0, fill: '#10b981' },
    { name: 'Assessments', value: stats?.totalAssessments || 0, fill: '#f59e0b' },
    { name: 'Assignments', value: stats?.totalAssignments || 0, fill: '#8b5cf6' },
    { name: 'Events', value: stats?.totalEvents || 0, fill: '#06b6d4' },
  ].filter(d => d.value > 0);

  return (
    <div className={styles.container}>
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        <div className={styles.welcomeText}>
          <h1>{getGreeting()}, {userName.charAt(0).toUpperCase() + userName.slice(1)}!</h1>
          <p>{currentDate}</p>
        </div>
        <div className={styles.quickStats}>
          <div className={styles.quickStat}>
            <TrendingUpIcon size={20} />
            <span>{stats?.totalUsers || 0} total users</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <div className={styles.statIcon}><UsersIcon size={24} /></div>
          <div className={styles.statContent}>
            <h3>{stats?.totalStudents || 0}</h3>
            <p>Students</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <div className={styles.statIcon}><UserIcon size={24} /></div>
          <div className={styles.statContent}>
            <h3>{stats?.totalStaff || 0}</h3>
            <p>Staff Members</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <div className={styles.statIcon}><BookOpenIcon size={24} /></div>
          <div className={styles.statContent}>
            <h3>{stats?.totalCourses || 0}</h3>
            <p>Courses</p>
            <span className={styles.subStat}>{stats?.activeCourses || 0} active</span>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.info}`}>
          <div className={styles.statIcon}><BuildingIcon size={24} /></div>
          <div className={styles.statContent}>
            <h3>{stats?.totalDepartments || 0}</h3>
            <p>Departments</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <div className={styles.statIcon}><ClipboardIcon size={24} /></div>
          <div className={styles.statContent}>
            <h3>{stats?.totalAssessments || 0}</h3>
            <p>Assessments</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.pink}`}>
          <div className={styles.statIcon}><FileTextIcon size={24} /></div>
          <div className={styles.statContent}>
            <h3>{stats?.totalAssignments || 0}</h3>
            <p>Assignments</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Overview Bar Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>System Overview</h3>
            <span className={styles.chartSubtitle}>Total counts by category</span>
          </div>
          <div className={styles.chartBody}>
            {overviewData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={overviewData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border-color)' }}
                  />
                  <YAxis 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border-color)' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {overviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>
                <p>No data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* User Distribution Pie Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>User Distribution</h3>
            <span className={styles.chartSubtitle}>By role type</span>
          </div>
          <div className={styles.chartBody}>
            {userChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={userChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {userChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>
                <p>No users in the system yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className={styles.bottomGrid}>
        {/* Entity Distribution */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Entity Distribution</h3>
            <span className={styles.chartSubtitle}>Active entities by type</span>
          </div>
          <div className={styles.chartBody}>
            {entityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={entityChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4f6ef7" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className={styles.noData}>
                <p>No entities created yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.activityCard}>
          <div className={styles.chartHeader}>
            <h3>Recent Activity</h3>
            <span className={styles.chartSubtitle}>Latest system updates</span>
          </div>
          <div className={styles.activityList}>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>
                    {getTypeIcon(activity.type)}
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityName}>{activity.name}</div>
                    <div className={styles.activityMeta}>
                      <span className={styles.activityType}>
                        {TYPE_LABELS[activity.type] || activity.type}
                      </span>
                      <span className={styles.activityTime}>
                        {formatDate(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noActivity}>
                <ActivityIcon size={32} />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className={styles.quickStatsCard}>
          <div className={styles.chartHeader}>
            <h3>Quick Stats</h3>
            <span className={styles.chartSubtitle}>At a glance</span>
          </div>
          <div className={styles.quickStatsList}>
            <div className={styles.quickStatItem}>
              <div className={styles.quickStatIcon}><BookIcon size={20} /></div>
              <div className={styles.quickStatInfo}>
                <span className={styles.quickStatValue}>{stats?.totalRooms || 0}</span>
                <span className={styles.quickStatLabel}>Rooms</span>
              </div>
            </div>
            <div className={styles.quickStatItem}>
              <div className={styles.quickStatIcon}><CalendarIcon size={20} /></div>
              <div className={styles.quickStatInfo}>
                <span className={styles.quickStatValue}>{stats?.totalEvents || 0}</span>
                <span className={styles.quickStatLabel}>Events</span>
              </div>
            </div>
            <div className={styles.quickStatItem}>
              <div className={styles.quickStatIcon}><MegaphoneIcon size={20} /></div>
              <div className={styles.quickStatInfo}>
                <span className={styles.quickStatValue}>{stats?.totalAnnouncements || 0}</span>
                <span className={styles.quickStatLabel}>Announcements</span>
              </div>
            </div>
            <div className={styles.quickStatItem}>
              <div className={styles.quickStatIcon}><UsersIcon size={20} /></div>
              <div className={styles.quickStatInfo}>
                <span className={styles.quickStatValue}>{stats?.totalParents || 0}</span>
                <span className={styles.quickStatLabel}>Parents</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
