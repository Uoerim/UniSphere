import React, { useState, useEffect } from 'react';
import './dashboard.css';
import { getUserProfile } from '../../services/authServices';
import Classrooms from '../classrooms/Classrooms';
import Reservations from '../reservations/Reservations';
import Users from '../users/Users';
import Reports from '../reports/Reports';
import Settings from '../settings/Settings';
import Timeslots from '../timeslots/Timeslots';

const Dashboard = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState('home');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    setError('No token found. Please log in.');
                    setLoading(false);
                    return;
                }

                const response = await getUserProfile(token);

                if (response.valid && response.user) {
                    setUserData(response.user);
                    setError(null);
                } else {
                    setError('Failed to fetch user data');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(err.response?.data?.message || 'Failed to load user data');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    // Filter menu items based on user role
    const getAllMenuItems = () => [
        { id: 'home', name: 'Home', icon: '🏠' },
        { id: 'classrooms', name: 'Classrooms', icon: '🏛️' },
        { id: 'reservations', name: 'Reservations', icon: '📅' },
        { id: 'timeslots', name: 'Timeslots', icon: '⏰' },
        { id: 'users', name: 'Users', icon: '👥' },
        { id: 'reports', name: 'Reports', icon: '📊' },
        { id: 'settings', name: 'Settings', icon: '⚙️' },
    ];

    const getInstructorMenuItems = () => [
        { id: 'reservations', name: 'Reservations', icon: '📅' },
    ];

    const menuItems = userData?.role === 'instructor' ? getInstructorMenuItems() : getAllMenuItems();

    // Auto-redirect instructor to reservations page
    useEffect(() => {
        if (userData?.role === 'instructor' && currentPage === 'home') {
            setCurrentPage('reservations');
        }
    }, [userData?.role, currentPage]);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const renderPage = () => {
        // Only allow instructors to see reservations
        if (userData?.role === 'instructor' && currentPage !== 'reservations') {
            return <Reservations />;
        }

        switch (currentPage) {
            case 'classrooms':
                return userData?.role === 'admin' ? <Classrooms /> : <Reservations />;
            case 'reservations':
                return <Reservations />;
            case 'timeslots':
                return userData?.role === 'admin' ? <Timeslots /> : <Reservations />;
            case 'users':
                return userData?.role === 'admin' ? <Users /> : <Reservations />;
            case 'reports':
                return userData?.role === 'admin' ? <Reports /> : <Reservations />;
            case 'settings':
                return userData?.role === 'admin' ? <Settings /> : <Reservations />;
            case 'home':
            default:
                // Instructors only see reservations, so redirect them
                if (userData?.role === 'instructor') {
                    return <Reservations />;
                }
                return (
                    <div className="home-page">
                        <h2>Welcome, {userData?.name}!</h2>
                        <div className="home-grid">
                            <div className="home-card">
                                <h3>📚 Classrooms</h3>
                                <p>Manage and view all available classrooms in the facility system.</p>
                                <button onClick={() => setCurrentPage('classrooms')}>View Classrooms</button>
                            </div>
                            <div className="home-card">
                                <h3>📅 Reservations</h3>
                                <p>Track all classroom reservations and bookings.</p>
                                <button onClick={() => setCurrentPage('reservations')}>View Reservations</button>
                            </div>
                            <div className="home-card">
                                <h3>⏰ Timeslots</h3>
                                <p>View and manage available time slots for reservations.</p>
                                <button onClick={() => setCurrentPage('timeslots')}>View Timeslots</button>
                            </div>
                            <div className="home-card">
                                <h3>👥 Users</h3>
                                <p>Manage user accounts and roles in the system.</p>
                                <button onClick={() => setCurrentPage('users')}>View Users</button>
                            </div>
                            <div className="home-card">
                                <h3>📊 Reports</h3>
                                <p>View statistics and generate reports about your facility.</p>
                                <button onClick={() => setCurrentPage('reports')}>View Reports</button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="dashboard-wrapper">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-left">
                    <button className="menu-toggle" onClick={toggleSidebar}>
                        ☰
                    </button>
                    <h1 className="navbar-brand">Facility Manager</h1>
                </div>
                <div className="navbar-right">
                    <div className="user-profile">
                        <img src="https://via.placeholder.com/40" alt="User" className="user-avatar" />
                        <div className="user-info">
                            <span className="user-name">{userData?.name || 'Loading...'}</span>
                            <span className="user-role">{userData?.role}</span>
                        </div>
                        <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                </div>
            </nav>

            {/* Main Container */}
            <div className="dashboard-main">
                {/* Sidebar */}
                <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                    <div className="sidebar-header">
                        <h2>Menu</h2>
                    </div>
                    <ul className="sidebar-menu">
                        {menuItems.map((item) => (
                            <li key={item.id} className="menu-item">
                                <button 
                                    className={`menu-link ${currentPage === item.id ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(item.id)}
                                >
                                    <span className="menu-icon">{item.icon}</span>
                                    {sidebarOpen && <span className="menu-text">{item.name}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* Content Area */}
                <main className="dashboard-content">
                    <div className="content-container">
                        {loading && currentPage === 'home' ? (
                            <div className="loading">
                                <p>Loading user data...</p>
                            </div>
                        ) : error && currentPage === 'home' ? (
                            <div className="error-message">
                                <p>⚠️ {error}</p>
                            </div>
                        ) : (
                            renderPage()
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;