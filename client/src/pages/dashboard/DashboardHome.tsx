import { useAuth } from '../../context/AuthContext';
import styles from './Dashboard.module.css';

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <>
      <h1>Welcome, {user?.email}!</h1>
      <p className={styles.roleText}>Role: {user?.role}</p>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Quick Overview</h3>
          <p>Your personalized dashboard content will appear here</p>
        </div>
      </div>
    </>
  );
}
