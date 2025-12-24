import { useState, useEffect, useMemo } from 'react';
import styles from './StudentManagement.module.css';

// Types
interface EnrolledCourse {
  id: string;
  name?: string;
  code?: string;
  department?: string;
  enrollmentId: string;
  grade: string;
  attendance: number;
  enrolledAt: string;
  status: string;
}

interface Student {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  mustChangePassword?: boolean;
  tempPassword?: string;
  entityId?: string;
  firstName?: string;
  lastName?: string;
  studentId?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  enrollmentDate?: string;
  program?: string;
  year?: string;
  gpa?: string;
  advisor?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  enrolledCourses: EnrolledCourse[];
  coursesCount: number;
}

interface AvailableCourse {
  id: string;
  name?: string;
  code?: string;
  department?: string;
}

type TabType = 'overview' | 'courses' | 'grades' | 'attendance';
type SortField = 'email' | 'firstName' | 'program' | 'createdAt' | 'gpa';
type SortDirection = 'asc' | 'desc';

export default function StudentManagement() {
  // Student list state
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState('');

  // Selected student
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Available courses for enrollment
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    program: '',
    year: '',
    advisor: '',
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPassword, setCreatedPassword] = useState('');

  // Enrollment form state
  const [enrollmentData, setEnrollmentData] = useState({
    courseId: '',
    grade: 'N/A',
    attendance: 100
  });

  // Grade edit state
  const [gradeEditData, setGradeEditData] = useState({
    enrollmentId: '',
    grade: '',
    attendance: 0
  });

  useEffect(() => {
    fetchStudentList();
    fetchAvailableCourses();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetails(selectedStudent.id);
    }
  }, [selectedStudent?.id]);

  const fetchStudentList = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:4000/api/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch students');

      const students = await response.json();
      setStudentList(students);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:4000/api/students/${studentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const student = await response.json();
        setSelectedStudent(prev => prev ? { ...prev, ...student } : null);
      }
    } catch (err) {
      console.error('Failed to fetch student details:', err);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:4000/api/students/available/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const courses = await response.json();
        setAvailableCourses(courses);
      }
    } catch (err) {
      console.error('Failed to fetch available courses:', err);
    }
  };

  // Filtered and sorted student list
  const filteredStudents = useMemo(() => {
    let result = [...studentList];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.email.toLowerCase().includes(term) ||
        s.firstName?.toLowerCase().includes(term) ||
        s.lastName?.toLowerCase().includes(term) ||
        s.studentId?.toLowerCase().includes(term)
      );
    }

    if (filterProgram !== 'all') {
      result = result.filter(s => s.program === filterProgram);
    }

    if (filterYear !== 'all') {
      result = result.filter(s => s.year === filterYear);
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
  }, [studentList, searchTerm, filterProgram, filterYear, sortField, sortDirection]);

  const programs = useMemo(() => {
    const progs = new Set(studentList.map(s => s.program).filter(Boolean));
    return Array.from(progs);
  }, [studentList]);

  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

  const handleAddStudent = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setFormError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:4000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          attributes: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            studentId: formData.studentId,
            phone: formData.phone,
            address: formData.address,
            dateOfBirth: formData.dateOfBirth,
            program: formData.program,
            year: formData.year,
            advisor: formData.advisor,
            emergencyContact: formData.emergencyContact,
            emergencyPhone: formData.emergencyPhone,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create student');
      }

      const result = await response.json();
      setCreatedPassword(result.tempPassword);
      
      await fetchStudentList();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStudent = async () => {
    if (!selectedStudent) {
      setFormError('No student selected');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:4000/api/students/${selectedStudent.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          attributes: {
            email: selectedStudent.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            studentId: formData.studentId,
            phone: formData.phone,
            address: formData.address,
            dateOfBirth: formData.dateOfBirth,
            program: formData.program,
            year: formData.year,
            advisor: formData.advisor,
            emergencyContact: formData.emergencyContact,
            emergencyPhone: formData.emergencyPhone,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      await fetchStudentList();
      setShowEditModal(false);
      
      setSelectedStudent(prev => prev ? {
        ...prev,
        ...formData,
      } : null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      await fetch(`http://localhost:4000/api/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      await fetchStudentList();
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const handleEnrollStudent = async () => {
    if (!selectedStudent || !enrollmentData.courseId) {
      setFormError('Please select a course');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:4000/api/students/${selectedStudent.id}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: enrollmentData.courseId,
          grade: enrollmentData.grade,
          attendance: enrollmentData.attendance,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to enroll student');
      }

      await fetchStudentDetails(selectedStudent.id);
      await fetchStudentList();
      setShowEnrollModal(false);
      setEnrollmentData({ courseId: '', grade: 'N/A', attendance: 100 });
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateGrade = async () => {
    if (!selectedStudent || !gradeEditData.enrollmentId) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      await fetch(`http://localhost:4000/api/students/${selectedStudent.id}/courses/${gradeEditData.enrollmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          grade: gradeEditData.grade,
          attendance: gradeEditData.attendance,
        }),
      });

      await fetchStudentDetails(selectedStudent.id);
      await fetchStudentList();
      setShowGradeModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update grade');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!selectedStudent) return;
    if (!confirm('Are you sure you want to remove this enrollment?')) return;

    try {
      const token = localStorage.getItem('token');

      await fetch(`http://localhost:4000/api/students/${selectedStudent.id}/courses/${enrollmentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      await fetchStudentDetails(selectedStudent.id);
      await fetchStudentList();
    } catch (err: any) {
      alert(err.message || 'Failed to remove enrollment');
    }
  };

  const openEditModal = () => {
    if (selectedStudent) {
      setFormData({
        firstName: selectedStudent.firstName || '',
        lastName: selectedStudent.lastName || '',
        email: selectedStudent.email,
        studentId: selectedStudent.studentId || '',
        phone: selectedStudent.phone || '',
        address: selectedStudent.address || '',
        dateOfBirth: selectedStudent.dateOfBirth || '',
        program: selectedStudent.program || '',
        year: selectedStudent.year || '',
        advisor: selectedStudent.advisor || '',
        emergencyContact: selectedStudent.emergencyContact || '',
        emergencyPhone: selectedStudent.emergencyPhone || '',
      });
      setShowEditModal(true);
    }
  };

  const openGradeModal = (enrollment: EnrolledCourse) => {
    setGradeEditData({
      enrollmentId: enrollment.enrollmentId,
      grade: enrollment.grade || 'N/A',
      attendance: enrollment.attendance || 0
    });
    setShowGradeModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      studentId: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      program: '',
      year: '',
      advisor: '',
      emergencyContact: '',
      emergencyPhone: '',
    });
    setFormError('');
    setCreatedPassword('');
  };

  const getInitials = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();
    }
    return student.email.substring(0, 2).toUpperCase();
  };

  const getFullName = (student: Student) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.email.split('@')[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getGradeColor = (grade: string) => {
    if (!grade || grade === 'N/A') return '';
    const letter = grade.charAt(0).toUpperCase();
    switch (letter) {
      case 'A': return styles.gradeA;
      case 'B': return styles.gradeB;
      case 'C': return styles.gradeC;
      case 'D': return styles.gradeD;
      case 'F': return styles.gradeF;
      default: return '';
    }
  };

  // Stats
  const stats = useMemo(() => {
    const avgGPA = studentList.filter(s => s.gpa).reduce((acc, s) => acc + parseFloat(s.gpa || '0'), 0) / (studentList.filter(s => s.gpa).length || 1);
    return {
      total: studentList.length,
      active: studentList.filter(s => s.isActive).length,
      programs: new Set(studentList.map(s => s.program).filter(Boolean)).size,
      avgGPA: avgGPA.toFixed(2),
      totalEnrollments: studentList.reduce((acc, s) => acc + s.coursesCount, 0),
    };
  }, [studentList]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading students...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Student Management</h1>
          <p className={styles.subtitle}>Manage students, enrollments, grades, and academic records</p>
        </div>
        <button className={styles.addButton} onClick={() => { resetForm(); setShowAddModal(true); }}>
          <span>+</span> Add Student
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>🎓</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Students</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>✅</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statLabel}>Active</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}>📚</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.programs}</div>
            <div className={styles.statLabel}>Programs</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>📊</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.totalEnrollments}</div>
            <div className={styles.statLabel}>Total Enrollments</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Student List Panel */}
        <div className={styles.listPanel}>
          <div className={styles.listHeader}>
            <h2>Students</h2>
            <span className={styles.badge}>{filteredStudents.length}</span>
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Programs</option>
              {programs.map(prog => (
                <option key={prog} value={prog}>{prog}</option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-') as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(dir);
              }}
              className={styles.filterSelect}
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="firstName-asc">Name A-Z</option>
              <option value="firstName-desc">Name Z-A</option>
              <option value="gpa-desc">GPA High-Low</option>
              <option value="gpa-asc">GPA Low-High</option>
            </select>
          </div>

          {/* Student List */}
          <div className={styles.studentList}>
            {filteredStudents.length === 0 ? (
              <div className={styles.emptyList}>
                <span>🎓</span>
                <p>No students found</p>
              </div>
            ) : (
              filteredStudents.map(student => (
                <div
                  key={student.id}
                  className={`${styles.studentItem} ${selectedStudent?.id === student.id ? styles.active : ''}`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className={styles.studentAvatar}>
                    {getInitials(student)}
                  </div>
                  <div className={styles.studentItemInfo}>
                    <div className={styles.studentName}>{getFullName(student)}</div>
                    <div className={styles.studentMeta}>
                      {student.program || 'No Program'} • {student.year || 'N/A'}
                    </div>
                  </div>
                  <div className={styles.studentBadges}>
                    <span className={styles.courseBadge}>{student.coursesCount} courses</span>
                    <div className={`${styles.statusDot} ${student.isActive ? styles.active : styles.inactive}`}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className={styles.detailPanel}>
          {selectedStudent ? (
            <>
              {/* Student Header */}
              <div className={styles.detailHeader}>
                <div className={styles.detailAvatar}>
                  {getInitials(selectedStudent)}
                </div>
                <div className={styles.detailInfo}>
                  <h2>{getFullName(selectedStudent)}</h2>
                  <p>{selectedStudent.email}</p>
                  <div className={styles.detailMeta}>
                    <span className={styles.metaItem}>🎓 {selectedStudent.program || 'No Program'}</span>
                    <span className={styles.metaItem}>📅 {selectedStudent.year || 'N/A'}</span>
                    {selectedStudent.studentId && <span className={styles.metaItem}>🆔 {selectedStudent.studentId}</span>}
                    {selectedStudent.gpa && <span className={styles.metaItem}>📊 GPA: {selectedStudent.gpa}</span>}
                  </div>
                </div>
                <div className={styles.detailActions}>
                  <button className={styles.editBtn} onClick={openEditModal}>✏️ Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteStudent(selectedStudent.id)}>🗑️</button>
                </div>
              </div>

              {/* Temporary Password Alert */}
              {selectedStudent.tempPassword && (
                <div className={styles.passwordAlert}>
                  <span>🔐</span>
                  <div>
                    <strong>Temporary Password:</strong> {selectedStudent.tempPassword}
                    <br />
                    <small>Student must change password on first login</small>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'courses' ? styles.active : ''}`}
                  onClick={() => setActiveTab('courses')}
                >
                  Courses ({selectedStudent.enrolledCourses?.length || 0})
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'grades' ? styles.active : ''}`}
                  onClick={() => setActiveTab('grades')}
                >
                  Grades
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'attendance' ? styles.active : ''}`}
                  onClick={() => setActiveTab('attendance')}
                >
                  Attendance
                </button>
              </div>

              {/* Tab Content */}
              <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                  <div className={styles.overviewTab}>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoCard}>
                        <h4>Personal Information</h4>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Email</span>
                          <span className={styles.infoValue}>{selectedStudent.email}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Phone</span>
                          <span className={styles.infoValue}>{selectedStudent.phone || 'Not provided'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Address</span>
                          <span className={styles.infoValue}>{selectedStudent.address || 'Not provided'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Date of Birth</span>
                          <span className={styles.infoValue}>{selectedStudent.dateOfBirth || 'Not provided'}</span>
                        </div>
                      </div>
                      <div className={styles.infoCard}>
                        <h4>Academic Information</h4>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Student ID</span>
                          <span className={styles.infoValue}>{selectedStudent.studentId || 'Not assigned'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Program</span>
                          <span className={styles.infoValue}>{selectedStudent.program || 'Not assigned'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Year</span>
                          <span className={styles.infoValue}>{selectedStudent.year || 'N/A'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Advisor</span>
                          <span className={styles.infoValue}>{selectedStudent.advisor || 'Not assigned'}</span>
                        </div>
                      </div>
                      <div className={styles.infoCard}>
                        <h4>Emergency Contact</h4>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Contact Name</span>
                          <span className={styles.infoValue}>{selectedStudent.emergencyContact || 'Not provided'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Contact Phone</span>
                          <span className={styles.infoValue}>{selectedStudent.emergencyPhone || 'Not provided'}</span>
                        </div>
                      </div>
                      <div className={styles.infoCard}>
                        <h4>Account Information</h4>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Account Status</span>
                          <span className={`${styles.infoValue} ${selectedStudent.isActive ? styles.activeStatus : styles.inactiveStatus}`}>
                            {selectedStudent.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Created</span>
                          <span className={styles.infoValue}>{formatDate(selectedStudent.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.quickStats}>
                      <div className={styles.quickStatCard}>
                        <div className={styles.quickStatValue}>{selectedStudent.enrolledCourses?.length || 0}</div>
                        <div className={styles.quickStatLabel}>Enrolled Courses</div>
                      </div>
                      <div className={styles.quickStatCard}>
                        <div className={styles.quickStatValue}>{selectedStudent.gpa || 'N/A'}</div>
                        <div className={styles.quickStatLabel}>Current GPA</div>
                      </div>
                      <div className={styles.quickStatCard}>
                        <div className={styles.quickStatValue}>
                          {selectedStudent.enrolledCourses?.length 
                            ? Math.round(selectedStudent.enrolledCourses.reduce((acc, c) => acc + c.attendance, 0) / selectedStudent.enrolledCourses.length)
                            : 0}%
                        </div>
                        <div className={styles.quickStatLabel}>Avg Attendance</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'courses' && (
                  <div className={styles.coursesTab}>
                    <div className={styles.tabHeader}>
                      <h3>Enrolled Courses</h3>
                      <button className={styles.enrollBtn} onClick={() => setShowEnrollModal(true)}>
                        + Enroll in Course
                      </button>
                    </div>
                    {selectedStudent.enrolledCourses?.length > 0 ? (
                      <div className={styles.coursesList}>
                        {selectedStudent.enrolledCourses.map(course => (
                          <div key={course.enrollmentId} className={styles.courseCard}>
                            <div className={styles.courseInfo}>
                              <div className={styles.courseCode}>{course.code || 'N/A'}</div>
                              <div className={styles.courseName}>{course.name || 'Unnamed Course'}</div>
                              <div className={styles.courseMeta}>
                                <span>📚 {course.department || 'N/A'}</span>
                                <span>📅 Enrolled: {formatDate(course.enrolledAt)}</span>
                                <span className={`${styles.statusBadge} ${course.status === 'active' ? styles.activeStatus : styles.droppedStatus}`}>
                                  {course.status}
                                </span>
                              </div>
                            </div>
                            <div className={styles.courseGrade}>
                              <div className={`${styles.gradeValue} ${getGradeColor(course.grade)}`}>
                                {course.grade}
                              </div>
                              <div className={styles.attendanceValue}>
                                {course.attendance}% Att.
                              </div>
                            </div>
                            <div className={styles.courseActions}>
                              <button className={styles.editGradeBtn} onClick={() => openGradeModal(course)}>
                                ✏️ Edit Grade
                              </button>
                              <button className={styles.removeBtn} onClick={() => handleRemoveEnrollment(course.enrollmentId)}>
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyCourses}>
                        <span>📚</span>
                        <p>No courses enrolled</p>
                        <button className={styles.enrollBtn} onClick={() => setShowEnrollModal(true)}>
                          Enroll in Course
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'grades' && (
                  <div className={styles.gradesTab}>
                    <div className={styles.tabHeader}>
                      <h3>Grade Report</h3>
                    </div>
                    {selectedStudent.enrolledCourses?.length > 0 ? (
                      <table className={styles.gradesTable}>
                        <thead>
                          <tr>
                            <th>Course Code</th>
                            <th>Course Name</th>
                            <th>Department</th>
                            <th>Grade</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStudent.enrolledCourses.map(course => (
                            <tr key={course.enrollmentId}>
                              <td><span className={styles.codeBadge}>{course.code || 'N/A'}</span></td>
                              <td>{course.name || 'Unnamed Course'}</td>
                              <td>{course.department || 'N/A'}</td>
                              <td>
                                <span className={`${styles.gradeBadge} ${getGradeColor(course.grade)}`}>
                                  {course.grade}
                                </span>
                              </td>
                              <td>
                                <span className={`${styles.statusBadge} ${course.status === 'active' ? styles.activeStatus : styles.droppedStatus}`}>
                                  {course.status}
                                </span>
                              </td>
                              <td>
                                <button className={styles.iconBtn} onClick={() => openGradeModal(course)}>✏️</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className={styles.emptyCourses}>
                        <span>📊</span>
                        <p>No grades to display</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'attendance' && (
                  <div className={styles.attendanceTab}>
                    <div className={styles.tabHeader}>
                      <h3>Attendance Report</h3>
                    </div>
                    {selectedStudent.enrolledCourses?.length > 0 ? (
                      <div className={styles.attendanceList}>
                        {selectedStudent.enrolledCourses.map(course => (
                          <div key={course.enrollmentId} className={styles.attendanceCard}>
                            <div className={styles.attendanceInfo}>
                              <div className={styles.attendanceCourse}>
                                <span className={styles.codeBadge}>{course.code || 'N/A'}</span>
                                {course.name || 'Unnamed Course'}
                              </div>
                            </div>
                            <div className={styles.attendanceBar}>
                              <div 
                                className={styles.attendanceFill} 
                                style={{ 
                                  width: `${course.attendance}%`,
                                  background: course.attendance >= 80 ? '#22c55e' : course.attendance >= 60 ? '#f59e0b' : '#ef4444'
                                }}
                              ></div>
                              <span className={styles.attendancePercent}>{course.attendance}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyCourses}>
                        <span>📅</span>
                        <p>No attendance records</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionIcon}>🎓</div>
              <h3>Select a Student</h3>
              <p>Choose a student from the list to view their profile, courses, grades, and attendance.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{createdPassword ? 'Student Created!' : 'Add New Student'}</h2>
              <button className={styles.closeBtn} onClick={() => { setShowAddModal(false); resetForm(); }}>×</button>
            </div>
            <div className={styles.modalBody}>
              {createdPassword ? (
                <div className={styles.successMessage}>
                  <div className={styles.successIcon}>✅</div>
                  <h3>Student account created successfully!</h3>
                  <div className={styles.credentialsBox}>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Temporary Password:</strong> {createdPassword}</p>
                  </div>
                  <p className={styles.credentialsNote}>
                    Please save this password and share it with the student securely. 
                    They will be required to change it on first login.
                  </p>
                  <button className={styles.submitBtn} onClick={() => { setShowAddModal(false); resetForm(); }}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {formError && <div className={styles.formError}>⚠️ {formError}</div>}
                  
                  <div className={styles.formSection}>
                    <h4>Personal Information</h4>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>First Name *</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          placeholder="John"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Last Name *</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Email Address *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john.doe@university.edu"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="123 Main St, City, State"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h4>Academic Information</h4>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Student ID</label>
                        <input
                          type="text"
                          value={formData.studentId}
                          onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                          placeholder="STU-2025-001"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Program</label>
                        <select
                          value={formData.program}
                          onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                        >
                          <option value="">Select Program</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="Biology">Biology</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Business Administration">Business Administration</option>
                          <option value="Liberal Arts">Liberal Arts</option>
                          <option value="Medicine">Medicine</option>
                          <option value="Law">Law</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Year</label>
                        <select
                          value={formData.year}
                          onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                        >
                          <option value="">Select Year</option>
                          <option value="Freshman">Freshman</option>
                          <option value="Sophomore">Sophomore</option>
                          <option value="Junior">Junior</option>
                          <option value="Senior">Senior</option>
                          <option value="Graduate">Graduate</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Advisor</label>
                        <input
                          type="text"
                          value={formData.advisor}
                          onChange={(e) => setFormData(prev => ({ ...prev, advisor: e.target.value }))}
                          placeholder="Dr. Smith"
                        />
                      </div>
                    </div>
                  </div>

                  <div className={styles.formSection}>
                    <h4>Emergency Contact</h4>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Contact Name</label>
                        <input
                          type="text"
                          value={formData.emergencyContact}
                          onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Contact Phone</label>
                        <input
                          type="tel"
                          value={formData.emergencyPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                          placeholder="+1 (555) 987-6543"
                        />
                      </div>
                    </div>
                  </div>

                  <p className={styles.formNote}>
                    🔐 A temporary password will be generated and shown after creation.
                  </p>
                </>
              )}
            </div>
            {!createdPassword && (
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                <button className={styles.submitBtn} onClick={handleAddStudent} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Student</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {formError && <div className={styles.formError}>⚠️ {formError}</div>}
              
              <div className={styles.formSection}>
                <h4>Personal Information</h4>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input type="email" value={formData.email} disabled />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>

              <div className={styles.formSection}>
                <h4>Academic Information</h4>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Student ID</label>
                    <input
                      type="text"
                      value={formData.studentId}
                      onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Program</label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                    >
                      <option value="">Select Program</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Business Administration">Business Administration</option>
                      <option value="Liberal Arts">Liberal Arts</option>
                      <option value="Medicine">Medicine</option>
                      <option value="Law">Law</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Year</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                    >
                      <option value="">Select Year</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Advisor</label>
                    <input
                      type="text"
                      value={formData.advisor}
                      onChange={(e) => setFormData(prev => ({ ...prev, advisor: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <h4>Emergency Contact</h4>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleUpdateStudent} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll in Course Modal */}
      {showEnrollModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEnrollModal(false)}>
          <div className={styles.modalSmall} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Enroll in Course</h2>
              <button className={styles.closeBtn} onClick={() => setShowEnrollModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {formError && <div className={styles.formError}>⚠️ {formError}</div>}
              
              <div className={styles.formGroup}>
                <label>Select Course *</label>
                <select
                  value={enrollmentData.courseId}
                  onChange={(e) => setEnrollmentData(prev => ({ ...prev, courseId: e.target.value }))}
                >
                  <option value="">Choose a course...</option>
                  {availableCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name || 'Unnamed Course'}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Initial Grade</label>
                  <select
                    value={enrollmentData.grade}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, grade: e.target.value }))}
                  >
                    <option value="N/A">N/A</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="B-">B-</option>
                    <option value="C+">C+</option>
                    <option value="C">C</option>
                    <option value="C-">C-</option>
                    <option value="D+">D+</option>
                    <option value="D">D</option>
                    <option value="D-">D-</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Attendance %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={enrollmentData.attendance}
                    onChange={(e) => setEnrollmentData(prev => ({ ...prev, attendance: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {availableCourses.length === 0 && (
                <p className={styles.formNote}>
                  ⚠️ No courses available. Please create courses first.
                </p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowEnrollModal(false)}>Cancel</button>
              <button 
                className={styles.submitBtn} 
                onClick={handleEnrollStudent} 
                disabled={isSubmitting || !enrollmentData.courseId}
              >
                {isSubmitting ? 'Enrolling...' : 'Enroll Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Grade Modal */}
      {showGradeModal && (
        <div className={styles.modalOverlay} onClick={() => setShowGradeModal(false)}>
          <div className={styles.modalSmall} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Grade & Attendance</h2>
              <button className={styles.closeBtn} onClick={() => setShowGradeModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Grade</label>
                  <select
                    value={gradeEditData.grade}
                    onChange={(e) => setGradeEditData(prev => ({ ...prev, grade: e.target.value }))}
                  >
                    <option value="N/A">N/A</option>
                    <option value="A+">A+</option>
                    <option value="A">A</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B">B</option>
                    <option value="B-">B-</option>
                    <option value="C+">C+</option>
                    <option value="C">C</option>
                    <option value="C-">C-</option>
                    <option value="D+">D+</option>
                    <option value="D">D</option>
                    <option value="D-">D-</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Attendance %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeEditData.attendance}
                    onChange={(e) => setGradeEditData(prev => ({ ...prev, attendance: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowGradeModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleUpdateGrade} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
