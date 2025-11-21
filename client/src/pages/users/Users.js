import React, { useState, useEffect } from 'react';
import { getAllUsers, createUser, deleteUser } from '../../services/facilitiesService';
import './Users.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roleFilter, setRoleFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        role: 'student',
    });
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);

    useEffect(() => {
        fetchUsers();
        // Get current user ID from token
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id);
            } catch (e) {
                console.error('Error parsing token:', e);
            }
        }
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data.users || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMessage('');

        try {
            const result = await createUser(formData);

            if (result.success) {
                setSuccessMessage('User created successfully!');
                setFormData({
                    name: '',
                    username: '',
                    password: '',
                    role: 'student',
                });
                setShowForm(false);
                await fetchUsers();

                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error('Error creating user:', err);
            setError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(user => {
        const matchRole = roleFilter === 'all' || user.role === roleFilter;
        const matchSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username.toLowerCase().includes(searchTerm.toLowerCase());
        return matchRole && matchSearch;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin':
                return 'role-admin';
            case 'instructor':
                return 'role-instructor';
            case 'student':
                return 'role-student';
            default:
                return '';
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return '👑';
            case 'instructor':
                return '👨‍🏫';
            case 'student':
                return '👨‍🎓';
            default:
                return '👤';
        }
    };

    const handleDelete = async (userId, userName) => {
        if (currentUserId === userId) {
            alert('You cannot delete your own account!');
            return;
        }

        if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
            try {
                setDeletingId(userId);
                await deleteUser(userId);
                setSuccessMessage('User deleted successfully!');
                await fetchUsers();
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (err) {
                console.error('Error deleting user:', err);
                setError(err.response?.data?.message || 'Failed to delete user');
            } finally {
                setDeletingId(null);
            }
        }
    };

    return (
        <div className="users-page">
            <div className="page-header">
                <h2>All Users</h2>
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="add-btn"
                >
                    {showForm ? '✕ Cancel' : '+ Add User'}
                </button>
            </div>

            {successMessage && <div className="success-message">✓ {successMessage}</div>}

            {showForm && (
                <div className="form-container">
                    <form onSubmit={handleSubmit} className="user-form">
                        <h3>Add New User</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="e.g., johndoe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Min 6 characters"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Role *</label>
                                <select 
                                    name="role" 
                                    value={formData.role} 
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="student">Student</option>
                                    <option value="instructor">Instructor</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button type="submit" disabled={submitting} className="submit-btn">
                                {submitting ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="users-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search by name or username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="role-filters">
                    <button
                        className={`role-filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setRoleFilter('all')}
                    >
                        All ({users.length})
                    </button>
                    <button
                        className={`role-filter-btn ${roleFilter === 'admin' ? 'active' : ''}`}
                        onClick={() => setRoleFilter('admin')}
                    >
                        Admin ({users.filter(u => u.role === 'admin').length})
                    </button>
                    <button
                        className={`role-filter-btn ${roleFilter === 'instructor' ? 'active' : ''}`}
                        onClick={() => setRoleFilter('instructor')}
                    >
                        Instructor ({users.filter(u => u.role === 'instructor').length})
                    </button>
                    <button
                        className={`role-filter-btn ${roleFilter === 'student' ? 'active' : ''}`}
                        onClick={() => setRoleFilter('student')}
                    >
                        Student ({users.filter(u => u.role === 'student').length})
                    </button>
                </div>

                <button onClick={fetchUsers} className="refresh-btn">🔄 Refresh</button>
            </div>

            {loading ? (
                <div className="loading">Loading users...</div>
            ) : error ? (
                <div className="error-message">⚠️ {error}</div>
            ) : filteredUsers.length === 0 ? (
                <div className="no-data">No users found</div>
            ) : (
                <div className="users-grid">
                    {filteredUsers.map((user) => (
                        <div key={user._id} className="user-card">
                            <div className="user-header">
                                <div className="user-avatar">
                                    {getRoleIcon(user.role)}
                                </div>
                                <div className="user-name-section">
                                    <h3>{user.name}</h3>
                                    <p className="username">@{user.username}</p>
                                </div>
                            </div>

                            <div className="user-body">
                                <div className="info-row">
                                    <span className="label">Role:</span>
                                    <span className={`role-badge ${getRoleColor(user.role)}`}>
                                        {user.role}
                                    </span>
                                </div>

                                <div className="info-row">
                                    <span className="label">User ID:</span>
                                    <span className="user-id">{user._id}</span>
                                </div>

                                <div className="info-row">
                                    <span className="label">Joined:</span>
                                    <span className="date">{formatDate(user.createdAt)}</span>
                                </div>
                            </div>

                            {currentUserId !== user._id && (
                                <div className="user-actions">
                                    <button
                                        onClick={() => handleDelete(user._id, user.name)}
                                        disabled={deletingId === user._id}
                                        className="delete-user-btn"
                                    >
                                        {deletingId === user._id ? 'Deleting...' : '🗑️ Delete'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Users;
