import React, { useState, useEffect } from 'react';
import { getAllClassrooms, createClassroom, deleteClassroom } from '../../services/facilitiesService';
import './Classrooms.css';

const Classrooms = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        building: '',
        floor: '',
        capacity: '',
        type: 'lecture',
        resources: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchClassrooms = async () => {
        try {
            setLoading(true);
            const data = await getAllClassrooms();
            setClassrooms(data.classrooms || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching classrooms:', err);
            setError(err.response?.data?.message || 'Failed to load classrooms');
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
            const dataToSubmit = {
                ...formData,
                capacity: parseInt(formData.capacity),
                floor: formData.floor ? parseInt(formData.floor) : null,
                resources: formData.resources ? formData.resources.split(',').map(r => r.trim()) : []
            };

            const result = await createClassroom(dataToSubmit);

            if (result.success) {
                setSuccessMessage('Classroom created successfully!');
                setFormData({
                    name: '',
                    building: '',
                    floor: '',
                    capacity: '',
                    type: 'lecture',
                    resources: '',
                });
                setShowForm(false);
                await fetchClassrooms();

                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (err) {
            console.error('Error creating classroom:', err);
            setError(err.response?.data?.message || 'Failed to create classroom');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredClassrooms = classrooms.filter(classroom =>
        classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        classroom.building.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (classroomId, classroomName) => {
        if (window.confirm(`Are you sure you want to delete "${classroomName}"? This action cannot be undone.`)) {
            try {
                setDeletingId(classroomId);
                await deleteClassroom(classroomId);
                setSuccessMessage('Classroom deleted successfully!');
                await fetchClassrooms();
                setTimeout(() => setSuccessMessage(''), 3000);
            } catch (err) {
                console.error('Error deleting classroom:', err);
                setError(err.response?.data?.message || 'Failed to delete classroom');
            } finally {
                setDeletingId(null);
            }
        }
    };

    return (
        <div className="classrooms-page">
            <div className="page-header">
                <h2>Classrooms</h2>
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="add-btn"
                >
                    {showForm ? '✕ Cancel' : '+ Add Classroom'}
                </button>
            </div>

            {successMessage && <div className="success-message">✓ {successMessage}</div>}

            {showForm && (
                <div className="form-container">
                    <form onSubmit={handleSubmit} className="classroom-form">
                        <h3>Add New Classroom</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Classroom Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Room 101"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Building *</label>
                                <input
                                    type="text"
                                    name="building"
                                    value={formData.building}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Engineering Block A"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Floor</label>
                                <input
                                    type="number"
                                    name="floor"
                                    value={formData.floor}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 2"
                                />
                            </div>
                            <div className="form-group">
                                <label>Capacity *</label>
                                <input
                                    type="number"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Type</label>
                                <select name="type" value={formData.type} onChange={handleInputChange}>
                                    <option value="lecture">Lecture</option>
                                    <option value="lab">Lab</option>
                                    <option value="tutorial">Tutorial</option>
                                    <option value="exam">Exam</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Resources (comma-separated)</label>
                            <input
                                type="text"
                                name="resources"
                                value={formData.resources}
                                onChange={handleInputChange}
                                placeholder="e.g., Projector, Whiteboard, Smart Board"
                            />
                        </div>

                        <div className="form-buttons">
                            <button type="submit" disabled={submitting} className="submit-btn">
                                {submitting ? 'Creating...' : 'Create Classroom'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="search-section">
                <input
                    type="text"
                    placeholder="Search classrooms by name or building..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button onClick={fetchClassrooms} className="refresh-btn">🔄 Refresh</button>
            </div>

            {loading ? (
                <div className="loading">Loading classrooms...</div>
            ) : error ? (
                <div className="error-message">⚠️ {error}</div>
            ) : filteredClassrooms.length === 0 ? (
                <div className="no-data">No classrooms found</div>
            ) : (
                <div className="classrooms-grid">
                    {filteredClassrooms.map((classroom) => (
                        <div key={classroom._id} className="classroom-card">
                            <div className="classroom-header">
                                <h3>{classroom.name}</h3>
                                <span className={`status-badge ${classroom.isActive ? 'active' : 'inactive'}`}>
                                    {classroom.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <div className="classroom-info">
                                <div className="info-item">
                                    <span className="label">Building:</span>
                                    <span className="value">{classroom.building}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Floor:</span>
                                    <span className="value">{classroom.floor || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Capacity:</span>
                                    <span className="value">{classroom.capacity} students</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Type:</span>
                                    <span className="value">{classroom.type}</span>
                                </div>
                                {classroom.resources && classroom.resources.length > 0 && (
                                    <div className="info-item">
                                        <span className="label">Resources:</span>
                                        <div className="resources-list">
                                            {classroom.resources.map((res, idx) => (
                                                <span key={idx} className="resource-tag">{res}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="classroom-actions">
                                <button
                                    onClick={() => handleDelete(classroom._id, classroom.name)}
                                    disabled={deletingId === classroom._id}
                                    className="delete-btn"
                                >
                                    {deletingId === classroom._id ? 'Deleting...' : '🗑️ Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Classrooms;
