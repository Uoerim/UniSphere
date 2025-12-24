import { useState, useEffect, useMemo } from 'react';
import styles from './Users.module.css';

interface Account {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  tempPassword: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewAccountData {
  account: Account;
  generatedPassword?: string;
}

type SortField = 'email' | 'role' | 'createdAt' | 'lastLogin' | 'isActive';
type SortDirection = 'asc' | 'desc';

export default function Users() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('STUDENT');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Created account password display
  const [createdAccountData, setCreatedAccountData] = useState<NewAccountData | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  
  // Sorting and filtering
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      setAccounts(data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  // Sorted and filtered accounts
  const filteredAndSortedAccounts = useMemo(() => {
    let result = [...accounts];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(acc => 
        acc.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (filterRole !== 'all') {
      result = result.filter(acc => acc.role === filterRole);
    }

    // Filter by status
    if (filterStatus === 'active') {
      result = result.filter(acc => acc.isActive);
    } else if (filterStatus === 'inactive') {
      result = result.filter(acc => !acc.isActive);
    } else if (filterStatus === 'needsPasswordChange') {
      result = result.filter(acc => acc.mustChangePassword);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'createdAt' || sortField === 'lastLogin') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [accounts, searchTerm, filterRole, filterStatus, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleCreateAccount = async () => {
    if (!formEmail) {
      setFormError('Email is required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formEmail,
          role: formRole,
          generatePassword: true
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create account');
      }

      const data = await response.json();
      
      // Close the create modal first
      closeModal();
      
      // Refresh accounts list
      await fetchAccounts();
      
      // If password was generated, show it to admin
      if (data.generatedPassword) {
        setCreatedAccountData(data);
        setShowPasswordModal(true);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/users/${selectedAccount.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword || undefined,
          role: formRole
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update account');
      }

      await fetchAccounts();
      closeModal();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/users/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      await fetchAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedAccount(null);
    setFormEmail('');
    setFormPassword('');
    setFormRole('STUDENT');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setModalMode('edit');
    setSelectedAccount(account);
    setFormEmail(account.email);
    setFormPassword('');
    setFormRole(account.role);
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
    setFormError('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    return `${styles.roleBadge} ${styles[role.toLowerCase()]}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return '👑';
      case 'STAFF': return '👨‍🏫';
      case 'STUDENT': return '🎓';
      case 'PARENT': return '👨‍👩‍👧';
      default: return '👤';
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: accounts.length,
    admins: accounts.filter(a => a.role === 'ADMIN').length,
    staff: accounts.filter(a => a.role === 'STAFF').length,
    students: accounts.filter(a => a.role === 'STUDENT').length,
    parents: accounts.filter(a => a.role === 'PARENT').length,
    needsPasswordChange: accounts.filter(a => a.mustChangePassword).length,
  }), [accounts]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading accounts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h2>Error Loading Accounts</h2>
        <p>{error}</p>
        <button className={styles.retryBtn} onClick={fetchAccounts}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>Manage all user accounts and permissions</p>
        </div>
        <button className={styles.addButton} onClick={openCreateModal}>
          <span>+</span> Add New User
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>👥</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Users</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.admin}`}>👑</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.admins}</div>
            <div className={styles.statLabel}>Administrators</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.staff}`}>👨‍🏫</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.staff}</div>
            <div className={styles.statLabel}>Staff Members</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.student}`}>🎓</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.students}</div>
            <div className={styles.statLabel}>Students</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.parent}`}>👨‍👩‍👧</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.parents}</div>
            <div className={styles.statLabel}>Parents</div>
          </div>
        </div>
        {stats.needsPasswordChange > 0 && (
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.warning}`}>🔑</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.needsPasswordChange}</div>
              <div className={styles.statLabel}>Need Password Change</div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
        <select
          className={styles.filterSelect}
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="ADMIN">Administrators</option>
          <option value="STAFF">Staff</option>
          <option value="STUDENT">Students</option>
          <option value="PARENT">Parents</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="needsPasswordChange">Needs Password Change</option>
        </select>
        <div className={styles.resultCount}>
          Showing {filteredAndSortedAccounts.length} of {accounts.length} users
        </div>
      </div>

      {/* Table */}
      {filteredAndSortedAccounts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h3>No Users Found</h3>
          <p>{searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
            ? 'Try adjusting your filters' 
            : 'Create your first user account to get started'}</p>
          {!searchTerm && filterRole === 'all' && filterStatus === 'all' && (
            <button className={styles.addButton} onClick={openCreateModal}>
              Create First User
            </button>
          )}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th onClick={() => handleSort('email')} className={styles.sortable}>
                  User {getSortIcon('email')}
                </th>
                <th onClick={() => handleSort('role')} className={styles.sortable}>
                  Role {getSortIcon('role')}
                </th>
                <th>Status</th>
                <th onClick={() => handleSort('lastLogin')} className={styles.sortable}>
                  Last Login {getSortIcon('lastLogin')}
                </th>
                <th onClick={() => handleSort('createdAt')} className={styles.sortable}>
                  Created {getSortIcon('createdAt')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedAccounts.map((account) => (
                <tr key={account.id} className={!account.isActive ? styles.inactive : ''}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>
                        {getRoleIcon(account.role)}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.userEmail}>{account.email}</div>
                        <div className={styles.userId}>ID: {account.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={getRoleBadgeClass(account.role)}>
                      {account.role}
                    </span>
                  </td>
                  <td>
                    <div className={styles.statusCell}>
                      <span className={`${styles.statusBadge} ${account.isActive ? styles.active : styles.inactive}`}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {account.mustChangePassword && account.tempPassword && (
                        <div className={styles.tempPasswordDisplay}>
                          <span className={styles.tempPasswordLabel}>🔑 Temp:</span>
                          <code className={styles.tempPasswordCode}>{account.tempPassword}</code>
                          <button
                            className={styles.copySmallBtn}
                            onClick={() => copyToClipboard(account.tempPassword!)}
                            title="Copy password"
                          >
                            📋
                          </button>
                        </div>
                      )}
                      {account.mustChangePassword && !account.tempPassword && (
                        <span className={`${styles.statusBadge} ${styles.passwordWarning}`} title="User needs to change password">
                          🔑 Needs Password Change
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(account.lastLogin)}
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(account.createdAt)}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => openEditModal(account)}
                        title="Edit user"
                      >
                        ✏️
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDeleteAccount(account.id)}
                        title="Delete user"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{modalMode === 'create' ? 'Create New User' : 'Edit User'}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              {formError && (
                <div className={styles.formError}>
                  <span>⚠️</span> {formError}
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="user@example.com"
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>Role *</label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                  <option value="STUDENT">🎓 Student</option>
                  <option value="STAFF">👨‍🏫 Staff</option>
                  <option value="PARENT">👨‍👩‍👧 Parent</option>
                  <option value="ADMIN">👑 Administrator</option>
                </select>
              </div>

              {modalMode === 'create' && (
                <div className={styles.formGroup}>
                  <p className={styles.helpText}>
                    🔐 A secure random password will be generated and shown to you after creation.
                  </p>
                </div>
              )}

              {modalMode === 'edit' && (
                <div className={styles.formGroup}>
                  <label>
                    New Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeModal}>
                Cancel
              </button>
              <button 
                className={styles.submitBtn} 
                onClick={modalMode === 'create' ? handleCreateAccount : handleUpdateAccount}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create User' : 'Update User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Display Modal */}
      {showPasswordModal && createdAccountData && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>✅ Account Created Successfully</h2>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.successMessage}>
                <p>The following account has been created with a temporary password:</p>
                
                <div className={styles.credentialsBox}>
                  <div className={styles.credentialRow}>
                    <span className={styles.credentialLabel}>Email:</span>
                    <span className={styles.credentialValue}>{createdAccountData.account.email}</span>
                  </div>
                  <div className={styles.credentialRow}>
                    <span className={styles.credentialLabel}>Role:</span>
                    <span className={styles.credentialValue}>{createdAccountData.account.role}</span>
                  </div>
                  <div className={styles.credentialRow}>
                    <span className={styles.credentialLabel}>Temporary Password:</span>
                    <div className={styles.passwordDisplay}>
                      <code>{createdAccountData.generatedPassword}</code>
                      <button 
                        className={styles.copyBtn}
                        onClick={() => copyToClipboard(createdAccountData.generatedPassword || '')}
                      >
                        {copiedPassword ? '✓ Copied!' : '📋 Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.warningBox}>
                  <span>⚠️</span>
                  <p>
                    <strong>Important:</strong> This password will only be temporary. 
                    They will be required to change it upon first login.
                  </p>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.submitBtn} 
                onClick={() => {
                  setShowPasswordModal(false);
                  setCreatedAccountData(null);
                  setCopiedPassword(false);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
