import { useState, useEffect, useMemo } from 'react';
import styles from './StaffManagement.module.css';

// Types
interface StaffMember {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  entityId?: string;
  // EAV attributes
  firstName?: string;
  lastName?: string;
  department?: string;
  position?: string;
  phone?: string;
  office?: string;
  hireDate?: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  students: number;
  schedule: string;
  semester: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  course: string;
  grade?: string;
  attendance: number;
}

type TabType = 'overview' | 'courses' | 'students' | 'schedule' | 'performance';
type SortField = 'email' | 'role' | 'department' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function StaffManagement() {
  // Staff list state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected staff member
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Staff's data
  const [staffCourses, setStaffCourses] = useState<Course[]>([]);
  const [staffStudents, setStaffStudents] = useState<Student[]>([]);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    position: '',
    phone: '',
    office: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStaffList();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      fetchStaffDetails(selectedStaff.id);
    }
  }, [selectedStaff?.id]);

  const fetchStaffList = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch accounts with STAFF role
      const response = await fetch('http://localhost:4000/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch staff');

      const accounts = await response.json();
      const staffAccounts = accounts.filter((a: any) => a.role === 'STAFF');

      // Fetch staff entities for additional details
      const staffResponse = await fetch('http://localhost:4000/api/staff', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let staffEntities: any[] = [];
      if (staffResponse.ok) {
        staffEntities = await staffResponse.json();
      }

      // Merge account data with entity data
      const mergedStaff = staffAccounts.map((account: any) => {
        const entity = staffEntities.find((e: any) => e.email === account.email);
        return {
          ...account,
          firstName: entity?.firstName || '',
          lastName: entity?.lastName || '',
          department: entity?.department || '',
          position: entity?.position || '',
          phone: entity?.phone || '',
          office: entity?.office || '',
          entityId: entity?.id,
        };
      });

      setStaffList(mergedStaff);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaffDetails = async (staffId: string) => {
    const token = localStorage.getItem('token');
    
    // Fetch courses from API
    try {
      const coursesResponse = await fetch(`http://localhost:4000/api/staff-courses/${staffId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (coursesResponse.ok) {
        const courses = await coursesResponse.json();
        setStaffCourses(courses.map((c: any) => ({
          id: c.id,
          name: c.name || 'Unnamed Course',
          code: c.code || 'N/A',
          department: c.department || 'Not Assigned',
          students: c.students || 0,
          schedule: c.metadata?.schedule || c.schedule || 'TBD',
          semester: c.metadata?.semester || 'Current'
        })));
      } else {
        // Use placeholder data if no courses assigned
        setStaffCourses([]);
      }
    } catch {
      setStaffCourses([]);
    }

    // Fetch students from API
    try {
      const studentsResponse = await fetch(`http://localhost:4000/api/staff-courses/${staffId}/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (studentsResponse.ok) {
        const students = await studentsResponse.json();
        setStaffStudents(students.map((s: any) => ({
          id: s.id,
          name: s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name || 'Unknown',
          email: s.email || 'No email',
          course: s.course?.code || 'N/A',
          grade: s.enrollmentMetadata?.grade || 'N/A',
          attendance: s.enrollmentMetadata?.attendance || 0
        })));
      } else {
        setStaffStudents([]);
      }
    } catch {
      setStaffStudents([]);
    }
  };

  // Filtered and sorted staff list
  const filteredStaff = useMemo(() => {
    let result = [...staffList];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.email.toLowerCase().includes(term) ||
        s.firstName?.toLowerCase().includes(term) ||
        s.lastName?.toLowerCase().includes(term)
      );
    }

    if (filterDepartment !== 'all') {
      result = result.filter(s => s.department === filterDepartment);
    }

    if (filterRole !== 'all') {
      result = result.filter(s => s.role === filterRole);
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
  }, [staffList, searchTerm, filterDepartment, filterRole, sortField, sortDirection]);

  const departments = useMemo(() => {
    const deps = new Set(staffList.map(s => s.department).filter(Boolean));
    return Array.from(deps);
  }, [staffList]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleAddStaff = async () => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setFormError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');

      // First create the account
      const accountResponse = await fetch('http://localhost:4000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          role: 'STAFF',
          generatePassword: true,
        }),
      });

      if (!accountResponse.ok) {
        const err = await accountResponse.json();
        throw new Error(err.error || 'Failed to create account');
      }

      // Create staff entity with attributes
      const staffResponse = await fetch('http://localhost:4000/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          attributes: {
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            department: formData.department,
            position: formData.position,
            phone: formData.phone,
            office: formData.office,
          },
        }),
      });

      if (!staffResponse.ok) {
        throw new Error('Failed to create staff profile');
      }

      await fetchStaffList();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff?.entityId) {
      setFormError('No staff entity to update');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:4000/api/staff/${selectedStaff.entityId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          attributes: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            department: formData.department,
            position: formData.position,
            phone: formData.phone,
            office: formData.office,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update staff profile');
      }

      await fetchStaffList();
      setShowEditModal(false);
      
      // Update selected staff
      setSelectedStaff(prev => prev ? {
        ...prev,
        ...formData,
      } : null);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Delete account
      await fetch(`http://localhost:4000/api/users/${staffId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      await fetchStaffList();
      if (selectedStaff?.id === staffId) {
        setSelectedStaff(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff member');
    }
  };

  const openEditModal = () => {
    if (selectedStaff) {
      setFormData({
        firstName: selectedStaff.firstName || '',
        lastName: selectedStaff.lastName || '',
        email: selectedStaff.email,
        department: selectedStaff.department || '',
        position: selectedStaff.position || '',
        phone: selectedStaff.phone || '',
        office: selectedStaff.office || '',
      });
      setShowEditModal(true);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      department: '',
      position: '',
      phone: '',
      office: '',
    });
    setFormError('');
  };

  const getInitials = (staff: StaffMember) => {
    if (staff.firstName && staff.lastName) {
      return `${staff.firstName[0]}${staff.lastName[0]}`.toUpperCase();
    }
    return staff.email.substring(0, 2).toUpperCase();
  };

  const getFullName = (staff: StaffMember) => {
    if (staff.firstName && staff.lastName) {
      return `${staff.firstName} ${staff.lastName}`;
    }
    return staff.email.split('@')[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Stats
  const stats = useMemo(() => ({
    total: staffList.length,
    active: staffList.filter(s => s.isActive).length,
    departments: new Set(staffList.map(s => s.department).filter(Boolean)).size,
    totalCourses: selectedStaff ? staffCourses.length : 0,
    totalStudents: selectedStaff ? staffStudents.length : 0,
  }), [staffList, selectedStaff, staffCourses, staffStudents]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading staff members...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Staff Management</h1>
          <p className={styles.subtitle}>Manage staff members, their courses, and students</p>
        </div>
        <button className={styles.addButton} onClick={() => { resetForm(); setShowAddModal(true); }}>
          <span>+</span> Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>👨‍🏫</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Staff</div>
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
          <div className={`${styles.statIcon} ${styles.info}`}>🏛️</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.departments}</div>
            <div className={styles.statLabel}>Departments</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}>📚</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.totalCourses}</div>
            <div className={styles.statLabel}>Courses Assigned</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Staff List Panel */}
        <div className={styles.listPanel}>
          <div className={styles.listHeader}>
            <h2>Staff Members</h2>
            <span className={styles.badge}>{filteredStaff.length}</span>
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search staff..."
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
          </div>

          {/* Staff List */}
          <div className={styles.staffList}>
            {filteredStaff.length === 0 ? (
              <div className={styles.emptyList}>
                <span>👥</span>
                <p>No staff members found</p>
              </div>
            ) : (
              filteredStaff.map(staff => (
                <div
                  key={staff.id}
                  className={`${styles.staffItem} ${selectedStaff?.id === staff.id ? styles.active : ''}`}
                  onClick={() => setSelectedStaff(staff)}
                >
                  <div className={styles.staffAvatar}>
                    {getInitials(staff)}
                  </div>
                  <div className={styles.staffItemInfo}>
                    <div className={styles.staffName}>{getFullName(staff)}</div>
                    <div className={styles.staffMeta}>
                      {staff.department || 'No Department'} • {staff.position || 'Staff'}
                    </div>
                  </div>
                  <div className={`${styles.statusDot} ${staff.isActive ? styles.active : styles.inactive}`}></div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className={styles.detailPanel}>
          {selectedStaff ? (
            <>
              {/* Staff Header */}
              <div className={styles.detailHeader}>
                <div className={styles.detailAvatar}>
                  {getInitials(selectedStaff)}
                </div>
                <div className={styles.detailInfo}>
                  <h2>{getFullName(selectedStaff)}</h2>
                  <p>{selectedStaff.email}</p>
                  <div className={styles.detailMeta}>
                    <span className={styles.metaItem}>🏛️ {selectedStaff.department || 'No Department'}</span>
                    <span className={styles.metaItem}>💼 {selectedStaff.position || 'Staff'}</span>
                    {selectedStaff.office && <span className={styles.metaItem}>🏢 {selectedStaff.office}</span>}
                  </div>
                </div>
                <div className={styles.detailActions}>
                  <button className={styles.editBtn} onClick={openEditModal}>✏️ Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteStaff(selectedStaff.id)}>🗑️</button>
                </div>
              </div>

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
                  Courses ({staffCourses.length})
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'students' ? styles.active : ''}`}
                  onClick={() => setActiveTab('students')}
                >
                  Students ({staffStudents.length})
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'schedule' ? styles.active : ''}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  Schedule
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'performance' ? styles.active : ''}`}
                  onClick={() => setActiveTab('performance')}
                >
                  Performance
                </button>
              </div>

              {/* Tab Content */}
              <div className={styles.tabContent}>
                {activeTab === 'overview' && (
                  <div className={styles.overviewTab}>
                    <div className={styles.infoGrid}>
                      <div className={styles.infoCard}>
                        <h4>Contact Information</h4>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Email</span>
                          <span className={styles.infoValue}>{selectedStaff.email}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Phone</span>
                          <span className={styles.infoValue}>{selectedStaff.phone || 'Not provided'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Office</span>
                          <span className={styles.infoValue}>{selectedStaff.office || 'Not assigned'}</span>
                        </div>
                      </div>
                      <div className={styles.infoCard}>
                        <h4>Employment Details</h4>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Department</span>
                          <span className={styles.infoValue}>{selectedStaff.department || 'Not assigned'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Position</span>
                          <span className={styles.infoValue}>{selectedStaff.position || 'Staff'}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Join Date</span>
                          <span className={styles.infoValue}>{formatDate(selectedStaff.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.quickStats}>
                      <div className={styles.quickStatCard}>
                        <div className={styles.quickStatValue}>{staffCourses.length}</div>
                        <div className={styles.quickStatLabel}>Active Courses</div>
                      </div>
                      <div className={styles.quickStatCard}>
                        <div className={styles.quickStatValue}>{staffStudents.length}</div>
                        <div className={styles.quickStatLabel}>Total Students</div>
                      </div>
                      <div className={styles.quickStatCard}>
                        <div className={styles.quickStatValue}>4.8</div>
                        <div className={styles.quickStatLabel}>Avg. Rating</div>
                      </div>
                      <div className={styles.quickStatCard}>
                        <div className={styles.quickStatValue}>95%</div>
                        <div className={styles.quickStatLabel}>Attendance</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'courses' && (
                  <div className={styles.coursesTab}>
                    <div className={styles.tabHeader}>
                      <h3>Assigned Courses</h3>
                      <button className={styles.assignBtn} onClick={() => setShowAssignCourseModal(true)}>
                        + Assign Course
                      </button>
                    </div>
                    <div className={styles.coursesList}>
                      {staffCourses.map(course => (
                        <div key={course.id} className={styles.courseCard}>
                          <div className={styles.courseInfo}>
                            <div className={styles.courseCode}>{course.code}</div>
                            <div className={styles.courseName}>{course.name}</div>
                            <div className={styles.courseMeta}>
                              <span>📚 {course.department}</span>
                              <span>👥 {course.students} students</span>
                              <span>📅 {course.schedule}</span>
                            </div>
                          </div>
                          <div className={styles.courseActions}>
                            <button className={styles.viewBtn}>View Details</button>
                            <button className={styles.removeBtn}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'students' && (
                  <div className={styles.studentsTab}>
                    <div className={styles.tabHeader}>
                      <h3>Students</h3>
                      <input
                        type="text"
                        placeholder="Search students..."
                        className={styles.tabSearch}
                      />
                    </div>
                    <table className={styles.studentsTable}>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Course</th>
                          <th>Grade</th>
                          <th>Attendance</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffStudents.map(student => (
                          <tr key={student.id}>
                            <td>
                              <div className={styles.studentInfo}>
                                <div className={styles.studentAvatar}>{student.name[0]}</div>
                                <div>
                                  <div className={styles.studentName}>{student.name}</div>
                                  <div className={styles.studentEmail}>{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td><span className={styles.courseBadge}>{student.course}</span></td>
                            <td><span className={`${styles.gradeBadge} ${styles[`grade${student.grade?.replace(/[+-]/g, '')}`]}`}>{student.grade}</span></td>
                            <td>
                              <div className={styles.attendanceBar}>
                                <div className={styles.attendanceFill} style={{ width: `${student.attendance}%` }}></div>
                                <span>{student.attendance}%</span>
                              </div>
                            </td>
                            <td>
                              <button className={styles.iconBtn}>👁️</button>
                              <button className={styles.iconBtn}>✉️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className={styles.scheduleTab}>
                    <div className={styles.tabHeader}>
                      <h3>Weekly Schedule</h3>
                    </div>
                    <div className={styles.scheduleGrid}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                        <div key={day} className={styles.scheduleDay}>
                          <div className={styles.dayHeader}>{day}</div>
                          <div className={styles.daySlots}>
                            {day === 'Monday' || day === 'Wednesday' ? (
                              <>
                                <div className={styles.scheduleSlot}>
                                  <div className={styles.slotTime}>9:00 - 10:30 AM</div>
                                  <div className={styles.slotCourse}>CS101</div>
                                  <div className={styles.slotRoom}>Room 201</div>
                                </div>
                                <div className={styles.scheduleSlot}>
                                  <div className={styles.slotTime}>2:00 - 3:30 PM</div>
                                  <div className={styles.slotCourse}>CS301</div>
                                  <div className={styles.slotRoom}>Room 305</div>
                                </div>
                              </>
                            ) : day === 'Tuesday' || day === 'Thursday' ? (
                              <div className={styles.scheduleSlot}>
                                <div className={styles.slotTime}>11:00 - 12:30 PM</div>
                                <div className={styles.slotCourse}>CS201</div>
                                <div className={styles.slotRoom}>Room 102</div>
                              </div>
                            ) : (
                              <div className={styles.noClasses}>Office Hours</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className={styles.performanceTab}>
                    <div className={styles.tabHeader}>
                      <h3>Performance Metrics</h3>
                    </div>
                    <div className={styles.performanceGrid}>
                      <div className={styles.performanceCard}>
                        <div className={styles.performanceIcon}>⭐</div>
                        <div className={styles.performanceValue}>4.8/5.0</div>
                        <div className={styles.performanceLabel}>Student Rating</div>
                        <div className={styles.performanceTrend}>↑ 0.2 from last semester</div>
                      </div>
                      <div className={styles.performanceCard}>
                        <div className={styles.performanceIcon}>📊</div>
                        <div className={styles.performanceValue}>87%</div>
                        <div className={styles.performanceLabel}>Pass Rate</div>
                        <div className={styles.performanceTrend}>↑ 3% from last semester</div>
                      </div>
                      <div className={styles.performanceCard}>
                        <div className={styles.performanceIcon}>📅</div>
                        <div className={styles.performanceValue}>95%</div>
                        <div className={styles.performanceLabel}>Attendance</div>
                        <div className={styles.performanceTrend}>Consistent</div>
                      </div>
                      <div className={styles.performanceCard}>
                        <div className={styles.performanceIcon}>📝</div>
                        <div className={styles.performanceValue}>42</div>
                        <div className={styles.performanceLabel}>Assignments Graded</div>
                        <div className={styles.performanceTrend}>This month</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionIcon}>👨‍🏫</div>
              <h3>Select a Staff Member</h3>
              <p>Choose a staff member from the list to view their details, courses, and students.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Staff Member</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {formError && <div className={styles.formError}>⚠️ {formError}</div>}
              
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

              <div className={styles.formGroup}>
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john.doe@university.edu"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  >
                    <option value="">Select Position</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Teaching Assistant">Teaching Assistant</option>
                    <option value="Lab Instructor">Lab Instructor</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Office</label>
                  <input
                    type="text"
                    value={formData.office}
                    onChange={(e) => setFormData(prev => ({ ...prev, office: e.target.value }))}
                    placeholder="Building A, Room 301"
                  />
                </div>
              </div>

              <p className={styles.formNote}>
                🔐 A temporary password will be generated and shown after creation.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleAddStaff} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Staff Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Staff Member</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {formError && <div className={styles.formError}>⚠️ {formError}</div>}
              
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
                  <label>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Business">Business</option>
                    <option value="Arts">Arts</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  >
                    <option value="">Select Position</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
                    <option value="Teaching Assistant">Teaching Assistant</option>
                    <option value="Lab Instructor">Lab Instructor</option>
                  </select>
                </div>
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
                  <label>Office</label>
                  <input
                    type="text"
                    value={formData.office}
                    onChange={(e) => setFormData(prev => ({ ...prev, office: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleUpdateStaff} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Course Modal */}
      {showAssignCourseModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAssignCourseModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Assign Course to {getFullName(selectedStaff!)}</h2>
              <button className={styles.closeBtn} onClick={() => setShowAssignCourseModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Select Course</label>
                <select>
                  <option value="">Choose a course...</option>
                  <option value="cs102">CS102 - Programming Fundamentals</option>
                  <option value="cs202">CS202 - Database Systems</option>
                  <option value="cs302">CS302 - Operating Systems</option>
                  <option value="cs401">CS401 - Machine Learning</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Semester</label>
                <select>
                  <option value="fall2025">Fall 2025</option>
                  <option value="spring2026">Spring 2026</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowAssignCourseModal(false)}>Cancel</button>
              <button className={styles.submitBtn}>Assign Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
