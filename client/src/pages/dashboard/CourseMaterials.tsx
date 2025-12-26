import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/pages.module.css';

interface Material {
  id: string;
  title: string;
  type: string;
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
  const [newPdfTitle, setNewPdfTitle] = useState('');
  const [newPdfUrl, setNewPdfUrl] = useState('');
  const [selectedPdfName, setSelectedPdfName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handlePickPdf = () => {
    fileInputRef.current?.click();
  };

  const handlePdfSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setMessage('Please select a PDF file');
      setTimeout(() => setMessage(''), 2500);
      return;
    }
    setSelectedPdfName(file.name);
    if (!newPdfTitle) {
      setNewPdfTitle(file.name.replace(/\.pdf$/i, ''));
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setNewPdfUrl(dataUrl);
    };
    reader.onerror = () => {
      setMessage('Failed to read PDF file');
      setTimeout(() => setMessage(''), 2500);
    };
    reader.readAsDataURL(file);
  };

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

      {/* Add PDF Material */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2>Add PDF Material</h2>
        </div>
        <div style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="PDF Title"
            value={newPdfTitle}
            onChange={(e) => setNewPdfTitle(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', minWidth: '220px', flex: '1' }}
          />
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className={`${styles.actionBtn} ${styles.secondary}`}
              type="button"
              onClick={handlePickPdf}
            >
              Choose PDF
            </button>
            <span style={{ fontSize: '12px', color: '#666' }}>
              {selectedPdfName || 'No file selected'}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              style={{ display: 'none' }}
              onChange={handlePdfSelected}
            />
          </div>
          <button
            className={`${styles.actionBtn} ${styles.primary}`}
            onClick={async () => {
              if (!newPdfTitle || !newPdfUrl || !courseId) {
                setMessage('Please select a PDF and provide a title');
                return;
              }
              try {
                setUploading(true);
                const payload = {
                  title: newPdfTitle,
                  type: 'RESOURCE', // maps to MaterialType enum; still shown as PDF in UI
                  fileUrl: newPdfUrl,
                  fileSize: selectedPdfName ? `${Math.round((newPdfUrl.length * 3) / 4 / (1024 * 1024))} MB` : undefined
                };
                const res = await fetch(`http://localhost:4000/api/staff-dashboard/course/${courseId}/materials`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(payload)
                });
                if (res.ok) {
                  const added = await res.json();
                  // Force type label to PDF for display even though stored as RESOURCE
                  setMaterials((prev) => [...prev, { ...added, type: 'PDF' }]);
                  setNewPdfTitle('');
                  setNewPdfUrl('');
                  setSelectedPdfName('');
                  setMessage('PDF added successfully');
                } else {
                  const text = await res.text().catch(() => '');
                  setMessage(`Failed to add PDF (${res.status}): ${text || 'Server error'}`);
                }
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setMessage(`Error while adding PDF: ${msg}`);
              } finally {
                setUploading(false);
                setTimeout(() => setMessage(''), 3000);
              }
            }}
            disabled={uploading}
          >
            {uploading ? 'Adding...' : 'Add PDF'}
          </button>
          {message && (
            <span style={{ color: message.includes('success') ? '#2e7d32' : '#c62828' }}>{message}</span>
          )}
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
                <span className={`${styles.badge} ${styles.info}`}>
                  {material.type}
                </span>
                {material.fileUrl ? (
                  <a
                    href={material.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.actionBtn} ${styles.primary}`}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Open
                  </a>
                ) : (
                  <button className={`${styles.actionBtn} ${styles.primary}`} style={{ whiteSpace: 'nowrap' }} disabled>
                    No File
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  function getTypeIcon(type: Material['type']) {
    switch (type) {
      case 'PDF': return '📄';
      case 'lecture': return '📄';
      case 'reading': return '📖';
      case 'video': return '🎥';
      case 'resource': return '📦';
      default: return '📎';
    }
  }

  // Simplify badge class for arbitrary material types like 'PDF'
}
