import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import styles from "../../styles/pages.module.css";
import modalStyles from "../../components/ui/Modal.module.css";

type AssignmentStatus = "Draft" | "Published" | "Closed" | "Archived";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface Assignment {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  status?: AssignmentStatus;
  course?: Course;
  dueDate?: string;
  dueTime?: string;
  totalPoints?: number;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
  instructions?: string;
  createdAt: string;
  isActive?: boolean;
}

const ASSIGNMENT_STATUSES: AssignmentStatus[] = ["Draft", "Published", "Closed", "Archived"];

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "Draft" as AssignmentStatus,
    courseId: "",
    dueDate: "",
    dueTime: "",
    totalPoints: 100,
    weight: 10,
    allowLateSubmission: false,
    latePenalty: 10,
    instructions: "",
  });

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch assignments:", err);
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
        // Show filtered courses if available, otherwise show all courses
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
      status: "Draft",
      courseId: courses[0]?.id || "",
      dueDate: "",
      dueTime: "",
      totalPoints: 100,
      weight: 10,
      allowLateSubmission: false,
      latePenalty: 10,
      instructions: "",
    });
    setFormError(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setFormData({
      title: assignment.name || assignment.title || "",
      description: assignment.description || "",
      status: (assignment.status as AssignmentStatus) || "Draft",
      courseId: assignment.course?.id || "",
      dueDate: assignment.dueDate ? assignment.dueDate.split("T")[0] : "",
      dueTime: assignment.dueTime || "",
      totalPoints: assignment.totalPoints || 100,
      weight: 10,
      allowLateSubmission: assignment.allowLateSubmission || false,
      latePenalty: assignment.latePenaltyPercent || 10,
      instructions: assignment.instructions || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
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
      if (!formData.dueDate) {
        setFormError("Due date is required");
        setFormLoading(false);
        return;
      }

      const token = localStorage.getItem('token');

      const payload = {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        status: formData.status,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        totalPoints: formData.totalPoints,
        allowLateSubmission: formData.allowLateSubmission,
        latePenaltyPercent: formData.latePenalty,
        instructions: formData.instructions,
        submissionType: 'File'
      };

      const response = await fetch('http://localhost:4000/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to create assignment');
      }

      setShowAddModal(false);
      resetForm();
      await fetchAssignments();
    } catch (err: any) {
      console.error("Failed to create assignment:", err);
      setFormError(err.message || "Failed to create assignment");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setFormLoading(true);
    setFormError(null);

    try {
      const token = localStorage.getItem('token');

      const payload = {
        title: formData.title,
        description: formData.description,
        courseId: formData.courseId,
        status: formData.status,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime,
        totalPoints: formData.totalPoints,
        allowLateSubmission: formData.allowLateSubmission,
        latePenaltyPercent: formData.latePenalty,
        instructions: formData.instructions,
      };

      const response = await fetch(`http://localhost:4000/api/assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to update assignment');
      }

      setShowEditModal(false);
      await fetchAssignments();
    } catch (err: any) {
      setFormError(err.message || "Failed to update assignment");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedAssignment) return;
    setFormLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/assignments/${selectedAssignment.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }

      setShowDeleteModal(false);
      await fetchAssignments();
    } catch (err) {
      alert("Failed to delete assignment");
    } finally {
      setFormLoading(false);
    }
  };

  const stats = {
    total: assignments.length,
    draft: assignments.filter(a => a.status === 'Draft').length,
    published: assignments.filter(a => a.status === 'Published').length,
    closed: assignments.filter(a => a.status === 'Closed').length,
    archived: assignments.filter(a => a.status === 'Archived').length,
  };

  const getStatusIcon = (status?: string) => {
    switch(status) {
      case 'Published': return '📤';
      case 'Draft': return '📝';
      case 'Closed': return '🔒';
      case 'Archived': return '📦';
      default: return '📄';
    }
  };

  const getStatusColor = (status?: string) => {
    switch(status) {
      case 'Published': return '#10b981';
      case 'Draft': return '#f59e0b';
      case 'Closed': return '#ef4444';
      case 'Archived': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  const formatDate = (date?: string, time?: string) => {
    if (!date) return 'TBD';
    const d = new Date(date);
    const formatted = d.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return time ? `${formatted} at ${time}` : formatted;
  };

  const getDaysUntilDue = (date?: string) => {
    if (!date) return null;
    const due = new Date(date);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `Due in ${diff} days`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Assignments</h1>
          <p className={styles.pageSubtitle}>Create and manage assignments for your courses</p>
        </div>
        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={handleAdd}>
          + Create Assignment
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>📄</div>
          <div>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>📝</div>
          <div>
            <div className={styles.statValue}>{stats.draft}</div>
            <div className={styles.statLabel}>Drafts</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>📤</div>
          <div>
            <div className={styles.statValue}>{stats.published}</div>
            <div className={styles.statLabel}>Published</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}>🔒</div>
          <div>
            <div className={styles.statValue}>{stats.closed}</div>
            <div className={styles.statLabel}>Closed</div>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className={styles.loading}>Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📄</div>
            <div className={styles.emptyTitle}>No Assignments</div>
            <div className={styles.emptyText}>Create your first assignment to get started</div>
            <button className={`${styles.actionBtn} ${styles.primary}`} onClick={handleAdd}>
              Create Assignment
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          {assignments.map((assignment) => (
            <div key={assignment.id} style={{
              padding: '20px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start'
            }}>
              <div style={{ fontSize: '28px', minWidth: '40px', textAlign: 'center' }}>
                {getStatusIcon(assignment.status)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1f36' }}>
                    {assignment.name || assignment.title}
                  </h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#f3f4f6',
                    color: getStatusColor(assignment.status)
                  }}>
                    {assignment.status || 'N/A'}
                  </span>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' }}>
                  {assignment.course?.code} - {assignment.course?.name}
                </p>
                {assignment.description && (
                  <p style={{ margin: '8px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                    {assignment.description.substring(0, 100)}{assignment.description.length > 100 ? '...' : ''}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '24px', marginTop: '8px', fontSize: '13px', color: '#9ca3af', flexWrap: 'wrap' }}>
                  <span>📅 {formatDate(assignment.dueDate, assignment.dueTime)}</span>
                  {assignment.totalPoints && <span>⭐ {assignment.totalPoints} points</span>}
                  {getDaysUntilDue(assignment.dueDate) && (
                    <span style={{ 
                      color: new Date(assignment.dueDate!) < new Date() ? '#dc2626' : '#6b7280'
                    }}>
                      ⏰ {getDaysUntilDue(assignment.dueDate)}
                    </span>
                  )}
                  {assignment.allowLateSubmission && <span>🕐 Late submission allowed</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(assignment)}
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
                  onClick={() => handleDelete(assignment)}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <h2>Create Assignment</h2>
              <button className={modalStyles.closeBtn} onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            {formError && <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', margin: '16px' }}>{formError}</div>}
            <form onSubmit={handleSubmitAdd}>
              <div className={modalStyles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Assignment title"
                      style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AssignmentStatus })}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Closed">Closed</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
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
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Due Date *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Due Time</label>
                    <input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
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
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.allowLateSubmission}
                      onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                    />
                    Allow Late Submission
                  </label>
                  {formData.allowLateSubmission && (
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Late Penalty (%)</label>
                      <input
                        type="number"
                        value={formData.latePenalty}
                        onChange={(e) => setFormData({ ...formData, latePenalty: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Brief description"
                    style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Instructions</label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={3}
                    placeholder="Assignment instructions for students"
                    style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div className={modalStyles.modalFooter}>
                <button type="button" className={modalStyles.secondaryBtn} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={modalStyles.primaryBtn} disabled={formLoading}>
                  {formLoading ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAssignment && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <h2>Edit Assignment</h2>
              <button className={modalStyles.closeBtn} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            {formError && <div style={{ padding: '12px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', marginBottom: '16px', margin: '16px' }}>{formError}</div>}
            <form onSubmit={handleSubmitEdit}>
              <div className={modalStyles.modalBody}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AssignmentStatus })}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Closed">Closed</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Course *</label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    >
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Due Date *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Due Time</label>
                    <input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
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
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.allowLateSubmission}
                      onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                    />
                    Allow Late Submission
                  </label>
                  {formData.allowLateSubmission && (
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Late Penalty (%)</label>
                      <input
                        type="number"
                        value={formData.latePenalty}
                        onChange={(e) => setFormData({ ...formData, latePenalty: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Instructions</label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={3}
                    style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div className={modalStyles.modalFooter}>
                <button type="button" className={modalStyles.secondaryBtn} onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={modalStyles.primaryBtn} disabled={formLoading}>
                  {formLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedAssignment && (
        <div className={modalStyles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={modalStyles.modalHeader}>
              <h2>Delete Assignment</h2>
              <button className={modalStyles.closeBtn} onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className={modalStyles.modalBody}>
              <p>Are you sure you want to delete <strong>{selectedAssignment.name || selectedAssignment.title}</strong>?</p>
              <p style={{ color: '#dc2626' }}>This action cannot be undone.</p>
            </div>
            <div className={modalStyles.modalFooter}>
              <button className={modalStyles.secondaryBtn} onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className={modalStyles.dangerBtn}
                onClick={handleSubmitDelete}
                disabled={formLoading}
              >
                {formLoading ? "Deleting..." : "Delete Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
