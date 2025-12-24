import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import styles from '../../styles/pages.module.css';
import modalStyles from '../../components/ui/Modal.module.css';

interface Classroom {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  building?: string;
  floor?: string;
  roomType?: string;
  isActive: boolean;
}

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    building: '',
    floor: '',
    type: 'Classroom'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/facilities/rooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setClassrooms(data);
      }
    } catch (error) {
      console.error('Failed to fetch classrooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/facilities/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', description: '', capacity: '', building: '', floor: '', type: 'Classroom' });
        fetchClassrooms();
      }
    } catch (error) {
      console.error('Failed to create classroom:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/facilities/rooms/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchClassrooms();
    } catch (error) {
      console.error('Failed to delete classroom:', error);
    }
  };

  const roomTypes = ['Classroom', 'Laboratory', 'Auditorium', 'Conference Room', 'Computer Lab'];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Classrooms & Facilities</h1>
          <p className={styles.pageSubtitle}>Manage classrooms, laboratories, and other university facilities</p>
        </div>
        {/* Removed Add Classroom button */}
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>🏫</div>
          <div>
            <div className={styles.statValue}>{classrooms.length}</div>
            <div className={styles.statLabel}>Total Rooms</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>✅</div>
          <div>
            <div className={styles.statValue}>{classrooms.filter(c => c.isActive).length}</div>
            <div className={styles.statLabel}>Available</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>🔬</div>
          <div>
            <div className={styles.statValue}>{classrooms.filter(c => c.roomType === 'Laboratory').length}</div>
            <div className={styles.statLabel}>Laboratories</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}>💻</div>
          <div>
            <div className={styles.statValue}>{classrooms.filter(c => c.roomType === 'Computer Lab').length}</div>
            <div className={styles.statLabel}>Computer Labs</div>
          </div>
        </div>
      </div>

      {/* Classroom Grid */}
      {isLoading ? (
        <div className={styles.loading}>Loading classrooms...</div>
      ) : classrooms.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏫</div>
            <div className={styles.emptyTitle}>No Classrooms</div>
            <div className={styles.emptyText}>Add your first classroom to get started</div>
            {/* Removed Add Classroom button in empty state */}
          </div>
        </div>
      ) : (
        <div className={`${styles.grid} ${styles.grid3}`}>
          {classrooms.map((room) => (
            <div key={room.id} className={styles.itemCard}>
              <div className={`${styles.itemIcon} ${room.roomType === 'Laboratory' ? styles.warning : styles.primary}`}>
                {room.roomType === 'Laboratory' ? '🔬' : room.roomType === 'Computer Lab' ? '💻' : '🏫'}
              </div>
              <h3 className={styles.itemTitle}>{room.name}</h3>
              <p className={styles.itemSubtitle}>{room.description || 'No description'}</p>
              <div className={styles.itemMeta}>
                <span>👥 {room.capacity || 30} seats</span>
                <span>🏢 {room.building || 'Main'}</span>
                <span>📍 Floor {room.floor || '1'}</span>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <span className={`${styles.badge} ${room.isActive ? styles.success : styles.danger}`}>
                  {room.isActive ? 'Available' : 'Unavailable'}
                </span>
                <span className={`${styles.badge} ${styles.info}`}>{room.roomType || 'Classroom'}</span>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button className={styles.iconBtn}>✏️</button>
                <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(room.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Classroom Modal */}
      {/* Removed Add Classroom Modal */}
    </div>
  );
}
