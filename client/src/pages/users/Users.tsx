import { useState, useEffect } from 'react';
import styles from './Users.module.css';
import AccountModal from './AccountModal';

interface Account {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export default function Users() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

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

  const handleCreateAccount = async (data: { email: string; password?: string; role: string }) => {
    const token = localStorage.getItem('token');
    
    console.log('Creating account with data:', data);
    
    const response = await fetch('http://localhost:4000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Server error:', error);
      throw new Error(error.error || 'Failed to create account');
    }

    await fetchAccounts();
  };

  const handleUpdateAccount = async (data: { email: string; password?: string; role: string }) => {
    if (!selectedAccount) return;

    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:4000/api/users/${selectedAccount.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update account');
    }

    await fetchAccounts();
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
    setIsModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setModalMode('edit');
    setSelectedAccount(account);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedAccount(null);
  };

  const getRoleBadgeClass = (role: string) => {
    return `${styles.roleBadge} ${styles[role.toLowerCase()]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading accounts...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Accounts</h1>
        <button className={styles.addButton} onClick={openCreateModal}>
          + Add Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No accounts found</p>
          <button className={styles.addButton} onClick={openCreateModal}>
            Create your first account
          </button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <td>{account.email}</td>
                  <td>
                    <span className={getRoleBadgeClass(account.role)}>
                      {account.role}
                    </span>
                  </td>
                  <td>{formatDate(account.createdAt)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editButton}
                        onClick={() => openEditModal(account)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AccountModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={modalMode === 'create' ? handleCreateAccount : handleUpdateAccount}
        account={selectedAccount}
        mode={modalMode}
      />
    </div>
  );
}
