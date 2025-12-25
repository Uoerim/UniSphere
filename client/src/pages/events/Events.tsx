import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { BookOpenIcon, TrophyIcon, TheaterIcon, UsersIcon, FileTextIcon, PartyIcon, CalendarIcon, MapPinIcon, EditIcon, TrashIcon } from '../../components/ui/Icons';
import styles from '../../styles/pages.module.css';
import modalStyles from '../../components/ui/Modal.module.css';

interface Event {
  id: string;
  title: string;
  description: string;
  date?: string;
  time?: string;
  location?: string;
  eventType?: string;
  createdAt: string;
}

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    eventType: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/community/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingEvent
        ? `http://localhost:4000/api/community/events/${editingEvent.id}`
        : 'http://localhost:4000/api/community/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        closeModal();
        fetchEvents();
      }
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      eventType: event.eventType || 'general'
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    setFormData({ title: '', description: '', date: '', time: '', location: '', eventType: 'general' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/community/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventIcon = (type?: string) => {
    switch (type) {
      case 'academic': return <BookOpenIcon size={24} />;
      case 'sports': return <TrophyIcon size={24} />;
      case 'cultural': return <TheaterIcon size={24} />;
      case 'meeting': return <UsersIcon size={24} />;
      case 'exam': return <FileTextIcon size={24} />;
      default: return <PartyIcon size={24} />;
    }
  };

  const isUpcoming = (date?: string) => {
    if (!date) return false;
    return new Date(date) >= new Date();
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Events</h1>
          <p className={styles.pageSubtitle}>Schedule and manage university events</p>
        </div>
        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setIsModalOpen(true)}>
          + Create Event
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}><PartyIcon size={24} /></div>
          <div>
            <div className={styles.statValue}>{events.length}</div>
            <div className={styles.statLabel}>Total Events</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}><CalendarIcon size={24} /></div>
          <div>
            <div className={styles.statValue}>{events.filter(e => isUpcoming(e.date)).length}</div>
            <div className={styles.statLabel}>Upcoming</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><BookOpenIcon size={24} /></div>
          <div>
            <div className={styles.statValue}>{events.filter(e => e.eventType === 'academic').length}</div>
            <div className={styles.statLabel}>Academic</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}><TrophyIcon size={24} /></div>
          <div>
            <div className={styles.statValue}>{events.filter(e => e.eventType === 'sports').length}</div>
            <div className={styles.statLabel}>Sports</div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className={styles.loading}>Loading events...</div>
      ) : events.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><PartyIcon size={48} /></div>
            <div className={styles.emptyTitle}>No Events Scheduled</div>
            <div className={styles.emptyText}>Create your first event to get started</div>
            <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setIsModalOpen(true)}>
              Create Event
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {events.map((event) => (
            <div key={event.id} className={styles.gridCard} style={{
              borderLeft: `4px solid ${isUpcoming(event.date) ? '#4f6ef7' : '#9ca3af'}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: '#eef1fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {getEventIcon(event.eventType)}
                </div>
                <div className={styles.actions} style={{ flexDirection: 'row' }}>
                  <button className={styles.iconBtn} onClick={() => openEditModal(event)}><EditIcon size={16} /></button>
                  <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(event.id)}>
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1f36', margin: '0 0 8px 0' }}>
                {event.title}
              </h3>

              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px 0', minHeight: '40px' }}>
                {event.description || 'No description provided'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                  <CalendarIcon size={14} />
                  <span>{formatDate(event.date)}</span>
                  {event.time && <span>at {event.time}</span>}
                </div>
                {event.location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                    <MapPinIcon size={14} />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                <span className={`${styles.badge} ${isUpcoming(event.date) ? styles.success : styles.secondary}`}>
                  {isUpcoming(event.date) ? 'Upcoming' : 'Past'}
                </span>
                {event.eventType && (
                  <span className={`${styles.badge} ${styles.primary}`} style={{ marginLeft: '8px' }}>
                    {event.eventType}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingEvent ? 'Edit Event' : 'Create Event'}
        size="lg"
        footer={
          <>
            <button className={`${modalStyles.btn} ${modalStyles.secondary}`} onClick={closeModal}>
              Cancel
            </button>
            <button
              className={`${modalStyles.btn} ${modalStyles.primary}`}
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title}
            >
              {isSubmitting ? 'Saving...' : (editingEvent ? 'Save Changes' : 'Create Event')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className={modalStyles.formGroup}>
            <label>Event Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter event title..."
              required
            />
          </div>
          <div className={modalStyles.formGroup}>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the event..."
              style={{ minHeight: '100px' }}
            />
          </div>
          <div className={modalStyles.formRow}>
            <div className={modalStyles.formGroup}>
              <label>Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label>Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>
          <div className={modalStyles.formRow}>
            <div className={modalStyles.formGroup}>
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Main Auditorium"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label>Event Type</label>
              <select
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
              >
                <option value="general">General</option>
                <option value="academic">Academic</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
                <option value="meeting">Meeting</option>
                <option value="exam">Exam</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
