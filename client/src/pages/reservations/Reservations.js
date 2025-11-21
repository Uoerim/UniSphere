import React, { useState, useEffect } from 'react';
import { getAllReservations, createReservation, getClassroomAvailability, cancelReservation } from '../../services/facilitiesService';
import './Reservations.css';

const Reservations = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        date: '',
        classroom: '',
        timeslot: '',
        reservedFor: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [cancelingId, setCancelingId] = useState(null);

    useEffect(() => {
        fetchReservations();
    }, []);

    const fetchReservations = async () => {
        try {
            setLoading(true);
            const data = await getAllReservations();
            setReservations(data.reservations || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching reservations:', err);
            setError(err.response?.data?.message || 'Failed to load reservations');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = async (e) => {
        const date = e.target.value;
        setFormData(prev => ({ ...prev, date, classroom: '', timeslot: '' }));

        if (date) {
            setSlotsLoading(true);
            try {
                const data = await getClassroomAvailability(date);
                console.log('Availability data received:', data);
                setAvailableSlots(data.slots || []);
            } catch (err) {
                console.error('Error fetching availability:', err);
                setError('Failed to load available slots. Make sure timeslots are created in the system.');
            } finally {
                setSlotsLoading(false);
            }
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
            const result = await createReservation(formData);

            if (result.success) {
                setSuccessMessage('Reservation created successfully!');
                setFormData({
                    date: '',
                    classroom: '',
                    timeslot: '',
                    reservedFor: '',
                });
                setShowForm(false);
                await fetchReservations();

                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error('Error creating reservation:', err);
            setError(err.response?.data?.message || 'Failed to create reservation');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredReservations = reservations.filter(res =>
        statusFilter === 'all' || res.status === statusFilter
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed':
                return 'status-confirmed';
            case 'pending':
                return 'status-pending';
            case 'cancelled':
                return 'status-cancelled';
            default:
                return '';
        }
    };

    const handleCancel = async (reservationId) => {
        if (window.confirm('Are you sure you want to cancel this reservation?')) {
            try {
                setCancelingId(reservationId);
                await cancelReservation(reservationId);
                setSuccessMessage('Reservation cancelled successfully!');
                await fetchReservations();
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (err) {
                console.error('Error cancelling reservation:', err);
                setError(err.response?.data?.message || 'Failed to cancel reservation');
            } finally {
                setCancelingId(null);
            }
        }
    };

    // Get available classrooms for selected timeslot
    const selectedSlot = availableSlots.find(slot => slot.timeslotId === formData.timeslot);
    const availableClassrooms = selectedSlot?.availableRooms || [];

    return (
        <div className="reservations-page">
            <div className="page-header">
                <h2>Reservations</h2>
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="add-btn"
                >
                    {showForm ? '✕ Cancel' : '+ Make Reservation'}
                </button>
            </div>

            {successMessage && <div className="success-message">✓ {successMessage}</div>}

            {showForm && (
                <div className="form-container">
                    <form onSubmit={handleSubmit} className="reservation-form">
                        <h3>Create New Reservation</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date *</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleDateChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Time Slot *</label>
                                <select
                                    name="timeslot"
                                    value={formData.timeslot}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!formData.date || slotsLoading}
                                >
                                    <option value="">
                                        {slotsLoading ? 'Loading slots...' : formData.date ? (availableSlots.length === 0 ? 'No timeslots available' : 'Select a time slot') : 'Select a date first'}
                                    </option>
                                    {availableSlots.map(slot => (
                                        <option key={slot.timeslotId} value={slot.timeslotId}>
                                            {slot.startTime} - {slot.endTime}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Classroom *</label>
                                <select
                                    name="classroom"
                                    value={formData.classroom}
                                    onChange={handleInputChange}
                                    required
                                    disabled={!formData.timeslot}
                                >
                                    <option value="">
                                        {availableClassrooms.length === 0 
                                            ? 'No classrooms available' 
                                            : 'Select a classroom'}
                                    </option>
                                    {availableClassrooms.map(room => (
                                        <option key={room.id} value={room.id}>
                                            {room.name} - {room.building} (Cap: {room.capacity})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Reserved For *</label>
                                <input
                                    type="text"
                                    name="reservedFor"
                                    value={formData.reservedFor}
                                    onChange={handleInputChange}
                                    placeholder="e.g., CS101 - Data Structures"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-buttons">
                            <button type="submit" disabled={submitting} className="submit-btn">
                                {submitting ? 'Creating...' : 'Create Reservation'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="filter-section">
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('all')}
                    >
                        All ({reservations.length})
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'confirmed' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('confirmed')}
                    >
                        Confirmed ({reservations.filter(r => r.status === 'confirmed').length})
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('pending')}
                    >
                        Pending ({reservations.filter(r => r.status === 'pending').length})
                    </button>
                    <button
                        className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
                        onClick={() => setStatusFilter('cancelled')}
                    >
                        Cancelled ({reservations.filter(r => r.status === 'cancelled').length})
                    </button>
                </div>
                <button onClick={fetchReservations} className="refresh-btn">🔄 Refresh</button>
            </div>

            {loading ? (
                <div className="loading">Loading reservations...</div>
            ) : error ? (
                <div className="error-message">⚠️ {error}</div>
            ) : filteredReservations.length === 0 ? (
                <div className="no-data">No reservations found</div>
            ) : (
                <div className="reservations-table-container">
                    <table className="reservations-table">
                        <thead>
                            <tr>
                                <th>Classroom</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Reserved For</th>
                                <th>Reserved By</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReservations.map((reservation) => (
                                <tr key={reservation._id} className="reservation-row">
                                    <td className="classroom-cell">
                                        <div className="classroom-name">
                                            {reservation.classroom?.name || 'N/A'}
                                        </div>
                                        <div className="classroom-details">
                                            {reservation.classroom?.building} • Cap: {reservation.classroom?.capacity}
                                        </div>
                                    </td>
                                    <td>{formatDate(reservation.date)}</td>
                                    <td>
                                        {reservation.timeslot?.startTime} - {reservation.timeslot?.endTime}
                                    </td>
                                    <td>{reservation.reservedFor}</td>
                                    <td>{reservation.createdBy?.name || 'N/A'}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(reservation.status)}`}>
                                            {reservation.status}
                                        </span>
                                    </td>
                                    <td>
                                        {reservation.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleCancel(reservation._id)}
                                                disabled={cancelingId === reservation._id}
                                                className="cancel-action-btn"
                                            >
                                                {cancelingId === reservation._id ? 'Cancelling...' : '✕ Cancel'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Reservations;
