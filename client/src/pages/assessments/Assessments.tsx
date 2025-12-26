import { useState, useEffect, useMemo } from "react";
import styles from "./Assessments.module.css";
import { useAuth } from "../../context/AuthContext";

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

interface Stats {
  total: number;
  finals: number;
  midterms: number;
  quizzes: number;
  upcoming: number;
}

const ASSESSMENT_TYPES: AssessmentType[] = ["FINALS", "MIDTERMS", "QUIZZES"];

export default function Assessments() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    finals: 0,
    midterms: 0,
    quizzes: 0,
    upcoming: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeType, setActiveType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  // Form data
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
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessments();
    fetchCourses();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [assessments]);

  const fetchAssessments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/assessments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAssessments(data || []);
      } else {
        console.error('Failed to fetch assessments. Status:', response.status);
        const errorText = await response.text();
        console.error('Error:', errorText);
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
    if (!assessments.length) {
      setStats({ total: 0, finals: 0, midterms: 0, quizzes: 0, upcoming: 0 });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newStats = {
      total: assessments.length,
      finals: assessments.filter(a => a.assessmentType === 'Final').length,
      midterms: assessments.filter(a => a.assessmentType === 'Midterm').length,
      quizzes: assessments.filter(a => a.assessmentType === 'Quiz').length,
      upcoming: assessments.filter(a => {
        const aDate = new Date(a.date || '');
        return aDate >= today;
      }).length
    };

    setStats(newStats);
  };

  const filteredAssessments = useMemo(() => {
    let filtered = assessments.filter((assessment) => {
      const matchesType = activeType === "all" || 
        (activeType === "FINALS" && assessment.assessmentType === "Final") ||
        (activeType === "MIDTERMS" && assessment.assessmentType === "Midterm") ||
        (activeType === "QUIZZES" && assessment.assessmentType === "Quiz");
      
      const matchesSearch =
        searchQuery === "" ||
        (assessment.name && assessment.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (assessment.course?.code && assessment.course.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (assessment.course?.name && assessment.course.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCourse = filterCourse === "all" || assessment.course?.id === filterCourse;

      return matchesType && matchesSearch && matchesCourse;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.date || '').getTime() - new Date(b.date || '').getTime();
          break;
        case "name":
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case "course":
          comparison = (a.course?.code || '').localeCompare(b.course?.code || '');
          break;
        case "points":
          comparison = (a.totalMarks || 0) - (b.totalMarks || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [assessments, activeType, searchQuery, filterCourse, sortField, sortDirection]);

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
      type: "QUIZZES",
      courseId: courses[0]?.id || "",
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
        return;
      }
      if (!formData.courseId) {
        setFormError("Please select a course");
        return;
      }
      if (!formData.date) {
        setFormError("Date is required");
        return;
      }

      const token = localStorage.getItem('token');
      
      // Map assessment type from frontend to backend format
      const assessmentTypeMap: Record<string, string> = {
        'FINALS': 'Final',
        'MIDTERMS': 'Midterm',
        'QUIZZES': 'Quiz'
      };

      // Map frontend field names to backend expected names
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

      const result = await response.json();
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

  if (loading) {
    return <div className={styles.container}><p>Loading assessments...</p></div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1>Assessments</h1>
          <p>Manage finals, midterms, and quizzes</p>
        </div>
        <button className={styles.primaryBtn} onClick={handleAdd}>
          + Add Assessment
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total Assessments</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.finals}</div>
          <div className={styles.statLabel}>Finals</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.midterms}</div>
          <div className={styles.statLabel}>Midterms</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.quizzes}</div>
          <div className={styles.statLabel}>Quizzes</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.upcoming}</div>
          <div className={styles.statLabel}>Upcoming</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Type:</label>
          <select value={activeType} onChange={(e) => setActiveType(e.target.value)}>
            <option value="all">All Types</option>
            <option value="FINALS">Finals</option>
            <option value="MIDTERMS">Midterms</option>
            <option value="QUIZZES">Quizzes</option>
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
          placeholder="Search assessments..."
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
              <th onClick={() => handleSort("name")}>
                Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("course")}>
                Course {sortField === "course" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th onClick={() => handleSort("date")}>
                Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th>Type</th>
              <th onClick={() => handleSort("points")}>
                Points {sortField === "points" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssessments.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyMessage}>
                  No assessments found
                </td>
              </tr>
            ) : (
              filteredAssessments.map((assessment) => (
                <tr key={assessment.id}>
                  <td><strong>{assessment.name}</strong></td>
                  <td>{assessment.course?.code || 'N/A'}</td>
                  <td>{assessment.date ? new Date(assessment.date).toLocaleDateString() : 'N/A'}</td>
                  <td>{assessment.assessmentType || 'N/A'}</td>
                  <td>{assessment.totalMarks || 'N/A'}</td>
                  <td>
                    <button className={styles.iconBtn} onClick={() => handleEdit(assessment)} title="Edit">
                      ✎
                    </button>
                    <button className={styles.iconBtn} onClick={() => handleDelete(assessment)} title="Delete">
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
              <h2>Add Assessment</h2>
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
                      placeholder="Assessment title"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as AssessmentType })}
                      required
                    >
                      <option value="FINALS">Final</option>
                      <option value="MIDTERMS">Midterm</option>
                      <option value="QUIZZES">Quiz</option>
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
                    <label>Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow3}>
                  <div className={styles.formGroup}>
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                  <div className={styles.formGroup}>
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>
                <div className={styles.formRow3}>
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
                  <div className={styles.formGroup}>
                    <label>Weight (%) *</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Room 101"
                    />
                  </div>
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
                    placeholder="Special instructions for students"
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                  {formLoading ? "Creating..." : "Create Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAssessment && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.wide}`}>
            <div className={styles.modalHeader}>
              <h2>Edit Assessment</h2>
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
                    <label>Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as AssessmentType })}
                      required
                    >
                      <option value="FINALS">Final</option>
                      <option value="MIDTERMS">Midterm</option>
                      <option value="QUIZZES">Quiz</option>
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
                    <label>Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow3}>
                  <div className={styles.formGroup}>
                    <label>Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
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
                  <div className={styles.formGroup}>
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>
                <div className={styles.formRow3}>
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
                  <div className={styles.formGroup}>
                    <label>Weight (%) *</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })}
                      required
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
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
      {showDeleteModal && selectedAssessment && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Delete Assessment</h2>
              <button className={styles.closeBtn} onClick={() => setShowDeleteModal(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to delete <strong>{selectedAssessment.name}</strong>?
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
                {formLoading ? "Deleting..." : "Delete Assessment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
