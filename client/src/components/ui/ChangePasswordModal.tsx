import { useState, useEffect } from 'react';
import styles from './ChangePasswordModal.module.css';

interface ChangePasswordModalProps {
    isOpen: boolean;
    token: string | null;
    onSuccess: () => void;
}

export default function ChangePasswordModal({ isOpen, token, onSuccess }: ChangePasswordModalProps) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Password requirements state
    const [requirements, setRequirements] = useState({
        length: false,
        match: false
    });

    useEffect(() => {
        setRequirements({
            length: newPassword.length >= 8,
            match: newPassword.length > 0 && newPassword === confirmPassword
        });
    }, [newPassword, confirmPassword]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!requirements.length) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!requirements.match) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:4000/api/auth/reset-temp-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword, confirmPassword })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update password');
            }

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setIsLoading(false);
        }
    };

    const isFormValid = requirements.length && requirements.match;

    return (
        <div className={styles.forceOverlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <div className={styles.icon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h2 className={styles.title}>Create New Password</h2>
                    <p className={styles.subtitle}>
                        You're using a temporary password. Please create a new secure password to continue.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className={styles.body}>
                    {error && (
                        <div className={styles.errorMessage}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>New Password</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={`${styles.input} ${error && !requirements.length ? styles.error : ''}`}
                                placeholder="Enter new password"
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Confirm Password</label>
                        <div className={styles.inputWrapper}>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`${styles.input} ${error && !requirements.match ? styles.error : ''}`}
                                placeholder="Confirm new password"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className={styles.requirements}>
                        <div className={`${styles.requirement} ${requirements.length ? styles.met : ''}`}>
                            {requirements.length ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                            )}
                            At least 8 characters
                        </div>
                        <div className={`${styles.requirement} ${requirements.match ? styles.met : ''}`}>
                            {requirements.match ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                </svg>
                            )}
                            Passwords match
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={!isFormValid || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className={styles.spinner} />
                                    Updating...
                                </>
                            ) : (
                                'Set New Password'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
