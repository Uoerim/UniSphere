import { useState, useEffect, useMemo } from "react";
import styles from "./Assessments.module.css";
import api from "../../lib/api";
import { ClipboardIcon, FileTextIcon, HelpCircleIcon, EditIcon, ChartIcon, TrashIcon, XIcon, BookIcon } from "../../components/ui/Icons";

type AssessmentType = "Final" | "Midterm" | "Quiz";
type AssessmentStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

interface Course {
  id: string;
  code: string;
  name: string;
}

interface Assessment {
  id: string;
  name: string;
  title?: string; // Legacy support
  description?: string;
  assessmentType: AssessmentType;
  type?: AssessmentType; // Legacy support
  status?: AssessmentStatus;
  courseId?: string;
  course: Course | null;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  totalMarks: number;
  totalPoints?: number; // Legacy support
  weight: number;
  room?: string;
  location?: string; // Legacy support
  instructions?: string;
  createdAt: string;
  isActive: boolean;
}

interface EnrolledStudent {
  id: string;
  name: string;
  studentId: string;
  grade?: number;
}

interface Stats {
  total: number;
  finals: number;
  midterms: number;
  quizzes: number;
  upcoming: number;
}

const ASSESSMENT_TYPES: AssessmentType[] = ["Final", "Midterm", "Quiz"];
const ASSESSMENT_STATUSES: AssessmentStatus[] = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"];

export default function Assessments() {
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
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGradesModal, setShowGradesModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    assessmentType: "Quiz" as AssessmentType,
    status: "SCHEDULED" as AssessmentStatus,
    courseId: "",
    courseName: "", // Display name for course
    date: "",
    startTime: "",
    endTime: "",
    duration: 60,
    totalMarks: 100,
    weight: 10,
    room: "",
    instructions: "",
  });
  const [gradesData, setGradesData] = useState<Record<string, number>>({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchAssessments();
    fetchCourses();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [assessments]);

  const fetchAssessments = async () => {
    try {
      const res = await api.get<Assessment[]>("/assessments");
      setAssessments(res.data);
    } catch (err) {
      console.error("Failed to fetch assessments:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get<Course[]>("/curriculum");
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  const calculateStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newStats = assessments.reduce(
      (acc, assessment) => {
        acc.total++;
        const type = assessment.assessmentType || assessment.type;
        if (type === 'Final') acc.finals++;
        else if (type === 'Midterm') acc.midterms++;
        else if (type === 'Quiz') acc.quizzes++;

        const assessmentDate = new Date(assessment.date);
        if (assessmentDate >= today && (!assessment.status || assessment.status === "SCHEDULED")) {
          acc.upcoming++;
        }

        return acc;
      },
      { total: 0, finals: 0, midterms: 0, quizzes: 0, upcoming: 0 }
    );

    setStats(newStats);
  };

  const filteredAssessments = useMemo(() => {
    let filtered = assessments.filter((assessment) => {
      const type = assessment.assessmentType || assessment.type;
      const matchesType = activeType === "all" || type === activeType;
      const title = assessment.name || assessment.title || '';
      const matchesSearch =
        searchQuery === "" ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assessment.course?.code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (assessment.course?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCourse = filterCourse === "all" || assessment.course?.id === filterCourse;
      const matchesStatus = filterStatus === "all" || assessment.status === filterStatus;

      return matchesType && matchesSearch && matchesCourse && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "title":
          comparison = (a.name || a.title || '').localeCompare(b.name || b.title || '');
          break;
        case "course":
          comparison = (a.course?.code || '').localeCompare(b.course?.code || '');
          break;
        case "points":
          comparison = (a.totalMarks || a.totalPoints || 0) - (b.totalMarks || b.totalPoints || 0);
          break;
        case "weight":
          comparison = (a.weight || 0) - (b.weight || 0);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [assessments, activeType, searchQuery, filterCourse, filterStatus, sortField, sortDirection]);

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
      name: "",
      description: "",
      assessmentType: "Quiz",
      status: "SCHEDULED",
      courseId: "",
      courseName: "",
      date: "",
      startTime: "",
      endTime: "",
      duration: 60,
      totalMarks: 100,
      weight: 10,
      room: "",
      instructions: "",
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setFormData({
      name: assessment.name || assessment.title || "",
      description: assessment.description || "",
      assessmentType: assessment.assessmentType || assessment.type || "Quiz",
      status: assessment.status || "SCHEDULED",
      courseId: assessment.course?.id || "",
      courseName: assessment.course ? `${assessment.course.code} - ${assessment.course.name}` : "",
      date: assessment.date ? assessment.date.split("T")[0] : "",
      startTime: assessment.startTime || "",
      endTime: assessment.endTime || "",
      duration: assessment.duration || 60,
      totalMarks: assessment.totalMarks || assessment.totalPoints || 100,
      weight: assessment.weight || 10,
      room: assessment.room || assessment.location || "",
      instructions: assessment.instructions || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowDeleteModal(true);
  };

  const handleGrades = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    try {
      // Fetch enrolled students with their grades
      const res = await api.get<EnrolledStudent[]>(`/assessments/${assessment.id}/grades`);
      setEnrolledStudents(res.data);
      // Initialize grades data
      const grades: Record<string, number> = {};
      res.data.forEach((student: EnrolledStudent) => {
        if (student.grade !== undefined) {
          grades[student.id] = student.grade;
        }
      });
      setGradesData(grades);
      setShowGradesModal(true);
    } catch (err) {
      console.error("Failed to fetch grades:", err);
      alert("Failed to load grades");
    }
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post("/assessments", formData);
      setShowAddModal(false);
      fetchAssessments();
    } catch (err) {
      console.error("Failed to create assessment:", err);
      alert("Failed to create assessment");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessment) return;
    setFormLoading(true);
    try {
      await api.put(`/assessments/${selectedAssessment.id}`, formData);
      setShowEditModal(false);
      fetchAssessments();
    } catch (err) {
      console.error("Failed to update assessment:", err);
      alert("Failed to update assessment");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedAssessment) return;
    setFormLoading(true);
    try {
      await api.delete(`/assessments/${selectedAssessment.id}`);
      setShowDeleteModal(false);
      fetchAssessments();
    } catch (err) {
      console.error("Failed to delete assessment:", err);
      alert("Failed to delete assessment");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedAssessment) return;
    setFormLoading(true);
    try {
      const grades = Object.entries(gradesData).map(([studentId, score]) => ({
        studentId,
        score,
      }));
      await api.post(`/assessments/${selectedAssessment.id}/grades`, { grades });
      setShowGradesModal(false);
      alert("Grades saved successfully");
    } catch (err) {
      console.error("Failed to save grades:", err);
      alert("Failed to save grades");
    } finally {
      setFormLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterCourse("all");
    setFilterStatus("all");
    setActiveType("all");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTypeIcon = (type: AssessmentType | undefined) => {
    switch (type) {
      case "Final":
        return <ClipboardIcon size={16} />;
      case "Midterm":
        return <FileTextIcon size={16} />;
      case "Quiz":
        return <HelpCircleIcon size={16} />;
      default:
        return <FileTextIcon size={16} />;
    }
  };

  const selectCourse = (course: Course) => {
    setFormData({
      ...formData,
      courseId: course.id,
      courseName: `${course.code} - ${course.name}`
    });
    setShowCourseModal(false);
  };

  if (loading) {
    return <div className={styles.loading}>Loading assessments...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1><FileTextIcon size={28} /> Assessments</h1>
          <p>Manage finals, midterms, and quizzes for all courses</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={handleAdd}>
            <span>+</span> Add Assessment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <h3>Total Assessments</h3>
          <div className={styles.value}>{stats.total}</div>
        </div>
        <div className={`${styles.statCard} ${styles.danger}`}>
          <h3>Finals</h3>
          <div className={styles.value}>{stats.finals}</div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <h3>Midterms</h3>
          <div className={styles.value}>{stats.midterms}</div>
        </div>
        <div className={`${styles.statCard} ${styles.info}`}>
          <h3>Quizzes</h3>
          <div className={styles.value}>{stats.quizzes}</div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <h3>Upcoming</h3>
          <div className={styles.value}>{stats.upcoming}</div>
        </div>
      </div>

      {/* Type Tabs */}
      <div className={styles.typeTabs}>
        <button
          className={`${styles.typeTab} ${activeType === "all" ? styles.active : ""}`}
          onClick={() => setActiveType("all")}
        >
          All <span className={styles.count}>{stats.total}</span>
        </button>
        <button
          className={`${styles.typeTab} ${activeType === "Final" ? styles.active : ""}`}
          onClick={() => setActiveType("Final")}
        >
          <ClipboardIcon size={16} /> Finals <span className={styles.count}>{stats.finals}</span>
        </button>
        <button
          className={`${styles.typeTab} ${activeType === "Midterm" ? styles.active : ""}`}
          onClick={() => setActiveType("Midterm")}
        >
          <FileTextIcon size={16} /> Midterms <span className={styles.count}>{stats.midterms}</span>
        </button>
        <button
          className={`${styles.typeTab} ${activeType === "Quiz" ? styles.active : ""}`}
          onClick={() => setActiveType("Quiz")}
        >
          <HelpCircleIcon size={16} /> Quizzes <span className={styles.count}>{stats.quizzes}</span>
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by title or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Course</label>
            <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              {ASSESSMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <button className={styles.clearFilters} onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Assessments Table */}
      {filteredAssessments.length === 0 ? (
        <div className={styles.emptyState}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3>No Assessments Found</h3>
          <p>
            {searchQuery || filterCourse !== "all" || filterStatus !== "all" || activeType !== "all"
              ? "Try adjusting your filters"
              : "Click 'Add Assessment' to create your first assessment"}
          </p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Type</th>
                <th
                  className={`${styles.sortable} ${sortField === "title" ? styles.sorted : ""}`}
                  onClick={() => handleSort("title")}
                >
                  Title <span className={styles.sortIcon}>{sortField === "title" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                </th>
                <th
                  className={`${styles.sortable} ${sortField === "course" ? styles.sorted : ""}`}
                  onClick={() => handleSort("course")}
                >
                  Course <span className={styles.sortIcon}>{sortField === "course" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                </th>
                <th
                  className={`${styles.sortable} ${sortField === "date" ? styles.sorted : ""}`}
                  onClick={() => handleSort("date")}
                >
                  Date <span className={styles.sortIcon}>{sortField === "date" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                </th>
                <th
                  className={`${styles.sortable} ${sortField === "points" ? styles.sorted : ""}`}
                  onClick={() => handleSort("points")}
                >
                  Points <span className={styles.sortIcon}>{sortField === "points" ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}</span>
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.map((assessment) => {
                const type = assessment.assessmentType || assessment.type || 'Quiz';
                const title = assessment.name || assessment.title || 'Untitled';
                const points = assessment.totalMarks || assessment.totalPoints || 0;
                const status = assessment.status || 'SCHEDULED';
                return (
                <tr key={assessment.id}>
                  <td>
                    <span className={`${styles.typeBadge} ${styles[type.toLowerCase()]}`}>
                      {getTypeIcon(type as AssessmentType)} {type}
                    </span>
                  </td>
                  <td>{title}</td>
                  <td>
                    <div className={styles.courseInfo}>
                      <span className={styles.courseCode}>{assessment.course?.code || 'N/A'}</span>
                      <span className={styles.courseName}>{assessment.course?.name || ''}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.dateInfo}>
                      <span className={styles.date}>{assessment.date ? formatDate(assessment.date) : 'Not set'}</span>
                      {assessment.startTime && (
                        <span className={styles.time}>
                          {assessment.startTime} - {assessment.endTime}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.pointsInfo}>
                      <span className={styles.total}>{points} pts</span>
                      <span className={styles.weight}>Weight: {assessment.weight || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${styles[status.toLowerCase()]}`}
                    >
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={`${styles.actionBtn} ${styles.edit}`}
                        onClick={() => handleEdit(assessment)}
                        title="Edit"
                      >
                        <EditIcon size={16} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.grades}`}
                        onClick={() => handleGrades(assessment)}
                        title="Manage Grades"
                      >
                        <ChartIcon size={16} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.delete}`}
                        onClick={() => handleDelete(assessment)}
                        title="Delete"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.wide}`}>
            <div className={styles.modalHeader}>
              <h2>Add New Assessment</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitAdd}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Title *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., Final Exam, Midterm 1, Quiz 3"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Type *</label>
                    <select
                      value={formData.assessmentType}
                      onChange={(e) =>
                        setFormData({ ...formData, assessmentType: e.target.value as AssessmentType })
                      }
                      required
                    >
                      {ASSESSMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Course *</label>
                    <div className={styles.selectWithButton}>
                      <input
                        type="text"
                        value={formData.courseName}
                        readOnly
                        placeholder="Select a course..."
                        required
                      />
                      <button
                        type="button"
                        className={styles.selectBtn}
                        onClick={() => setShowCourseModal(true)}
                      >
                        <BookIcon size={16} /> Select
                      </button>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as AssessmentStatus })
                      }
                      required
                    >
                      {ASSESSMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formRow3}>
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
                </div>
                <div className={styles.formRow3}>
                  <div className={styles.formGroup}>
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Total Points *</label>
                    <input
                      type="number"
                      value={formData.totalMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 0 })
                      }
                      required
                      min="1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Weight (%) *</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })
                      }
                      required
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g., Room 101, Hall A"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    placeholder="Brief description of the assessment"
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
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={formLoading || !formData.courseId}>
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
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Title *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Type *</label>
                    <select
                      value={formData.assessmentType}
                      onChange={(e) =>
                        setFormData({ ...formData, assessmentType: e.target.value as AssessmentType })
                      }
                      required
                    >
                      {ASSESSMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Course *</label>
                    <div className={styles.selectWithButton}>
                      <input
                        type="text"
                        value={formData.courseName}
                        readOnly
                        placeholder="Select a course..."
                        required
                      />
                      <button
                        type="button"
                        className={styles.selectBtn}
                        onClick={() => setShowCourseModal(true)}
                      >
                        <BookIcon size={16} /> Select
                      </button>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as AssessmentStatus })
                      }
                      required
                    >
                      {ASSESSMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0) + status.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formRow3}>
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
                </div>
                <div className={styles.formRow3}>
                  <div className={styles.formGroup}>
                    <label>Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })
                      }
                      min="0"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Total Points *</label>
                    <input
                      type="number"
                      value={formData.totalMarks}
                      onChange={(e) =>
                        setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 0 })
                      }
                      required
                      min="1"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Weight (%) *</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) =>
                        setFormData({ ...formData, weight: parseInt(e.target.value) || 0 })
                      }
                      required
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
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
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={formLoading || !formData.courseId}>
                  {formLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAssessment && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Delete Assessment</h2>
              <button className={styles.closeBtn} onClick={() => setShowDeleteModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to delete <strong>{selectedAssessment.name || selectedAssessment.title}</strong>?
              </p>
              <p style={{ color: "var(--danger)", marginTop: "0.5rem" }}>
                This will also delete all associated grades. This action cannot be undone.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowDeleteModal(false)}
              >
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

      {/* Grades Modal */}
      {showGradesModal && selectedAssessment && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.wide}`}>
            <div className={styles.modalHeader}>
              <h2>
                Grades for {selectedAssessment.name || selectedAssessment.title} ({selectedAssessment.totalMarks || selectedAssessment.totalPoints} pts)
              </h2>
              <button className={styles.closeBtn} onClick={() => setShowGradesModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.gradesSection}>
                <h4>Enrolled Students</h4>
                {enrolledStudents.length === 0 ? (
                  <div className={styles.noStudents}>No students enrolled in this course</div>
                ) : (
                  <div className={styles.studentGradesList}>
                    {enrolledStudents.map((student) => (
                      <div key={student.id} className={styles.studentGradeRow}>
                        <div className={styles.studentInfo}>
                          <div className={styles.studentName}>{student.name}</div>
                          <div className={styles.studentId}>{student.studentId}</div>
                        </div>
                        <input
                          type="number"
                          value={gradesData[student.id] ?? ""}
                          onChange={(e) =>
                            setGradesData({
                              ...gradesData,
                              [student.id]: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Score"
                          min="0"
                          max={selectedAssessment.totalMarks || selectedAssessment.totalPoints}
                        />
                        <span>/ {selectedAssessment.totalMarks || selectedAssessment.totalPoints}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowGradesModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleSaveGrades}
                disabled={formLoading || enrolledStudents.length === 0}
              >
                {formLoading ? "Saving..." : "Save Grades"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Selection Modal */}
      {showCourseModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Select Course</h2>
              <button className={styles.closeBtn} onClick={() => setShowCourseModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.courseList}>
                {courses.length === 0 ? (
                  <div className={styles.noStudents}>No courses available</div>
                ) : (
                  courses.map((course) => (
                    <div
                      key={course.id}
                      className={`${styles.courseItem} ${formData.courseId === course.id ? styles.selected : ''}`}
                      onClick={() => selectCourse(course)}
                    >
                      <div className={styles.courseItemCode}>{course.code}</div>
                      <div className={styles.courseItemName}>{course.name}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowCourseModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
