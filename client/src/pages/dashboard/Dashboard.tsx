import { useAuth } from '../../context/AuthContext';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.logo}>UniSphere</h1>
          <button onClick={logout} className={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeCard}>
          <h2 className={styles.welcomeTitle}>Welcome back!</h2>
          <p className={styles.welcomeText}>
            You're successfully logged into UniSphere
          </p>
        </div>

        <div className={styles.accountCard}>
          <h3 className={styles.cardTitle}>Account Information</h3>
          
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>User ID</span>
              <span className={styles.infoValue}>{user?.id}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Email</span>
              <span className={styles.infoValue}>{user?.email}</span>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Name</span>
              <span className={styles.infoValue}>{user?.name || 'Not set'}</span>
            </div>

            {user?.createdAt && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Account Created</span>
                <span className={styles.infoValue}>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Status</span>
              <span className={styles.statValue}>Active</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Member Since</span>
              <span className={styles.statValue}>
                {user?.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
              </span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statLabel}>Activity</span>
              <span className={styles.statValue}>Good</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
