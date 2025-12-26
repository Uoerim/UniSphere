import { useAuth } from '../../context/AuthContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import styles from './DashboardLayout.module.css';
import {
  DashboardIcon,
  UsersIcon,
  StaffIcon,
  GraduationCapIcon,
  ParentIcon,
  BookOpenIcon,
  BuildingIcon,
  FileTextIcon,
  ClipboardIcon,
  SchoolIcon,
  MegaphoneIcon,
  CalendarIcon,
  SettingsIcon,
  LogoutIcon,
  MailIcon,
  BellIcon,
  CheckCircleIcon,
  ChartIcon
} from '../ui/Icons';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getNavSections = () => {
    const mainNav = [
      { name: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    ];

    const adminNav = [
      { name: 'Users', path: '/users', icon: <UsersIcon /> },
      { name: 'Staff', path: '/staff', icon: <StaffIcon /> },
      { name: 'Students', path: '/students', icon: <GraduationCapIcon /> },
      { name: 'Parents', path: '/parents', icon: <ParentIcon /> },
    ];

    const academicNav = [
      { name: 'Courses', path: '/courses', icon: <BookOpenIcon /> },
      { name: 'Departments', path: '/departments', icon: <BuildingIcon /> },
      { name: 'Assessments', path: '/assessments', icon: <FileTextIcon /> },
      { name: 'Assignments', path: '/assignments', icon: <ClipboardIcon /> },
    ];

    const facilitiesNav = [
      { name: 'Facilities', path: '/facilities', icon: <SchoolIcon /> },
    ];

    const communityNav = [
      { name: 'Announcements', path: '/announcements', icon: <MegaphoneIcon /> },
      { name: 'Events', path: '/events', icon: <CalendarIcon /> },
    ];

    const settingsNav = [
      { name: 'Settings', path: '/settings', icon: <SettingsIcon /> },
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
          { title: 'Academic', items: academicNav },
          { title: 'Community', items: communityNav },
        ];
      case 'STUDENT':
        return [
          { title: 'Main', items: mainNav },
          { title: 'Academic', items: [
            { name: 'My Courses', path: '/courses', icon: <BookOpenIcon /> },
            { name: 'My Assignments', path: '/assignments', icon: <ClipboardIcon /> },
            { name: 'My Assessments', path: '/assessments', icon: <FileTextIcon /> },
            { name: 'My Grades', path: '/grades', icon: <ChartIcon /> },
          ]},
          { title: 'Community', items: communityNav },
        ];
      case 'PARENT':
        return [
          { title: 'Main', items: mainNav },
          { title: 'Children', items: [
            { name: 'My Children', path: '/children', icon: <ParentIcon /> },
            { name: 'Attendance', path: '/attendance', icon: <CheckCircleIcon /> },
            { name: 'Grades', path: '/grades', icon: <ChartIcon /> },
          ]},
          { title: 'Communication', items: communityNav },
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
            <img 
              src="/UniSphere-Logo-GREEN.png" 
              alt="UniSphere" 
              className={styles.logoImage}
            />
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
            <LogoutIcon />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.welcomeText}>Welcome back, {user?.email?.split('@')[0]}</span>
          </div>
          
          <div className={styles.headerRight}>
            <div className={styles.headerIcon}>
              <MailIcon size={18} />
              <span className={styles.notificationBadge}></span>
            </div>
            <div className={styles.headerIcon}>
              <BellIcon size={18} />
              <span className={styles.notificationBadge}></span>
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
