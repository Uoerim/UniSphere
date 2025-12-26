import { useState, useEffect, useMemo } from "react";
import styles from "./Assignments.module.css";
import { useAuth } from "../../context/AuthContext";

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

interface Stats {
  total: number;
  draft: number;
  published: number;
  closed: number;
  archived: number;
}

const ASSIGNMENT_STATUSES: AssignmentStatus[] = ["Draft", "Published", "Closed", "Archived"];

export default function Assignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    draft: 0,
    published: 0,
    closed: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Form data
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
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [assignments]);

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
        console.log('All courses fetched:', allCourses);
        console.log('User info:', user);
        // Filter courses where this staff member is the instructor
        const myCourses = allCourses.filter((course: any) => 
          course.instructor?.accountId === user?.id || 
          course.instructor?.email === user?.email
        );
        console.log('Filtered courses:', myCourses);
        setCourses(myCourses.length > 0 ? myCourses : allCourses);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  const calculateStats = () => {
    if (!assignments.length) {
      setStats({ total: 0, draft: 0, published: 0, closed: 0, archived: 0 });
      return;
    }

    const newStats = {
      total: assignments.length,
      draft: assignments.filter(a => a.status === 'Draft').length,
      published: assignments.filter(a => a.status === 'Published').length,
      closed: assignments.filter(a => a.status === 'Closed').length,
      archived: assignments.filter(a => a.status === 'Archived').length,
    };

    setStats(newStats);
  };

  const filteredAssignments = useMemo(() => {
    let filtered = assignments.filter((assignment) => {
      const matchesSearch =
        searchQuery === "" ||
        (assignment.name && assignment.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (assignment.title && assignment.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (assignment.course?.code && assignment.course.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (assignment.course?.name && assignment.course.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCourse = filterCourse === "all" || assignment.course?.id === filterCourse;
      const matchesStatus = filterStatus === "all" || assignment.status === filterStatus;

      return matchesSearch && matchesCourse && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "dueDate":
          comparison = new Date(a.dueDate || '').getTime() - new Date(b.dueDate || '').getTime();
          break;
        case "title":
          const titleA = a.name || a.title || '';
          const titleB = b.name || b.title || '';
          comparison = titleA.localeCompare(titleB);
          break;
        case "course":
          comparison = (a.course?.code || '').localeCompare(b.course?.code || '');
          break;
        case "points":
          comparison = (a.totalPoints || 0) - (b.totalPoints || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [assignments, searchQuery, filterCourse, filterStatus, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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
        return;
      }
      if (!formData.courseId) {
        setFormError("Please select a course");
        return;
      }
      if (!formData.dueDate) {
        setFormError("Due date is required");
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

      const result = await response.json();
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

  if (loading) {
    return <div className={styles.container}><p>Loading assignments...</p></div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Assignments</h1>
          <p>Create and manage assignments for your courses</p>
        </div>
        <button className={styles.primaryBtn} onClick={handleAdd}>
          + Add Assignment
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Assignments</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.draft}</div>
          <div className={styles.statLabel}>Drafts</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.published}</div>
          <div className={styles.statLabel}>Published</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.closed}</div>
          <div className={styles.statLabel}>Closed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.archived}</div>
          <div className={styles.statLabel}>Archived</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Closed">Closed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Course:</label>
          <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="Search assignments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort("title")}>
                Title {sortField === "title" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("course")}>
                Course {sortField === "course" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("dueDate")}>
                Due Date {sortField === "dueDate" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th>Status</th>
              <th onClick={() => handleSort("points")}>
                Points {sortField === "points" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyMessage}>
                  No assignments found
                </td>
              </tr>
            ) : (
              filteredAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td><strong>{assignment.name || assignment.title}</strong></td>
                  <td>{assignment.course?.code || 'N/A'}</td>
                  <td>{assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{assignment.status || 'N/A'}</td>
                  <td>{assignment.totalPoints || 'N/A'}</td>
                  <td>
                    <button className={styles.iconBtn} onClick={() => handleEdit(assignment)} title="Edit">
                      ✎
                    </button>
                    <button className={styles.iconBtn} onClick={() => handleDelete(assignment)} title="Delete">
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.wide}`}>
            <div className={styles.modalHeader}>
              <h2>Add Assignment</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            {formError && <div className={styles.errorMsg}>{formError}</div>}
            <form onSubmit={handleSubmitAdd}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="Assignment title"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AssignmentStatus })}
                      required
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Closed">Closed</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Course *</label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Due Date *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Due Time</label>
                    <input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Total Points *</label>
                    <input
                      type="number"
                      value={formData.totalPoints}
                      onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) || 0 })}
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.allowLateSubmission}
                        onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                      />
                      Allow Late Submission
                    </label>
                  </div>
                  {formData.allowLateSubmission && (
                    <div className={styles.formGroup}>
                      <label>Late Penalty (%)</label>
                      <input
                        type="number"
                        value={formData.latePenalty}
                        onChange={(e) => setFormData({ ...formData, latePenalty: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="100"
                      />
                    </div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Brief description"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Instructions</label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={3}
                    placeholder="Assignment instructions for students"
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                  {formLoading ? "Creating..." : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAssignment && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.wide}`}>
            <div className={styles.modalHeader}>
              <h2>Edit Assignment</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>
            {formError && <div className={styles.errorMsg}>{formError}</div>}
            <form onSubmit={handleSubmitEdit}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AssignmentStatus })}
                      required
                    >
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Closed">Closed</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Course *</label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      required
                    >
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Due Date *</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Due Time</label>
                    <input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Total Points *</label>
                    <input
                      type="number"
                      value={formData.totalPoints}
                      onChange={(e) => setFormData({ ...formData, totalPoints: parseInt(e.target.value) || 0 })}
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.allowLateSubmission}
                        onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
                      />
                      Allow Late Submission
                    </label>
                  </div>
                  {formData.allowLateSubmission && (
                    <div className={styles.formGroup}>
                      <label>Late Penalty (%)</label>
                      <input
                        type="number"
                        value={formData.latePenalty}
                        onChange={(e) => setFormData({ ...formData, latePenalty: parseInt(e.target.value) || 0 })}
                        min="0"
                        max="100"
                      />
                    </div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Instructions</label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                  {formLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedAssignment && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Delete Assignment</h2>
              <button className={styles.closeBtn} onClick={() => setShowDeleteModal(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to delete <strong>{selectedAssignment.name || selectedAssignment.title}</strong>?
              </p>
              <p style={{ color: "var(--danger)", marginTop: "0.5rem" }}>
                This action cannot be undone.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.submitBtn} ${styles.dangerBtn}`}
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
