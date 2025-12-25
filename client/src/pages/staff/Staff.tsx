import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { StaffIcon, GraduationCapIcon, CrownIcon, ChartIcon, EditIcon, TrashIcon } from '../../components/ui/Icons';
import styles from '../../styles/pages.module.css';

interface StaffMember {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  department?: string;
  position?: string;
}

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to only show staff/admin
        const staffMembers = data.filter((u: any) => u.role === 'STAFF' || u.role === 'ADMIN');
        setStaff(staffMembers);
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Staff Management</h1>
          <p className={styles.pageSubtitle}>Manage professors, teaching assistants, and administrative staff</p>
        </div>
        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setIsModalOpen(true)}>
          + Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}><StaffIcon size={20} /></div>
          <div>
            <div className={styles.statValue}>{staff.length}</div>
            <div className={styles.statLabel}>Total Staff</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}><GraduationCapIcon size={20} /></div>
          <div>
            <div className={styles.statValue}>{staff.filter(s => s.role === 'STAFF').length}</div>
            <div className={styles.statLabel}>Faculty</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}><CrownIcon size={20} /></div>
          <div>
            <div className={styles.statValue}>{staff.filter(s => s.role === 'ADMIN').length}</div>
            <div className={styles.statLabel}>Administrators</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><ChartIcon size={20} /></div>
          <div>
            <div className={styles.statValue}>12</div>
            <div className={styles.statLabel}>Departments</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <button 
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All Staff
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'faculty' ? styles.active : ''}`}
          onClick={() => setFilter('faculty')}
        >
          Faculty
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'admin' ? styles.active : ''}`}
          onClick={() => setFilter('admin')}
        >
          Administrators
        </button>
        <input 
          type="text" 
          placeholder="Search staff..." 
          className={styles.searchInput}
        />
      </div>

      {/* Staff Table */}
      <div className={styles.card}>
        <div className={styles.tableContainer}>
          {isLoading ? (
            <div className={styles.loading}>Loading staff members...</div>
          ) : staff.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}><StaffIcon size={48} /></div>
              <div className={styles.emptyTitle}>No Staff Members</div>
              <div className={styles.emptyText}>Add your first staff member to get started</div>
              <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setIsModalOpen(true)}>
                Add Staff Member
              </button>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #4f6ef7, #6c64e3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600'
                        }}>
                          {getInitials(member.email)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{member.email.split('@')[0]}</div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${member.role === 'ADMIN' ? styles.danger : styles.primary}`}>
                        {member.role}
                      </span>
                    </td>
                    <td>{member.department || 'Not Assigned'}</td>
                    <td>{formatDate(member.createdAt)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.success}`}>Active</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.iconBtn}><EditIcon size={16} /></button>
                        <button className={`${styles.iconBtn} ${styles.danger}`}><TrashIcon size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Staff Member"
        footer={
          <>
            <button className="btn secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn primary">Add Staff</button>
          </>
        }
      >
        <p style={{ color: '#6b7280', textAlign: 'center' }}>
          To add a new staff member, go to the Users page and create an account with the STAFF or ADMIN role.
        </p>
      </Modal>
    </div>
  );
}
