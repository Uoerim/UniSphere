import { useAuth } from '../../context/AuthContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavSections = () => {
    const mainNav = [
      { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    ];

    const adminNav = [
      { name: 'Users', path: '/users', icon: '👥' },
      { name: 'Staff', path: '/staff', icon: '👨‍🏫' },
      { name: 'Students', path: '/students', icon: '🎓' },
    ];

    const academicNav = [
      { name: 'Courses', path: '/courses', icon: '📚' },
      { name: 'Assessments', path: '/assessments', icon: '📝' },
    ];

    const facilitiesNav = [
      { name: 'Classrooms', path: '/classrooms', icon: '🏫' },
    // ...existing code...
      { name: 'Schedule', path: '/schedule', icon: '📅' },
    ];

    const communityNav = [
      { name: 'Announcements', path: '/announcements', icon: '📢' },
      { name: 'Events', path: '/events', icon: '🎉' },
      { name: 'Messages', path: '/messages', icon: '💬' },
    ];

    const settingsNav = [
      { name: 'Settings', path: '/settings', icon: '⚙️' },
    ];

    switch (user?.role) {
      case 'ADMIN':
        return [
          { title: 'Main', items: mainNav },
          { title: 'Administration', items: adminNav },
          { title: 'Academic', items: academicNav },
          { title: 'Facilities', items: facilitiesNav },
          { title: 'Community', items: communityNav },
          { title: 'System', items: settingsNav },
        ];
      case 'STAFF':
        return [
          { title: 'Main', items: mainNav },
          // Only show Students under Administration for staff, not Staff management
          { title: 'Administration', items: [adminNav[2]] },
          { title: 'Academic', items: academicNav },
          { title: 'Facilities', items: facilitiesNav },
          { title: 'Community', items: [communityNav[0], communityNav[2]] }, // Announcements, Messages only
        ];
      case 'STUDENT':
        return [
          { title: 'Main', items: mainNav },
          { title: 'Academic', items: [
            { name: 'My Courses', path: '/courses', icon: '📚' },
            { name: 'Grades', path: '/grades', icon: '📊' },
          ]},
          { title: 'Community', items: [communityNav[0], communityNav[1]] },
        ];
      case 'PARENT':
        return [
          { title: 'Main', items: mainNav },
          { title: 'Children', items: [
            { name: 'My Children', path: '/children', icon: '👨‍👧‍👦' },
            { name: 'Attendance', path: '/attendance', icon: '✅' },
            { name: 'Grades', path: '/grades', icon: '📊' },
          ]},
          { title: 'Communication', items: [
            { name: 'Messages', path: '/messages', icon: '💬' },
            { name: 'Announcements', path: '/announcements', icon: '📢' },
          ]},
        ];
      default:
        return [{ title: 'Main', items: mainNav }];
    }
  };

  const navSections = getNavSections();

  const getInitials = (email: string) => {
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>🎓</div>
            <span>UniSphere</span>
          </div>
        </div>
        
        <nav className={styles.sidebarNav}>
          {navSections.map((section, idx) => (
            <div key={idx} className={styles.navSection}>
              <div className={styles.navSectionTitle}>{section.title}</div>
              <div className={styles.nav}>
                {section.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`${styles.navLink} ${location.pathname === item.path ? styles.active : ''}`}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={logout} className={styles.logoutBtn}>
            <span>🚪</span>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input type="text" placeholder="Search..." />
          </div>
          
          <div className={styles.headerRight}>
            <div className={styles.headerIcon}>
              ✉️
              <span className={styles.notificationBadge}></span>
            </div>
            <div className={styles.headerIcon}>
              🔔
              <span className={styles.notificationBadge}></span>
            </div>
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>
                {getInitials(user?.email || '')}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user?.email?.split('@')[0]}</span>
                <span className={styles.userRole}>{user?.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
