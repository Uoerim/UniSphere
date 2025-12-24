import { useState, useEffect } from 'react';
import styles from './AccountModal.module.css';

interface Account {
  id: string;
  email: string;
  role: string;
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; password?: string; role: string }) => Promise<void>;
  account?: Account | null;
  mode: 'create' | 'edit';
}

export default function AccountModal({ isOpen, onClose, onSubmit, account, mode }: AccountModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account && mode === 'edit') {
      setEmail(account.email);
      setRole(account.role);
      setPassword('');
    } else {
      setEmail('');
      setPassword('');
      setRole('STUDENT');
    }
    setError('');
  }, [account, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email) {
      setError('Email is required');
      return;
    }

    if (mode === 'create' && !password) {
      setError('Password is required');
      return;
    }

    if (password && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: { email: string; password?: string; role: string } = {
        email,
        role,
      };

      if (password) {
        data.password = password;
      }

      console.log('Submitting account data:', data);
      await onSubmit(data);
      onClose();
    } catch (err: any) {
      console.error('Submit error:', err);
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      alert(errorMessage); // Show error in alert for visibility
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {mode === 'create' ? 'Create New Account' : 'Edit Account'}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.body}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="password">
                Password {mode === 'edit' && '(leave blank to keep current)'}
              </label>
              <input
                id="password"
                type="password"
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={mode === 'create'}
                minLength={6}
              />
              <span className={styles.passwordHint}>
                Minimum 6 characters
              </span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="role">
                Role
              </label>
              <select
                id="role"
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {error && <div className={styles.error}>{error}</div>}
          </form>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Account' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
