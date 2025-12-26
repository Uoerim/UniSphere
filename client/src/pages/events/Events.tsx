import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import styles from '../../styles/pages.module.css';
import eventStyles from './Events.module.css';
import modalStyles from '../../components/ui/Modal.module.css';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  BookOpenIcon, TrophyIcon, TheaterIcon, UsersIcon, 
  FileTextIcon, PartyIcon, CalendarIcon, MapPinIcon, 
  EditIcon, TrashIcon, XIcon, ClockIcon
} from '../../components/ui/Icons';
import styles from './Events.module.css';

// Setup date-fns localizer
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Event {
  id: string;
  title: string;
  description: string;
  date?: string;
  time?: string;
  endTime?: string;
  location?: string;
  eventType?: string;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Event;
}

const EVENT_TYPES = [
  { value: 'general', label: 'General', color: '#6b7280' },
  { value: 'academic', label: 'Academic', color: '#4f6ef7' },
  { value: 'sports', label: 'Sports', color: '#10b981' },
  { value: 'cultural', label: 'Cultural', color: '#f59e0b' },
  { value: 'meeting', label: 'Meeting', color: '#8b5cf6' },
  { value: 'exam', label: 'Exam', color: '#ef4444' },
];

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [currentView, setCurrentView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '09:00',
    endTime: '10:00',
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

  // Convert events to calendar format
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map(event => {
      const eventDate = event.date ? new Date(event.date) : new Date();
      const [startHour = 9, startMin = 0] = (event.time || '09:00').split(':').map(Number);
      const [endHour = 10, endMin = 0] = (event.endTime || event.time || '10:00').split(':').map(Number);
      
      const start = new Date(eventDate);
      start.setHours(startHour, startMin, 0);
      
      const end = new Date(eventDate);
      end.setHours(endHour || startHour + 1, endMin, 0);
      
      return {
        id: event.id,
        title: event.title,
        start,
        end,
        resource: event
      };
    });
  }, [events]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = selectedEvent
        ? `http://localhost:4000/api/community/events/${selectedEvent.id}`
        : 'http://localhost:4000/api/community/events';
      const method = selectedEvent ? 'PUT' : 'POST';

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/community/events/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowEventModal(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const openCreateModal = () => {
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
      endTime: '10:00',
      location: '',
      eventType: 'general'
    });
    setShowModal(true);
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      date: event.date ? event.date.split('T')[0] : '',
      time: event.time || '09:00',
      endTime: event.endTime || event.time || '10:00',
      location: event.location || '',
      eventType: event.eventType || 'general'
    });
    setShowEventModal(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setFormData({ title: '', description: '', date: '', time: '09:00', endTime: '10:00', location: '', eventType: 'general' });
  };

  const handleSelectEvent = useCallback((calEvent: CalendarEvent) => {
    setSelectedEvent(calEvent.resource);
    setShowEventModal(true);
  }, []);

  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    setSelectedEvent(null);
    setFormData({
      title: '',
      description: '',
      date: format(start, 'yyyy-MM-dd'),
      time: format(start, 'HH:mm'),
      endTime: format(new Date(start.getTime() + 60 * 60 * 1000), 'HH:mm'),
      location: '',
      eventType: 'general'
    });
    setShowModal(true);
  }, []);

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const eventType = event.resource.eventType || 'general';
    const typeConfig = EVENT_TYPES.find(t => t.value === eventType);
    const backgroundColor = typeConfig?.color || '#6b7280';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
        fontWeight: 500,
        fontSize: '13px',
        padding: '2px 6px'
      }
    };
  }, []);

  const getEventIcon = (type?: string) => {
    switch (type) {
      case 'academic': return <BookOpenIcon size={20} />;
      case 'sports': return <TrophyIcon size={20} />;
      case 'cultural': return <TheaterIcon size={20} />;
      case 'meeting': return <UsersIcon size={20} />;
      case 'exam': return <FileTextIcon size={20} />;
      default: return <PartyIcon size={20} />;
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (date?: string) => {
    if (!date) return false;
    return new Date(date) >= new Date();
  };

  const upcomingEvents = events.filter(e => isUpcoming(e.date)).slice(0, 5);
  const typeConfig = selectedEvent ? EVENT_TYPES.find(t => t.value === selectedEvent.eventType) : null;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1><CalendarIcon size={28} /> Events</h1>
          <p>Schedule and manage university events</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.viewBtn} ${currentView === 'calendar' ? styles.active : ''}`}
              onClick={() => setCurrentView('calendar')}
            >
              <CalendarIcon size={16} /> Calendar
            </button>
            <button 
              className={`${styles.viewBtn} ${currentView === 'list' ? styles.active : ''}`}
              onClick={() => setCurrentView('list')}
            >
              <FileTextIcon size={16} /> List
            </button>
          </div>
          <button className={styles.createBtn} onClick={openCreateModal}>
            + Create Event
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}><PartyIcon size={24} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{events.length}</span>
            <span className={styles.statLabel}>Total Events</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}><CalendarIcon size={24} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{events.filter(e => isUpcoming(e.date)).length}</span>
            <span className={styles.statLabel}>Upcoming</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><BookOpenIcon size={24} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{events.filter(e => e.eventType === 'academic').length}</span>
            <span className={styles.statLabel}>Academic</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}><TrophyIcon size={24} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{events.filter(e => e.eventType === 'sports').length}</span>
            <span className={styles.statLabel}>Sports</span>
          </div>
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className={styles.loading}>Loading events...</div>
      ) : events.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎉</div>
            <div className={styles.emptyTitle}>No Events Scheduled</div>
            <div className={styles.emptyText}>Create your first event to get started</div>
            <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setIsModalOpen(true)}>
              Create Event
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          {events.map((event) => (
            <div key={event.id} style={{
              padding: '20px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#eef1fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}>
                {getEventIcon(event.eventType)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1f36', margin: 0 }}>
                    {event.title}
                  </h3>
                  <span className={`${styles.badge} ${isUpcoming(event.date) ? styles.success : styles.secondary}`}>
                    {isUpcoming(event.date) ? 'Upcoming' : 'Past'}
                  </span>
                  {event.eventType && (
                    <span className={`${styles.badge} ${styles.primary}`}>
                      {event.eventType}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px 0' }}>
                  {event.description || 'No description provided'}
                </p>
                <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', gap: '16px' }}>
                  <span>📅 {formatDate(event.date)}</span>
                  {event.time && <span>🕐 {event.time}</span>}
                  {event.location && <span>📍 {event.location}</span>}
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.iconBtn} onClick={() => openEditModal(event)}>✏️</button>
                <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(event.id)}>
                  🗑️
                </button>
      {/* Main Content */}
      <div className={styles.mainGrid}>
        {/* Calendar / List View */}
        <div className={styles.calendarCard}>
          {currentView === 'calendar' ? (
            <div className={styles.calendarWrapper}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                view={calendarView}
                onView={(view: View) => setCalendarView(view)}
                date={currentDate}
                onNavigate={(date: Date) => setCurrentDate(date)}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                eventPropGetter={eventStyleGetter}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                popup
                tooltipAccessor={(event: CalendarEvent) => event.resource.description || event.title}
              />
            </div>
          ) : (
            <div className={styles.listView}>
              {events.length === 0 ? (
                <div className={styles.emptyState}>
                  <PartyIcon size={48} />
                  <h3>No Events Scheduled</h3>
                  <p>Create your first event to get started</p>
                  <button className={styles.createBtn} onClick={openCreateModal}>
                    Create Event
                  </button>
                </div>
              ) : (
                <div className={styles.eventsList}>
                  {events.map(event => {
                    const eventTypeConfig = EVENT_TYPES.find(t => t.value === event.eventType);
                    return (
                      <div 
                        key={event.id} 
                        className={styles.eventListItem}
                        onClick={() => { setSelectedEvent(event); setShowEventModal(true); }}
                      >
                        <div 
                          className={styles.eventColorBar} 
                          style={{ backgroundColor: eventTypeConfig?.color || '#6b7280' }}
                        />
                        <div className={styles.eventListIcon}>
                          {getEventIcon(event.eventType)}
                        </div>
                        <div className={styles.eventListContent}>
                          <h4>{event.title}</h4>
                          <div className={styles.eventListMeta}>
                            <span><CalendarIcon size={14} /> {formatDate(event.date)}</span>
                            {event.time && <span><ClockIcon size={14} /> {event.time}</span>}
                            {event.location && <span><MapPinIcon size={14} /> {event.location}</span>}
                          </div>
                        </div>
                        <span 
                          className={styles.eventTypeBadge}
                          style={{ backgroundColor: eventTypeConfig?.color || '#6b7280' }}
                        >
                          {eventTypeConfig?.label || 'General'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Upcoming Events */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            <h3>Upcoming Events</h3>
            {upcomingEvents.length === 0 ? (
              <p className={styles.noEvents}>No upcoming events</p>
            ) : (
              <div className={styles.upcomingList}>
                {upcomingEvents.map(event => {
                  const eventTypeConfig = EVENT_TYPES.find(t => t.value === event.eventType);
                  return (
                    <div 
                      key={event.id} 
                      className={styles.upcomingItem}
                      onClick={() => { setSelectedEvent(event); setShowEventModal(true); }}
                    >
                      <div 
                        className={styles.upcomingDot}
                        style={{ backgroundColor: eventTypeConfig?.color || '#6b7280' }}
                      />
                      <div className={styles.upcomingContent}>
                        <span className={styles.upcomingTitle}>{event.title}</span>
                        <span className={styles.upcomingDate}>
                          {event.date ? format(new Date(event.date), 'MMM d, yyyy') : 'TBD'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Event Type Legend */}
          <div className={styles.sidebarCard}>
            <h3>Event Types</h3>
            <div className={styles.legendList}>
              {EVENT_TYPES.map(type => (
                <div key={type.value} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ backgroundColor: type.color }} />
                  <span>{type.label}</span>
                  <span className={styles.legendCount}>
                    {events.filter(e => e.eventType === type.value).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className={styles.modal} onClick={() => setShowEventModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader} style={{ borderColor: typeConfig?.color }}>
              <div className={styles.modalEventIcon} style={{ backgroundColor: typeConfig?.color }}>
                {getEventIcon(selectedEvent.eventType)}
              </div>
              <div className={styles.modalEventInfo}>
                <h2>{selectedEvent.title}</h2>
                <span className={styles.eventTypeBadge} style={{ backgroundColor: typeConfig?.color }}>
                  {typeConfig?.label || 'General'}
                </span>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowEventModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {selectedEvent.description && (
                <p className={styles.eventDescription}>{selectedEvent.description}</p>
              )}
              <div className={styles.eventDetails}>
                <div className={styles.eventDetailItem}>
                  <CalendarIcon size={18} />
                  <span>{formatDate(selectedEvent.date)}</span>
                </div>
                {selectedEvent.time && (
                  <div className={styles.eventDetailItem}>
                    <ClockIcon size={18} />
                    <span>{selectedEvent.time}{selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ''}</span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className={styles.eventDetailItem}>
                    <MapPinIcon size={18} />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.editBtn} onClick={() => openEditModal(selectedEvent)}>
                <EditIcon size={16} /> Edit
              </button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(selectedEvent.id)}>
                <TrashIcon size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className={styles.modal} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedEvent ? 'Edit Event' : 'Create Event'}</h2>
              <button className={styles.closeBtn} onClick={closeModal}>
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label>Event Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title..."
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the event..."
                    rows={3}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>End Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Main Auditorium"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Event Type</label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    >
                      {EVENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.submitBtn}
                  disabled={isSubmitting || !formData.title}
                >
                  {isSubmitting ? 'Saving...' : (selectedEvent ? 'Save Changes' : 'Create Event')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
