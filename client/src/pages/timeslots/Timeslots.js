import React, { useState, useEffect } from 'react';
import { getAllTimeslots, createTimeslot, deleteTimeslot } from '../../services/facilitiesService';
import './Timeslots.css';

const Timeslots = () => {
    const [timeslots, setTimeslots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dayFilter, setDayFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        dayOfWeek: 'Monday',
        startTime: '08:00',
        endTime: '09:00',
    });
    const [submitting, setSubmitting] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(null);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchTimeslots();
    }, []);

    const fetchTimeslots = async () => {
        try {
            setLoading(true);
            const data = await getAllTimeslots();
            setTimeslots(data.timeslots || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching timeslots:', err);
            setError(err.response?.data?.message || 'Failed to load timeslots');
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
            const result = await createTimeslot(formData);

            if (result.success) {
                setSuccessMessage('Timeslot created successfully!');
                setFormData({
                    dayOfWeek: 'Monday',
                    startTime: '08:00',
                    endTime: '09:00',
                });
                setShowForm(false);
                await fetchTimeslots();

                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error('Error creating timeslot:', err);
            setError(err.response?.data?.message || 'Failed to create timeslot');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (timeslotId) => {
        if (window.confirm('Are you sure you want to delete this timeslot?')) {
            setDeleteLoading(timeslotId);
            try {
                await deleteTimeslot(timeslotId);
                setSuccessMessage('Timeslot deleted successfully!');
                await fetchTimeslots();
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (err) {
                console.error('Error deleting timeslot:', err);
                setError(err.response?.data?.message || 'Failed to delete timeslot');
            } finally {
                setDeleteLoading(null);
            }
        }
    };

    const filteredTimeslots = timeslots.filter(slot =>
        dayFilter === 'all' || slot.dayOfWeek === dayFilter
    );

    const getDayNumber = (day) => {
        return daysOfWeek.indexOf(day);
    };

    const groupedByDay = {};
    filteredTimeslots.forEach(slot => {
        if (!groupedByDay[slot.dayOfWeek]) {
            groupedByDay[slot.dayOfWeek] = [];
        }
        groupedByDay[slot.dayOfWeek].push(slot);
    });

    const sortedDays = Object.keys(groupedByDay).sort((a, b) => getDayNumber(a) - getDayNumber(b));

    return (
        <div className="timeslots-page">
            <div className="page-header">
                <h2>Time Slots</h2>
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="add-btn"
                >
                    {showForm ? '✕ Cancel' : '+ Add Timeslot'}
                </button>
            </div>

            {successMessage && <div className="success-message">✓ {successMessage}</div>}

            {showForm && (
                <div className="form-container">
                    <form onSubmit={handleSubmit} className="timeslot-form">
                        <h3>Add New Time Slot</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Day of Week *</label>
                                <select
                                    name="dayOfWeek"
                                    value={formData.dayOfWeek}
                                    onChange={handleInputChange}
                                    required
                                >
                                    {daysOfWeek.map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Start Time *</label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>End Time *</label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button type="submit" disabled={submitting} className="submit-btn">
                                {submitting ? 'Creating...' : 'Create Timeslot'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="filter-section">
                <div className="day-filters">
                    <button
                        className={`day-filter-btn ${dayFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setDayFilter('all')}
                    >
                        All ({timeslots.length})
                    </button>
                    {daysOfWeek.map(day => (
                        <button
                            key={day}
                            className={`day-filter-btn ${dayFilter === day ? 'active' : ''}`}
                            onClick={() => setDayFilter(day)}
                        >
                            {day.slice(0, 3)} ({timeslots.filter(t => t.dayOfWeek === day).length})
                        </button>
                    ))}
                </div>
                <button onClick={fetchTimeslots} className="refresh-btn">🔄 Refresh</button>
            </div>

            {loading ? (
                <div className="loading">Loading timeslots...</div>
            ) : error ? (
                <div className="error-message">⚠️ {error}</div>
            ) : filteredTimeslots.length === 0 ? (
                <div className="no-data">No timeslots found</div>
            ) : (
                <div className="timeslots-container">
                    {sortedDays.map(day => (
                        <div key={day} className="day-section">
                            <h3 className="day-title">{day}</h3>
                            <div className="timeslots-list">
                                {groupedByDay[day].map(slot => (
                                    <div key={slot._id} className="timeslot-card">
                                        <div className="timeslot-time">
                                            <span className="time-badge">
                                                {slot.startTime} - {slot.endTime}
                                            </span>
                                        </div>
                                        <div className="timeslot-info">
                                            <p className="slot-id">ID: {slot._id}</p>
                                        </div>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(slot._id)}
                                            disabled={deleteLoading === slot._id}
                                        >
                                            {deleteLoading === slot._id ? '⏳' : '🗑️'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Timeslots;
