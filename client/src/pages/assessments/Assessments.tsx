import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Modal from "../../components/ui/Modal";
import styles from "../../styles/pages.module.css";
import modalStyles from "../../components/ui/Modal.module.css";

type AssessmentType = "FINALS" | "MIDTERMS" | "QUIZZES";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface Assessment {
  id: string;
  name: string;
  description?: string;
  assessmentType?: string;
  totalMarks?: number;
  passingMarks?: number;
  course?: Course;
  date?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  weight?: number;
  room?: string;
  instructions?: string;
  createdAt: string;
  isActive?: boolean;
}

const ASSESSMENT_TYPES: AssessmentType[] = ["FINALS", "MIDTERMS", "QUIZZES"];

export default function Assessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "QUIZZES" as AssessmentType,
    courseId: "",
    date: "",
    startTime: "",
    endTime: "",
    duration: 60,
    totalPoints: 100,
    weight: 10,
    location: "",
    instructions: "",
  });

  useEffect(() => {
    fetchAssessments();
    fetchCourses();
  }, []);

  const fetchAssessments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/assessments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssessments(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/curriculum', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const allCourses = await response.json();
        const myCourses = allCourses.filter((course: any) => 
          course.instructor?.accountId === user?.id || 
          course.instructor?.email === user?.email
        );
        setCourses(myCourses.length > 0 ? myCourses : allCourses);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "QUIZZES",
      courseId: courses && courses.length > 0 ? courses[0].id : "",
      date: "",
      startTime: "",
      endTime: "",
      duration: 60,
      totalPoints: 100,
      weight: 10,
      location: "",
      instructions: "",
    });
    setFormError(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setFormData({
      title: assessment.name || "",
      description: assessment.description || "",
      type: assessment.assessmentType === 'Final' ? 'FINALS' : 
            assessment.assessmentType === 'Midterm' ? 'MIDTERMS' : 'QUIZZES',
      courseId: assessment.course?.id || "",
      date: assessment.date ? assessment.date.split("T")[0] : "",
      startTime: assessment.startTime || "",
      endTime: assessment.endTime || "",
      duration: assessment.duration || 60,
      totalPoints: assessment.totalMarks || 100,
      weight: assessment.weight || 10,
      location: assessment.room || "",
      instructions: assessment.instructions || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowDeleteModal(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (!formData.title.trim()) {
        setFormError("Title is required");
        setFormLoading(false);
        return;
      }
      if (!formData.courseId) {
        setFormError("Please select a course");
        setFormLoading(false);
        return;
      }
      if (!formData.date) {
        setFormError("Date is required");
        setFormLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const assessmentTypeMap: Record<string, string> = {
        'FINALS': 'Final',
        'MIDTERMS': 'Midterm',
        'QUIZZES': 'Quiz'
      };

      const payload = {
        name: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        assessmentType: assessmentTypeMap[formData.type] || 'Quiz',
        totalMarks: formData.totalPoints,
        passingMarks: formData.totalPoints * 0.5,
        duration: formData.duration,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.location,
        instructions: formData.instructions,
        weight: formData.weight
      };

      const response = await fetch('http://localhost:4000/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to create assessment');
      }

      setShowAddModal(false);
      resetForm();
      await fetchAssessments();
    } catch (err: any) {
      console.error("Failed to create assessment:", err);
      setFormError(err.message || "Failed to create assessment");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    setFormLoading(true);
    setFormError(null);

    try {
      const token = localStorage.getItem('token');
      const assessmentTypeMap: Record<string, string> = {
        'FINALS': 'Final',
        'MIDTERMS': 'Midterm',
        'QUIZZES': 'Quiz'
      };

      const payload = {
        name: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        assessmentType: assessmentTypeMap[formData.type] || 'Quiz',
        totalMarks: formData.totalPoints,
        passingMarks: formData.totalPoints * 0.5,
        duration: formData.duration,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.location,
        instructions: formData.instructions,
        weight: formData.weight
      };

      const response = await fetch(`http://localhost:4000/api/assessments/${selectedAssessment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to update assessment');
      }

      setShowEditModal(false);
      await fetchAssessments();
    } catch (err: any) {
      setFormError(err.message || "Failed to update assessment");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedAssessment) return;
    setFormLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/assessments/${selectedAssessment.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete assessment');
      }

      setShowDeleteModal(false);
      await fetchAssessments();
    } catch (err) {
      alert("Failed to delete assessment");
    } finally {
      setFormLoading(false);
    }
  };

  const stats = {
    total: assessments.length,
    finals: assessments.filter(a => a.assessmentType === 'Final').length,
    midterms: assessments.filter(a => a.assessmentType === 'Midterm').length,
    quizzes: assessments.filter(a => a.assessmentType === 'Quiz').length,
  };

  const getAssessmentIcon = (type?: string) => {
    switch(type) {
      case 'Final': return '🎓';
      case 'Midterm': return '📋';
      case 'Quiz': return '✏️';
      default: return '📝';
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

  const renderFormContent = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Title *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="Assessment title"
          style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Type *</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as AssessmentType })}
          required
          style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        >
          <option value="FINALS">Final</option>
          <option value="MIDTERMS">Midterm</option>
          <option value="QUIZZES">Quiz</option>
        </select>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Course *</label>
        <select
          value={formData.courseId}
          onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
          required
          style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.code} - {course.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Date *</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
          style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Points *</label>
        <input
          type="number"
          value={formData.totalPoints}
          onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) || 0 })}
          required
          min="1"
          style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          placeholder="Brief description"
          style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Assessments</h1>
          <p className={styles.pageSubtitle}>Manage finals, midterms, and quizzes</p>
        </div>
        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={handleAdd}>
          + Create Assessment
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>📝</div>
          <div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>🎓</div>
          <div>
            <div className={styles.statValue}>{stats.finals}</div>
            <div className={styles.statLabel}>Finals</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}>📋</div>
          <div>
            <div className={styles.statValue}>{stats.midterms}</div>
            <div className={styles.statLabel}>Midterms</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>✏️</div>
          <div>
            <div className={styles.statValue}>{stats.quizzes}</div>
            <div className={styles.statLabel}>Quizzes</div>
          </div>
        </div>
      </div>

      {/* Assessments List */}
      {loading ? (
        <div className={styles.loading}>Loading assessments...</div>
      ) : assessments.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <div className={styles.emptyTitle}>No Assessments</div>
            <div className={styles.emptyText}>Create your first assessment to get started</div>
            <button className={`${styles.actionBtn} ${styles.primary}`} onClick={handleAdd}>
              Create Assessment
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          {assessments.map((assessment) => (
            <div key={assessment.id} style={{
              padding: '20px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              <div style={{ fontSize: '28px', minWidth: '40px', textAlign: 'center' }}>
                {getAssessmentIcon(assessment.assessmentType)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1f36' }}>
                    {assessment.name}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280'
                  }}>
                    {assessment.assessmentType || 'N/A'}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                  {assessment.course?.code} - {assessment.course?.name}
                </p>
                {assessment.description && (
                  <p style={{ margin: '8px 0', fontSize: '14px', color: '#6b7280' }}>
                    {assessment.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '13px', color: '#9ca3af' }}>
                  <span>📅 {formatDate(assessment.date)}</span>
                  {assessment.totalMarks && <span>⭐ {assessment.totalMarks} points</span>}
                  {assessment.duration && <span>⏱️ {assessment.duration} min</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(assessment)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f0f4f8',
                    color: '#4f6ef7',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e5ebf6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f0f4f8'; }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(assessment)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#fee2e2',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fecaca'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Create Assessment"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={modalStyles.btn}
              onClick={() => setShowAddModal(false)}
              style={{ backgroundColor: '#f3f4f6', color: '#1a1f36', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={modalStyles.btn}
              onClick={handleSubmitAdd}
              disabled={formLoading}
              style={{ backgroundColor: '#4f6ef7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              {formLoading ? "Creating..." : "Create Assessment"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitAdd}>
          {formError && <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px' }}>{formError}</div>}
          {renderFormContent()}
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Assessment"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={modalStyles.btn}
              onClick={() => setShowEditModal(false)}
              style={{ backgroundColor: '#f3f4f6', color: '#1a1f36', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={modalStyles.btn}
              onClick={handleSubmitEdit}
              disabled={formLoading}
              style={{ backgroundColor: '#4f6ef7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              {formLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitEdit}>
          {formError && <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px' }}>{formError}</div>}
          {renderFormContent()}
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Assessment"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={modalStyles.btn}
              onClick={() => setShowDeleteModal(false)}
              style={{ backgroundColor: '#f3f4f6', color: '#1a1f36', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={modalStyles.btn}
              onClick={handleSubmitDelete}
              disabled={formLoading}
              style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
            >
              {formLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        }
      >
        {selectedAssessment && (
          <div>
            <p>Are you sure you want to delete <strong>{selectedAssessment.name}</strong>?</p>
            <p style={{ color: '#dc2626' }}>This action cannot be undone.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
