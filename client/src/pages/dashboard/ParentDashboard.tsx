import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BookOpenIcon, ChartIcon, ParentIcon, ChevronRightIcon } from '../../components/ui/Icons';
import styles from './RoleDashboard.module.css';

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Child {
  id: string;
  name: string;
  email: string;
  grade: string;
  avatar: string;
  courses: Course[];
  courseCount: number;
}

export default function ParentDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await fetch('http://localhost:4000/api/parents/me/children', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }

      const data = await response.json();
      setChildren(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const totalCourses = children.reduce((sum, child) => sum + (child.courseCount || 0), 0);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px'
        }}>
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid var(--border)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Welcome Header */}
      <div className={`${styles.welcomeBanner} ${styles.parentBanner}`}>
        <div className={styles.welcomeContent}>
          <h1>Welcome, {user?.email?.split('@')[0] || 'Parent'}!</h1>
          <p>Stay connected with your children's academic journey</p>
        </div>
        <div className={styles.welcomeStats}>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>{children.length}</span>
            <span className={styles.statLabel}>Children</span>
          </div>
          <div className={styles.welcomeStat}>
            <span className={styles.statNumber}>{totalCourses}</span>
            <span className={styles.statLabel}>Total Courses</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          {error}
          <button
            onClick={fetchChildren}
            style={{
              marginLeft: '12px',
              padding: '6px 16px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {children.length === 0 ? (
        <div className={styles.card} style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: 80,
            height: 80,
            background: 'var(--hover-bg)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <ParentIcon size={40} />
          </div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--text)' }}>No Children Linked</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Contact the school administration to link your children to your account.
          </p>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => navigate('/children')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '20px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}>
                <ParentIcon size={24} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>My Children</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>View all children</div>
              </div>
            </button>

            <button
              onClick={() => navigate('/parent-grades')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '20px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6'
              }}>
                <ChartIcon size={24} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>View Grades</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Academic progress</div>
              </div>
            </button>
          </div>

          {/* Children Cards */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2><ParentIcon size={20} /> My Children</h2>
              <button className={styles.viewAllBtn} onClick={() => navigate('/children')}>
                View All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {children.map(child => (
                <div
                  key={child.id}
                  onClick={() => navigate(`/children/${child.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    background: 'var(--hover-bg)',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: 56,
                    height: 56,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    {child.avatar}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text)', marginBottom: '4px' }}>
                      {child.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {child.email}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {child.grade && (
                      <span style={{
                        padding: '6px 14px',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600
                      }}>
                        {child.grade}
                      </span>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text-secondary)',
                      fontSize: '14px'
                    }}>
                      <BookOpenIcon size={16} />
                      <span>{child.courseCount} courses</span>
                    </div>

                    <ChevronRightIcon size={20} color="var(--text-secondary)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Courses Overview */}
          <div className={styles.card} style={{ marginTop: '24px' }}>
            <div className={styles.cardHeader}>
              <h2><BookOpenIcon size={20} /> All Enrolled Courses</h2>
            </div>

            {totalCourses === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <BookOpenIcon size={40} />
                <p>No courses enrolled yet</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px'
              }}>
                {children.flatMap(child =>
                  child.courses.map(course => (
                    <div
                      key={`${child.id}-${course.id}`}
                      style={{
                        padding: '16px',
                        background: 'var(--hover-bg)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0
                      }}>
                        <BookOpenIcon size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 600,
                          color: 'var(--text)',
                          fontSize: '14px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {course.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {course.code} • {child.name}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
