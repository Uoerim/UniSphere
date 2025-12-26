import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/pages.module.css';

interface Material {
  id: string;
  title: string;
  type: 'lecture' | 'reading' | 'resource' | 'video';
  uploadedDate: string;
  size: string;
  fileUrl?: string;
}

export default function CourseMaterials() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/api/staff-dashboard/course/${courseId}/materials`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMaterials(data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load materials');
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [courseId, token]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📚 Course Materials - {courseCode}: {courseName}</h1>
          <p className={styles.pageSubtitle}>Download and view course materials</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Available Materials ({materials.length})</h2>
        </div>
        <div style={{ padding: '16px', display: 'grid', gap: '12px' }}>
          {materials.map(material => (
            <div key={material.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <span style={{ fontSize: '24px' }}>{getTypeIcon(material.type)}</span>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>{material.title}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Uploaded: {material.uploadedDate} • Size: {material.size}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`${styles.badge} ${getTypeBadgeClass(material.type)}`}>
                  {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
                </span>
                <button className={`${styles.actionBtn} ${styles.primary}`} style={{ whiteSpace: 'nowrap' }}>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  function getTypeIcon(type: Material['type']) {
    switch (type) {
      case 'lecture': return '📄';
      case 'reading': return '📖';
      case 'video': return '🎥';
      case 'resource': return '📦';
      default: return '📎';
    }
  }

  function getTypeBadgeClass(type: Material['type']) {
    switch (type) {
      case 'lecture': return styles.primary;
      case 'reading': return styles.info;
      case 'video': return styles.warning;
      case 'resource': return styles.success;
      default: return styles.secondary;
    }
  }
}
