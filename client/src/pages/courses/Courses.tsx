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

export default function Courses() {
  const { user, logout } = useAuth();


  // Example: Filter courses by staff member's email or name (replace with real logic as needed)
  // For demo, assume user?.email or user?.name matches instructor
  const allCourses = [
    { id: 1, name: 'Mathematics 101', instructor: 'mahmoudkhalil', students: 32 },
    { id: 2, name: 'Physics 201', instructor: 'Prof. Johnson', students: 28 },
    { id: 3, name: 'Chemistry 101', instructor: 'mahmoudkhalil', students: 35 },
  ];
  // Use username before @ as instructor key
  const staffKey = user?.email?.split('@')[0]?.toLowerCase();
  const staffCourses = allCourses.filter(
    (course) => course.instructor.toLowerCase() === staffKey
  );

  const getRolePages = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Users', path: '/users' },
          { name: 'Students', path: '/students' },
          { name: 'Courses', path: '/courses' },
        ];
      case 'STAFF':
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Students', path: '/students' },
          { name: 'Courses', path: '/courses' },
        ];
      case 'STUDENT':
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'My Courses', path: '/courses' },
          { name: 'Grades', path: '/grades' },
        ];
      case 'PARENT':
        return [
          { name: 'Dashboard', path: '/dashboard' },
          { name: 'Children', path: '/children' },
          { name: 'Attendance', path: '/attendance' },
        ];
      default:
        return [];
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
    <div className={styles.content}>
      <h1>Courses</h1>
      <p className={styles.subtitle}>View and manage course information</p>
      <div className={styles.coursesGrid}>
        {staffCourses.length === 0 ? (
          <p>No courses assigned to you.</p>
        ) : (
          staffCourses.map((course) => (
            <div key={course.id} className={styles.courseCard}>
              <h3>{course.name}</h3>
              <p className={styles.students}>{course.students} students enrolled</p>
              <button className={styles.detailsBtn}>View Details</button>
            </div>
          ))
        )}
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
                  {course.room && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Room:</span>
                      <span className={styles.detailValue}>{course.room}</span>
                    </div>
                  )}
                  {course.schedule && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Schedule:</span>
                      <span className={styles.detailValue}>{course.schedule}</span>
                    </div>
                  )}
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
          {filteredCourses.length === 0 && (
            <div className={styles.emptyState}>
              <span>📚</span>
              <h3>No courses found</h3>
              <p>Try adjusting your filters or add a new course</p>
            </div>
          )}
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
