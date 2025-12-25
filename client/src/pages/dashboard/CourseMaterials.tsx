import { useParams } from 'react-router-dom';
import styles from '../../styles/pages.module.css';

interface Material {
  id: string;
  title: string;
  type: 'lecture' | 'reading' | 'resource' | 'video';
  uploadedDate: string;
  size: string;
}

export default function CourseMaterials() {
  const { courseId } = useParams();

  const courseData: Record<string, { code: string; name: string; materials: Material[] }> = {
    '1': {
      code: 'CS101',
      name: 'Introduction to Programming',
      materials: [
        { id: '1', title: 'Week 1 - Introduction to Python', type: 'lecture', uploadedDate: '2025-12-20', size: '45 MB' },
        { id: '2', title: 'Python Basics Guide', type: 'reading', uploadedDate: '2025-12-19', size: '2.5 MB' },
        { id: '3', title: 'Setting up Development Environment', type: 'video', uploadedDate: '2025-12-18', size: '120 MB' },
        { id: '4', title: 'Week 1 Practice Problems', type: 'resource', uploadedDate: '2025-12-17', size: '1.2 MB' },
      ],
    },
    '2': {
      code: 'CS201',
      name: 'Data Structures',
      materials: [
        { id: '5', title: 'Arrays and Linked Lists', type: 'lecture', uploadedDate: '2025-12-21', size: '55 MB' },
        { id: '6', title: 'Data Structures Handbook', type: 'reading', uploadedDate: '2025-12-20', size: '3.8 MB' },
        { id: '7', title: 'Tree Traversal Algorithms', type: 'video', uploadedDate: '2025-12-19', size: '150 MB' },
      ],
    },
    '3': {
      code: 'CS301',
      name: 'Web Development',
      materials: [
        { id: '8', title: 'HTML & CSS Fundamentals', type: 'lecture', uploadedDate: '2025-12-22', size: '65 MB' },
        { id: '9', title: 'Web Dev Best Practices', type: 'reading', uploadedDate: '2025-12-21', size: '2.1 MB' },
        { id: '10', title: 'Responsive Design Tutorial', type: 'video', uploadedDate: '2025-12-20', size: '180 MB' },
        { id: '11', title: 'CSS Flexbox Guide', type: 'resource', uploadedDate: '2025-12-19', size: '1.5 MB' },
      ],
    },
  };

  const course = courseData[courseId || '1'];

  const getTypeIcon = (type: Material['type']) => {
    switch (type) {
      case 'lecture': return '📄';
      case 'reading': return '📖';
      case 'video': return '🎥';
      case 'resource': return '📦';
      default: return '📎';
    }
  };

  const getTypeBadgeClass = (type: Material['type']) => {
    switch (type) {
      case 'lecture': return styles.primary;
      case 'reading': return styles.info;
      case 'video': return styles.warning;
      case 'resource': return styles.success;
      default: return styles.secondary;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📚 Course Materials - {course.code}: {course.name}</h1>
          <p className={styles.pageSubtitle}>Download and view course materials</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Available Materials ({course.materials.length})</h2>
        </div>
        <div style={{ padding: '16px', display: 'grid', gap: '12px' }}>
          {course.materials.map(material => (
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
}
