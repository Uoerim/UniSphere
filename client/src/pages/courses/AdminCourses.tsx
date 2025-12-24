import { useState, useEffect, useMemo } from 'react';
import styles from './Courses.module.css';

// Types
interface Instructor {
  id: string;
  name: string;
  email?: string;
  accountId?: string;
}

interface Course {
  id: string;
  name: string;
  description?: string;
  code?: string;
  credits?: number;
  department?: string;
  semester?: string;
  courseType?: string;
  capacity?: number;
  room?: string;
  schedule?: string;
  isActive: boolean;
  createdAt: string;
  instructor?: Instructor | null;
  enrolledStudents: number;
}

interface CourseStats {
  totalCourses: number;
  activeCourses: number;
  inactiveCourses: number;
  totalEnrollments: number;
  totalInstructors: number;
  departmentCount: number;
}

type SortField = 'name' | 'code' | 'department' | 'credits' | 'enrolledStudents' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'table';

/**
 * AdminCourses - Full course management for administrators
 * Features: Add, Edit, Delete, View, Filter, Sort, Toggle Status
 */
export default function AdminCourses() {
  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterSemester, setFilterSemester] = useState('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    credits: 3,
    department: '',
    semester: '',
    courseType: '',
    capacity: 30,
    room: '',
    schedule: '',
    instructorId: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchStats();
    fetchInstructors();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/curriculum', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch courses');

      const data = await response.json();
      setCourses(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/curriculum/stats/overview', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchInstructors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/curriculum/instructors/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInstructors(data);
      }
    } catch (err) {
      console.error('Failed to fetch instructors:', err);
    }
  };

  // Filtered and sorted courses
  const filteredCourses = useMemo(() => {
    let result = [...courses];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term) ||
        c.department?.toLowerCase().includes(term) ||
        c.instructor?.name?.toLowerCase().includes(term)
      );
    }

    if (filterDepartment !== 'all') {
      result = result.filter(c => c.department === filterDepartment);
    }

    if (filterStatus !== 'all') {
      result = result.filter(c => filterStatus === 'active' ? c.isActive : !c.isActive);
    }

    if (filterSemester !== 'all') {
      result = result.filter(c => c.semester === filterSemester);
    }

    result.sort((a, b) => {
      let aVal: any = a[sortField] || '';
      let bVal: any = b[sortField] || '';

      if (sortField === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [courses, searchTerm, filterDepartment, filterStatus, filterSemester, sortField, sortDirection]);

  const departments = useMemo(() => {
    const deps = new Set(courses.map(c => c.department).filter(Boolean));
    return Array.from(deps) as string[];
  }, [courses]);

  const semesters = useMemo(() => {
    const sems = new Set(courses.map(c => c.semester).filter(Boolean));
    return Array.from(sems) as string[];
  }, [courses]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      credits: 3,
      department: '',
      semester: '',
      courseType: '',
      capacity: 30,
      room: '',
      schedule: '',
      instructorId: '',
    });
    setFormError('');
  };

  const handleAddCourse = async () => {
    if (!formData.name || !formData.code) {
      setFormError('Course name and code are required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/curriculum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create course');
      }

      await fetchCourses();
      await fetchStats();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCourse = async () => {
    if (!selectedCourse || !formData.name) {
      setFormError('Course name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/curriculum/${selectedCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update course');
      }

      await fetchCourses();
      await fetchStats();
      setShowEditModal(false);
      setSelectedCourse(null);
      resetForm();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/curriculum/${selectedCourse.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete course');
      }

      await fetchCourses();
      await fetchStats();
      setShowDeleteModal(false);
      setSelectedCourse(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (course: Course) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/curriculum/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !course.isActive }),
      });

      if (!response.ok) throw new Error('Failed to update course status');

      await fetchCourses();
      await fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditModal = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      name: course.name,
      description: course.description || '',
      code: course.code || '',
      credits: course.credits || 3,
      department: course.department || '',
      semester: course.semester || '',
      courseType: course.courseType || '',
      capacity: course.capacity || 30,
      room: course.room || '',
      schedule: course.schedule || '',
      instructorId: course.instructor?.id || '',
    });
    setFormError('');
    setShowEditModal(true);
  };

  const openDeleteModal = (course: Course) => {
    setSelectedCourse(course);
    setShowDeleteModal(true);
  };

  const openDetailsModal = (course: Course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Course Management</h1>
          <p className={styles.subtitle}>Manage courses, instructors, and enrollments</p>
        </div>
        <button className={styles.addButton} onClick={() => { resetForm(); setShowAddModal(true); }}>
          <span>+</span> Add Course
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️</span> {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.primary}`}>📚</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.totalCourses}</div>
              <div className={styles.statLabel}>Total Courses</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.success}`}>✅</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.activeCourses}</div>
              <div className={styles.statLabel}>Active</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.info}`}>🏛️</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.departmentCount}</div>
              <div className={styles.statLabel}>Departments</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.warning}`}>👨‍🎓</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.totalEnrollments}</div>
              <div className={styles.statLabel}>Total Enrollments</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Departments</option>
          {departments.map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
        <select
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Semesters</option>
          {semesters.map(sem => (
            <option key={sem} value={sem}>{sem}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          className={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            ▦
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === 'table' ? styles.active : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            ≡
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className={styles.resultsInfo}>
        Showing {filteredCourses.length} of {courses.length} courses
      </div>

      {/* Courses Grid View */}
      {viewMode === 'grid' ? (
        <div className={styles.coursesGrid}>
          {filteredCourses.length === 0 ? (
            <div className={styles.emptyState}>
              <span>📚</span>
              <h3>No courses found</h3>
              <p>Try adjusting your filters or add a new course</p>
            </div>
          ) : (
            filteredCourses.map(course => (
              <div key={course.id} className={`${styles.courseCard} ${!course.isActive ? styles.inactive : ''}`}>
                <div className={styles.cardHeader}>
                  <div className={styles.courseCode}>{course.code}</div>
                  <div className={`${styles.statusBadge} ${course.isActive ? styles.active : styles.inactive}`}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <h3 className={styles.courseName}>{course.name}</h3>
                {course.description && (
                  <p className={styles.courseDescription}>{course.description}</p>
                )}
                <div className={styles.courseMeta}>
                  {course.department && (
                    <span className={styles.metaItem}>🏛️ {course.department}</span>
                  )}
                  {course.credits && (
                    <span className={styles.metaItem}>📊 {course.credits} Credits</span>
                  )}
                  {course.semester && (
                    <span className={styles.metaItem}>📅 {course.semester}</span>
                  )}
                </div>
                <div className={styles.courseDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Instructor:</span>
                    <span className={styles.detailValue}>
                      {course.instructor?.name || 'Not Assigned'}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Enrolled:</span>
                    <span className={styles.detailValue}>
                      {course.enrolledStudents} / {course.capacity || 30}
                    </span>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.viewBtn} onClick={() => openDetailsModal(course)}>
                    👁️ View
                  </button>
                  <button className={styles.editBtn} onClick={() => openEditModal(course)}>
                    ✏️ Edit
                  </button>
                  <button 
                    className={styles.toggleBtn} 
                    onClick={() => handleToggleStatus(course)}
                    title={course.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {course.isActive ? '🔒' : '🔓'}
                  </button>
                  <button className={styles.deleteBtn} onClick={() => openDeleteModal(course)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <div className={styles.tableContainer}>
          <table className={styles.coursesTable}>
            <thead>
              <tr>
                <th onClick={() => handleSort('code')} className={styles.sortable}>
                  Code {sortField === 'code' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('name')} className={styles.sortable}>
                  Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('department')} className={styles.sortable}>
                  Department {sortField === 'department' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('credits')} className={styles.sortable}>
                  Credits {sortField === 'credits' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Instructor</th>
                <th onClick={() => handleSort('enrolledStudents')} className={styles.sortable}>
                  Enrolled {sortField === 'enrolledStudents' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(course => (
                <tr key={course.id} className={!course.isActive ? styles.inactiveRow : ''}>
                  <td className={styles.codeCell}>{course.code}</td>
                  <td>
                    <div className={styles.nameCell}>
                      <span className={styles.courseName}>{course.name}</span>
                      {course.semester && <span className={styles.semester}>{course.semester}</span>}
                    </div>
                  </td>
                  <td>{course.department || '-'}</td>
                  <td className={styles.creditsCell}>{course.credits || '-'}</td>
                  <td>{course.instructor?.name || 'Not Assigned'}</td>
                  <td>
                    <span className={styles.enrollmentBadge}>
                      {course.enrolledStudents} / {course.capacity || 30}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${course.isActive ? styles.active : styles.inactive}`}>
                      {course.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <button onClick={() => openDetailsModal(course)} title="View Details">👁️</button>
                      <button onClick={() => openEditModal(course)} title="Edit">✏️</button>
                      <button onClick={() => handleToggleStatus(course)} title={course.isActive ? 'Deactivate' : 'Activate'}>
                        {course.isActive ? '🔒' : '🔓'}
                      </button>
                      <button onClick={() => openDeleteModal(course)} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Course</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {formError && <div className={styles.formError}>⚠️ {formError}</div>}
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Course Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Introduction to Computer Science"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Course Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CS101"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Credits</label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="12"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  >
                    <option value="">Select Semester</option>
                    <option value="Fall 2025">Fall 2025</option>
                    <option value="Spring 2025">Spring 2025</option>
                    <option value="Summer 2025">Summer 2025</option>
                    <option value="Fall 2024">Fall 2024</option>
                    <option value="Spring 2024">Spring 2024</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Course Type</label>
                  <select
                    value={formData.courseType}
                    onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="Required">Required</option>
                    <option value="Elective">Elective</option>
                    <option value="Core">Core</option>
                    <option value="Lab">Lab</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="500"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Room</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="e.g., Building A, Room 101"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Schedule</label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="e.g., MWF 9:00-10:00 AM"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Instructor</label>
                  <select
                    value={formData.instructorId}
                    onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                  >
                    <option value="">Select Instructor</option>
                    {instructors.map(inst => (
                      <option key={inst.id || inst.accountId} value={inst.id || ''}>
                        {inst.name} ({inst.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter course description..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button 
                className={styles.submitBtn} 
                onClick={handleAddCourse}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Course</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {formError && <div className={styles.formError}>⚠️ {formError}</div>}
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Course Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Course Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Credits</label>
                  <input
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="12"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  >
                    <option value="">Select Semester</option>
                    <option value="Fall 2025">Fall 2025</option>
                    <option value="Spring 2025">Spring 2025</option>
                    <option value="Summer 2025">Summer 2025</option>
                    <option value="Fall 2024">Fall 2024</option>
                    <option value="Spring 2024">Spring 2024</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Course Type</label>
                  <select
                    value={formData.courseType}
                    onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="Required">Required</option>
                    <option value="Elective">Elective</option>
                    <option value="Core">Core</option>
                    <option value="Lab">Lab</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    min="1"
                    max="500"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Room</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Schedule</label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Instructor</label>
                  <select
                    value={formData.instructorId}
                    onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                  >
                    <option value="">Select Instructor</option>
                    {instructors.map(inst => (
                      <option key={inst.id || inst.accountId} value={inst.id || ''}>
                        {inst.name} ({inst.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button 
                className={styles.submitBtn} 
                onClick={handleEditCourse}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCourse && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={`${styles.modal} ${styles.deleteModal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Delete Course</h2>
              <button className={styles.closeBtn} onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.deleteWarning}>
                <span className={styles.warningIcon}>⚠️</span>
                <p>Are you sure you want to delete <strong>{selectedCourse.name}</strong>?</p>
                <p className={styles.warningText}>
                  This will permanently remove the course and all associated data including enrollments.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                className={styles.deleteConfirmBtn} 
                onClick={handleDeleteCourse}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {showDetailsModal && selectedCourse && (
        <div className={styles.modalOverlay} onClick={() => setShowDetailsModal(false)}>
          <div className={`${styles.modal} ${styles.detailsModal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.detailsCode}>{selectedCourse.code}</span>
                <h2>{selectedCourse.name}</h2>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailsGrid}>
                <div className={styles.detailsSection}>
                  <h3>Course Information</h3>
                  <div className={styles.detailsList}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Department:</span>
                      <span>{selectedCourse.department || 'Not specified'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Credits:</span>
                      <span>{selectedCourse.credits || 0}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Semester:</span>
                      <span>{selectedCourse.semester || 'Not specified'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Type:</span>
                      <span>{selectedCourse.courseType || 'Not specified'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Status:</span>
                      <span className={`${styles.statusBadge} ${selectedCourse.isActive ? styles.active : styles.inactive}`}>
                        {selectedCourse.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailsSection}>
                  <h3>Schedule & Location</h3>
                  <div className={styles.detailsList}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Room:</span>
                      <span>{selectedCourse.room || 'Not assigned'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Schedule:</span>
                      <span>{selectedCourse.schedule || 'Not set'}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Capacity:</span>
                      <span>{selectedCourse.capacity || 30} students</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailsSection}>
                  <h3>Instructor</h3>
                  {selectedCourse.instructor ? (
                    <div className={styles.instructorCard}>
                      <div className={styles.instructorAvatar}>
                        {selectedCourse.instructor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                      <div className={styles.instructorInfo}>
                        <strong>{selectedCourse.instructor.name}</strong>
                        <span>{selectedCourse.instructor.email}</span>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.noInstructor}>No instructor assigned</p>
                  )}
                </div>

                <div className={styles.detailsSection}>
                  <h3>Enrollment</h3>
                  <div className={styles.enrollmentStats}>
                    <div className={styles.enrollmentProgress}>
                      <div 
                        className={styles.progressBar}
                        style={{ 
                          width: `${Math.min((selectedCourse.enrolledStudents / (selectedCourse.capacity || 30)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className={styles.enrollmentText}>
                      {selectedCourse.enrolledStudents} / {selectedCourse.capacity || 30} students enrolled
                    </span>
                  </div>
                </div>

                {selectedCourse.description && (
                  <div className={`${styles.detailsSection} ${styles.fullWidth}`}>
                    <h3>Description</h3>
                    <p className={styles.description}>{selectedCourse.description}</p>
                  </div>
                )}

                <div className={styles.detailsSection}>
                  <h3>Timeline</h3>
                  <div className={styles.detailsList}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Created:</span>
                      <span>{formatDate(selectedCourse.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
              <button className={styles.editBtn} onClick={() => {
                setShowDetailsModal(false);
                openEditModal(selectedCourse);
              }}>
                ✏️ Edit Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
