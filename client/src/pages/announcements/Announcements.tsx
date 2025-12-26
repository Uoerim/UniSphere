import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { MegaphoneIcon, CheckCircleIcon, AlertCircleIcon, CalendarIcon, EditIcon, TrashIcon } from '../../components/ui/Icons';
import styles from '../../styles/pages.module.css';
import modalStyles from '../../components/ui/Modal.module.css';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority?: string;
  targetAudience?: string;
  createdAt: string;
  isActive: boolean;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [courses, setCourses] = useState<{ id: string; name: string; code?: string }[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetAudience: 'all',
    courseId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/curriculum/my-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data || []);
        if (data?.length) {
          setFormData(prev => ({ ...prev, courseId: data[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/community/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingAnnouncement
        ? `http://localhost:4000/api/community/announcements/${editingAnnouncement.id}`
        : 'http://localhost:4000/api/community/announcements';
      const method = editingAnnouncement ? 'PUT' : 'POST';

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
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Failed to save announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content || '',
      priority: announcement.priority || 'normal',
      targetAudience: announcement.targetAudience || 'all',
      courseId: (announcement as any).course?.id || courses[0]?.id || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
    setFormData({ title: '', content: '', priority: 'normal', targetAudience: 'all', courseId: courses[0]?.id || '' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/community/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to delete announcement:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return styles.danger;
      case 'medium': return styles.warning;
      default: return styles.info;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Announcements</h1>
          <p className={styles.pageSubtitle}>Create and manage university-wide announcements</p>
        </div>
        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setIsModalOpen(true)}>
          + New Announcement
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}><MegaphoneIcon /></div>
          <div>
            <div className={styles.statValue}>{announcements.length}</div>
            <div className={styles.statLabel}>Total Announcements</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}><CheckCircleIcon /></div>
          <div>
            <div className={styles.statValue}>{announcements.filter(a => a.isActive).length}</div>
            <div className={styles.statLabel}>Active</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.danger}`}><AlertCircleIcon /></div>
          <div>
            <div className={styles.statValue}>{announcements.filter(a => a.priority === 'high').length}</div>
            <div className={styles.statLabel}>High Priority</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><CalendarIcon /></div>
          <div>
            <div className={styles.statValue}>{announcements.filter(a => {
              const created = new Date(a.createdAt);
              const now = new Date();
              return (now.getTime() - created.getTime()) < 7 * 24 * 60 * 60 * 1000;
            }).length}</div>
            <div className={styles.statLabel}>This Week</div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className={styles.loading}>Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><MegaphoneIcon /></div>
            <div className={styles.emptyTitle}>No Announcements</div>
            <div className={styles.emptyText}>Create your first announcement to inform the community</div>
            <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setIsModalOpen(true)}>
              Create Announcement
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          {announcements.map((announcement) => (
            <div key={announcement.id} style={{
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
                <MegaphoneIcon />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a1f36', margin: 0 }}>
                    {announcement.title}
                  </h3>
                  <span className={`${styles.badge} ${getPriorityColor(announcement.priority)}`}>
                    {announcement.priority || 'Normal'}
                  </span>
                  {announcement.targetAudience && announcement.targetAudience !== 'all' && (
                    <span className={`${styles.badge} ${styles.primary}`}>
                      {announcement.targetAudience}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 12px 0' }}>
                  {announcement.content}
                </p>
                <div style={{ fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarIcon /> {formatDate(announcement.createdAt)}
                </div>
              </div>
              <div className={styles.actions}>
                <button className={styles.iconBtn} onClick={() => openEditModal(announcement)}><EditIcon /></button>
                <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(announcement.id)}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Announcement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
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
              {isSubmitting ? 'Saving...' : (editingAnnouncement ? 'Save Changes' : 'Publish Announcement')}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className={modalStyles.formGroup}>
            <label>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Announcement title..."
              required
            />
          </div>
          <div className={modalStyles.formGroup}>
            <label>Content *</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your announcement..."
              style={{ minHeight: '150px' }}
              required
            />
          </div>
          <div className={modalStyles.formRow}>
            <div className={modalStyles.formGroup}>
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className={modalStyles.formGroup}>
              <label>Target Audience</label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              >
                <option value="all">Everyone</option>
                <option value="students">Students Only</option>
                <option value="staff">Staff Only</option>
                <option value="parents">Parents Only</option>
              </select>
            </div>
          </div>
          <div className={modalStyles.formGroup}>
            <label>Course *</label>
            <select
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              required
            >
              <option value="">Select course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.code ? `${course.code} - ${course.name}` : course.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
