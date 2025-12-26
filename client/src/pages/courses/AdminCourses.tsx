import { useState, useEffect, useMemo } from 'react';
import styles from './Courses.module.css';
import SchedulePicker from '../../components/ui/SchedulePicker';
import {
  BookOpenIcon,
  CheckCircleIcon,
  BuildingIcon,
  UsersIcon,
  AlertTriangleIcon,
  ChartIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  LockIcon,
  UnlockIcon,
  SearchIcon,
  ClockIcon
} from '../../components/ui/Icons';

// Types
interface Instructor {
  id: string;
  name: string;
  email?: string;
  accountId?: string;
}

interface PrerequisiteCourse {
  id: string;
  name: string;
  code?: string;
}

interface Department {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  building?: string;
  roomType?: string;
  capacity?: number;
}

interface Course {
  id: string;
  name: string;
  description?: string;
  code?: string;
  credits?: number;
  department?: string;
  courseType?: string;
  capacity?: number;
  room?: string;
  schedule?: string;
  scheduleDisplay?: string;
  isActive: boolean;
  createdAt: string;
  instructor?: Instructor | null;  // Legacy support
  instructors?: Instructor[];       // Multiple instructors
  enrolledStudents: number;
  prerequisites?: PrerequisiteCourse[];
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
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCourseType, setFilterCourseType] = useState('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    credits: 3,
    department: '',
    courseType: '',
    capacity: 30,
    roomIds: [] as string[],
    schedule: '',
    scheduleDisplay: '',
    instructorIds: [] as string[],
    prerequisiteIds: [] as string[],
    courseContent: '',
    hasLecture: true,
    hasTutorial: false,
    hasLab: false,
    isActive: true,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchStats();
    fetchInstructors();
    fetchDepartments();
    fetchRooms();
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

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartmentsList(data);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/facilities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Map facilities to Room format
        const rooms = data.map((f: any) => ({
          id: String(f.id),
          name: f.name,
          building: f.roomNumber || '',
          roomType: mapFacilityTypeToRoomType(f.type),
          capacity: f.capacity
        }));
        setRoomsList(rooms);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  // Helper to map facility types to room types for grouping
  const mapFacilityTypeToRoomType = (type: string): string => {
    const typeMap: Record<string, string> = {
      'LECTURE_HALL': 'Lecture Hall',
      'CLASSROOM': 'Classroom',
      'COMPUTER_LAB': 'Computer Lab',
      'LABORATORY': 'Laboratory',
      'TUTORIAL_ROOM': 'Tutorial Room',
      'CONFERENCE_ROOM': 'Other',
      'OFFICE': 'Other'
    };
    return typeMap[type] || 'Other';
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
        c.instructors?.some(i => i.name?.toLowerCase().includes(term)) ||
        c.instructor?.name?.toLowerCase().includes(term)
      );
    }

    if (filterDepartment !== 'all') {
      result = result.filter(c => c.department === filterDepartment);
    }

    if (filterStatus !== 'all') {
      result = result.filter(c => filterStatus === 'active' ? c.isActive : !c.isActive);
    }

    if (filterCourseType !== 'all') {
      result = result.filter(c => c.courseType === filterCourseType);
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
  }, [courses, searchTerm, filterDepartment, filterStatus, filterCourseType, sortField, sortDirection]);

  const departments = useMemo(() => {
    const deps = new Set(courses.map(c => c.department).filter(Boolean));
    return Array.from(deps) as string[];
  }, [courses]);

  const courseTypes = useMemo(() => {
    const types = new Set(courses.map(c => c.courseType).filter(Boolean));
    return Array.from(types) as string[];
  }, [courses]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      credits: 3,
      department: '',
      courseType: '',
      capacity: 30,
      roomIds: [],
      schedule: '',
      scheduleDisplay: '',
      instructorIds: [],
      prerequisiteIds: [],
      courseContent: '',
      hasLecture: true,
      hasTutorial: false,
      hasLab: false,
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
      // Convert roomIds to room names for storage
      const roomNames = formData.roomIds
        .map(id => roomsList.find(r => r.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      const response = await fetch('http://localhost:4000/api/curriculum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          room: roomNames,
        }),
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
      // Convert roomIds to room names for storage
      const roomNames = formData.roomIds
        .map(id => roomsList.find(r => r.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      
      const response = await fetch(`http://localhost:4000/api/curriculum/${selectedCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          room: roomNames,
        }),
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
    // Parse room names back to IDs for the form
    const savedRoomNames = course.room ? course.room.split(', ').map(n => n.trim()) : [];
    const matchedRoomIds = savedRoomNames
      .map(name => roomsList.find(r => r.name === name)?.id)
      .filter(Boolean) as string[];
    
    setFormData({
      name: course.name,
      description: course.description || '',
      code: course.code || '',
      credits: course.credits || 3,
      department: course.department || '',
      courseType: course.courseType || '',
      capacity: course.capacity || 30,
      roomIds: matchedRoomIds,
      schedule: course.schedule || '',
      scheduleDisplay: course.scheduleDisplay || '',
      instructorIds: course.instructors?.map(i => i.id) || (course.instructor ? [course.instructor.id] : []),
      prerequisiteIds: course.prerequisites?.map(p => p.id) || [],
      courseContent: (course as any).courseContent || '',
      hasLecture: (course as any).hasLecture !== false,
      hasTutorial: (course as any).hasTutorial || false,
      hasLab: (course as any).hasLab || false,
      isActive: course.isActive,
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

  // Parse and render schedule nicely
  const renderSchedule = (scheduleDisplay?: string, scheduleJson?: string) => {
    // If we have a formatted display string, use it
    if (scheduleDisplay && !scheduleDisplay.startsWith('[')) {
      const slots = scheduleDisplay.split(';').map(s => s.trim()).filter(Boolean);
      
      return (
        <div className={styles.scheduleContainer}>
          {slots.map((slot, index) => {
            const match = slot.match(/^([A-Za-z]+)\s+(.+)$/);
            if (match) {
              const days = match[1];
              const time = match[2];
              return (
                <div key={index} className={styles.scheduleSlot}>
                  <div className={styles.scheduleDays}>
                    {days.split('').map((day, i) => (
                      <span key={i} className={styles.scheduleDay}>{day}</span>
                    ))}
                  </div>
                  <div className={styles.scheduleDivider}></div>
                  <div className={styles.scheduleTime}>
                    <ClockIcon size={12} />
                    {time}
                  </div>
                </div>
              );
            }
            return <span key={index} className={styles.scheduleText}>{slot}</span>;
          })}
        </div>
      );
    }

    // Try to parse JSON schedule
    const jsonStr = scheduleJson || scheduleDisplay;
    if (!jsonStr) return <span className={styles.noData}>Not set</span>;

    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const formatTime = (time: string) => {
          if (!time) return '';
          const [hours, minutes] = time.split(':');
          const h = parseInt(hours);
          const ampm = h >= 12 ? 'PM' : 'AM';
          const h12 = h % 12 || 12;
          return `${h12}:${minutes} ${ampm}`;
        };

        return (
          <div className={styles.scheduleContainer}>
            {parsed.map((slot: { id: string; days: string[]; startTime: string; endTime: string }, index: number) => (
              <div key={slot.id || index} className={styles.scheduleSlot}>
                <div className={styles.scheduleDays}>
                  {slot.days.map((day, i) => (
                    <span key={i} className={styles.scheduleDay}>{day}</span>
                  ))}
                </div>
                <div className={styles.scheduleDivider}></div>
                <div className={styles.scheduleTime}>
                  <ClockIcon size={12} />
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </div>
              </div>
            ))}
          </div>
        );
      }
    } catch {
      // Not valid JSON, display as text
    }

    return <span className={styles.scheduleText}>{jsonStr}</span>;
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
          <AlertTriangleIcon size={16} /> {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.primary}`}><BookOpenIcon size={24} /></div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.totalCourses}</div>
              <div className={styles.statLabel}>Total Courses</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.success}`}><CheckCircleIcon size={24} /></div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.activeCourses}</div>
              <div className={styles.statLabel}>Active</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.info}`}><BuildingIcon size={24} /></div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.departmentCount}</div>
              <div className={styles.statLabel}>Departments</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.warning}`}><UsersIcon size={24} /></div>
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
          <SearchIcon size={16} color="#64748b" />
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
          value={filterCourseType}
          onChange={(e) => setFilterCourseType(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">All Types</option>
          {courseTypes.map(type => (
            <option key={type} value={type}>{type}</option>
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
              <BookOpenIcon size={48} />
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
                    <span className={styles.metaItem}><BuildingIcon size={14} /> {course.department}</span>
                  )}
                  {course.credits && (
                    <span className={styles.metaItem}><ChartIcon size={14} /> {course.credits} Credits</span>
                  )}
                  {course.courseType && (
                    <span className={styles.metaItem}><BookOpenIcon size={14} /> {course.courseType}</span>
                  )}
                </div>
                <div className={styles.courseDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Instructor{(course.instructors?.length || 0) > 1 ? 's' : ''}:</span>
                    <span className={styles.detailValue}>
                      {course.instructors && course.instructors.length > 0 
                        ? course.instructors.map(i => i.name).join(', ')
                        : course.instructor?.name || 'Not Assigned'}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Enrolled:</span>
                    <span className={styles.detailValue}>
                      {course.enrolledStudents}/{course.capacity || 30}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Schedule:</span>
                    <span className={styles.detailValue}>
                      {renderSchedule(course.scheduleDisplay, course.schedule)}
                    </span>
                  </div>
                  {course.prerequisites && course.prerequisites.length > 0 && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Prerequisites:</span>
                      <span className={styles.detailValue}>
                        {course.prerequisites.map(p => p.code || p.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.viewBtn} onClick={() => openDetailsModal(course)}>
                    <EyeIcon size={14} /> View
                  </button>
                  <button className={styles.editBtn} onClick={() => openEditModal(course)}>
                    <EditIcon size={14} /> Edit
                  </button>
                  <button
                    className={styles.toggleBtn}
                    onClick={() => handleToggleStatus(course)}
                    title={course.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {course.isActive ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
                  </button>
                  <button className={styles.deleteBtn} onClick={() => openDeleteModal(course)}>
                    <TrashIcon size={14} />
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
                      {course.courseType && <span className={styles.courseTypeTag}>{course.courseType}</span>}
                    </div>
                  </td>
                  <td>{course.department || '-'}</td>
                  <td className={styles.creditsCell}>{course.credits || '-'}</td>
                  <td>
                    {course.instructors && course.instructors.length > 0 
                      ? course.instructors.map(i => i.name).join(', ')
                      : course.instructor?.name || 'Not Assigned'}
                  </td>
                  <td>
                    <span className={styles.enrollmentBadge}>
                      {course.enrolledStudents}/{course.capacity || 30}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${course.isActive ? styles.active : styles.inactive}`}>
                      {course.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.tableActions}>
                      <button onClick={() => openDetailsModal(course)} title="View Details"><EyeIcon size={14} /></button>
                      <button onClick={() => openEditModal(course)} title="Edit"><EditIcon size={14} /></button>
                      <button onClick={() => handleToggleStatus(course)} title={course.isActive ? 'Deactivate' : 'Activate'}>
                        {course.isActive ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
                      </button>
                      <button onClick={() => openDeleteModal(course)} title="Delete"><TrashIcon size={14} /></button>
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
              {formError && <div className={styles.formError}><AlertTriangleIcon size={14} /> {formError}</div>}

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
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
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
                  <label>Course Type</label>
                  <select
                    value={formData.courseType}
                    onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
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
                  <label>Rooms</label>
                  <button
                    type="button"
                    className={styles.selectButton}
                    onClick={() => setShowRoomModal(true)}
                  >
                    {formData.roomIds.length > 0
                      ? `${formData.roomIds.length} room${formData.roomIds.length > 1 ? 's' : ''} selected`
                      : 'Select Rooms'}
                  </button>
                  {formData.roomIds.length > 0 && (
                    <div className={styles.selectedTags}>
                      {formData.roomIds.map(id => {
                        const room = roomsList.find(r => r.id === id);
                        return room ? (
                          <span key={id} className={styles.tag}>
                            {room.building ? `${room.building} - ${room.name}` : room.name}
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, roomIds: formData.roomIds.filter(r => r !== id) })}
                            >×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label>Instructors</label>
                  <button
                    type="button"
                    className={styles.selectButton}
                    onClick={() => setShowInstructorModal(true)}
                  >
                    {formData.instructorIds.length > 0
                      ? `${formData.instructorIds.length} instructor${formData.instructorIds.length > 1 ? 's' : ''} selected`
                      : 'Select Instructors'}
                  </button>
                  {formData.instructorIds.length > 0 && (
                    <div className={styles.selectedTags}>
                      {formData.instructorIds.map(id => {
                        const inst = instructors.find(i => i.id === id);
                        return inst ? (
                          <span key={id} className={styles.tag}>
                            {inst.name}
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, instructorIds: formData.instructorIds.filter(i => i !== id) })}
                            >×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <SchedulePicker
                    value={formData.schedule}
                    onChange={(json, display) => setFormData({ ...formData, schedule: json, scheduleDisplay: display })}
                    label="Schedule"
                  />
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
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Session Types</label>
                  <div className={styles.prerequisitesSelect} style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <label className={styles.checkboxLabel} style={{ opacity: 0.7 }}>
                      <input type="checkbox" checked={formData.hasLecture} disabled />
                      <span>Lecture (Required)</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.hasTutorial}
                        onChange={(e) => setFormData({ ...formData, hasTutorial: e.target.checked })}
                      />
                      <span>Tutorial</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.hasLab}
                        onChange={(e) => setFormData({ ...formData, hasLab: e.target.checked })}
                      />
                      <span>Lab</span>
                    </label>
                  </div>
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Course Content (Lecture Topics)</label>
                  <textarea
                    value={formData.courseContent}
                    onChange={(e) => setFormData({ ...formData, courseContent: e.target.value })}
                    placeholder="Enter lecture topics, one per line..."
                    rows={4}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Prerequisites</label>
                  <div className={styles.prerequisitesSelect}>
                    {courses.filter(c => c.id !== selectedCourse?.id).map(course => (
                      <label key={course.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.prerequisiteIds.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, prerequisiteIds: [...formData.prerequisiteIds, course.id] });
                            } else {
                              setFormData({ ...formData, prerequisiteIds: formData.prerequisiteIds.filter(id => id !== course.id) });
                            }
                          }}
                        />
                        <span>{course.code} - {course.name}</span>
                      </label>
                    ))}
                    {courses.length === 0 && <span className={styles.noData}>No courses available</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleAddCourse} disabled={isSubmitting}>
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
              {formError && <div className={styles.formError}><AlertTriangleIcon size={14} /> {formError}</div>}

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
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map(dept => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
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
                  <label>Course Type</label>
                  <select
                    value={formData.courseType}
                    onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
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
                  <label>Rooms</label>
                  <button
                    type="button"
                    className={styles.selectButton}
                    onClick={() => setShowRoomModal(true)}
                  >
                    {formData.roomIds.length > 0
                      ? `${formData.roomIds.length} room${formData.roomIds.length > 1 ? 's' : ''} selected`
                      : 'Select Rooms'}
                  </button>
                  {formData.roomIds.length > 0 && (
                    <div className={styles.selectedTags}>
                      {formData.roomIds.map(id => {
                        const room = roomsList.find(r => r.id === id);
                        return room ? (
                          <span key={id} className={styles.tag}>
                            {room.building ? `${room.building} - ${room.name}` : room.name}
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, roomIds: formData.roomIds.filter(r => r !== id) })}
                            >×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className={styles.formGroup}>
                  <label>Instructors</label>
                  <button
                    type="button"
                    className={styles.selectButton}
                    onClick={() => setShowInstructorModal(true)}
                  >
                    {formData.instructorIds.length > 0
                      ? `${formData.instructorIds.length} instructor${formData.instructorIds.length > 1 ? 's' : ''} selected`
                      : 'Select Instructors'}
                  </button>
                  {formData.instructorIds.length > 0 && (
                    <div className={styles.selectedTags}>
                      {formData.instructorIds.map(id => {
                        const inst = instructors.find(i => i.id === id);
                        return inst ? (
                          <span key={id} className={styles.tag}>
                            {inst.name}
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, instructorIds: formData.instructorIds.filter(i => i !== id) })}
                            >×</button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <SchedulePicker
                    value={formData.schedule}
                    onChange={(json, display) => setFormData({ ...formData, schedule: json, scheduleDisplay: display })}
                    label="Schedule"
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Session Types</label>
                  <div className={styles.prerequisitesSelect} style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <label className={styles.checkboxLabel} style={{ opacity: 0.7 }}>
                      <input type="checkbox" checked={formData.hasLecture} disabled />
                      <span>Lecture (Required)</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.hasTutorial}
                        onChange={(e) => setFormData({ ...formData, hasTutorial: e.target.checked })}
                      />
                      <span>Tutorial</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.hasLab}
                        onChange={(e) => setFormData({ ...formData, hasLab: e.target.checked })}
                      />
                      <span>Lab</span>
                    </label>
                  </div>
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Course Content (Lecture Topics)</label>
                  <textarea
                    value={formData.courseContent}
                    onChange={(e) => setFormData({ ...formData, courseContent: e.target.value })}
                    placeholder="Enter lecture topics, one per line..."
                    rows={4}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Prerequisites</label>
                  <div className={styles.prerequisitesSelect}>
                    {courses.filter(c => c.id !== selectedCourse?.id).map(course => (
                      <label key={course.id} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.prerequisiteIds.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, prerequisiteIds: [...formData.prerequisiteIds, course.id] });
                            } else {
                              setFormData({ ...formData, prerequisiteIds: formData.prerequisiteIds.filter(id => id !== course.id) });
                            }
                          }}
                        />
                        <span>{course.code} - {course.name}</span>
                      </label>
                    ))}
                    {courses.length <= 1 && <span className={styles.noData}>No other courses available</span>}
                  </div>
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Course Status</label>
                  <div className={styles.statusToggle}>
                    <label className={styles.toggleLabel}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <span className={styles.toggleSlider}></span>
                      <span className={styles.toggleText}>{formData.isActive ? 'Active' : 'Inactive'}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleEditCourse} disabled={isSubmitting}>
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
                <span className={styles.warningIcon}><AlertTriangleIcon size={24} color="#f59e0b" /></span>
                <p>Are you sure you want to delete <strong>{selectedCourse.name}</strong>?</p>
                <p className={styles.warningText}>
                  This will permanently remove the course and all associated data including enrollments.
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={handleDeleteCourse} disabled={isSubmitting}>
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
                      {renderSchedule(selectedCourse.scheduleDisplay, selectedCourse.schedule)}
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Capacity:</span>
                      <span>{selectedCourse.capacity || 30} students</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailsSection}>
                  <h3>Instructor{(selectedCourse.instructors?.length || 0) > 1 ? 's' : ''}</h3>
                  {(selectedCourse.instructors && selectedCourse.instructors.length > 0) || selectedCourse.instructor ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(selectedCourse.instructors || (selectedCourse.instructor ? [selectedCourse.instructor] : [])).map((instr, idx) => (
                        <div key={instr.id || idx} className={styles.instructorCard}>
                          <div className={styles.instructorAvatar}>
                            {instr.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div className={styles.instructorInfo}>
                            <strong>{instr.name}</strong>
                            <span>{instr.email}</span>
                          </div>
                        </div>
                      ))}
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
                      {selectedCourse.enrolledStudents}/{selectedCourse.capacity || 30} students enrolled
                    </span>
                  </div>
                </div>

                {selectedCourse.description && (
                  <div className={`${styles.detailsSection} ${styles.fullWidth}`}>
                    <h3>Description</h3>
                    <p className={styles.description}>{selectedCourse.description}</p>
                  </div>
                )}

                <div className={`${styles.detailsSection} ${styles.fullWidth}`}>
                  <h3>Prerequisites</h3>
                  {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 ? (
                    <div className={styles.prerequisitesList}>
                      {selectedCourse.prerequisites.map(prereq => (
                        <span key={prereq.id} className={styles.prerequisiteBadge}>
                          {prereq.code || prereq.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noData}>No prerequisites required</p>
                  )}
                </div>

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
              <button className={styles.cancelBtn} onClick={() => setShowDetailsModal(false)}>Close</button>
              <button className={styles.editBtn} onClick={() => { setShowDetailsModal(false); openEditModal(selectedCourse); }}>
                <EditIcon size={14} /> Edit Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructor Selection Modal */}
      {showInstructorModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInstructorModal(false)}>
          <div className={styles.modal} style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Select Instructors</h2>
              <button className={styles.closeBtn} onClick={() => setShowInstructorModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.instructorSearchList}>
                {instructors.length > 0 ? (
                  instructors.map(inst => (
                    <label key={inst.id || inst.accountId} className={styles.instructorItem}>
                      <input
                        type="checkbox"
                        checked={formData.instructorIds.includes(inst.id || '')}
                        onChange={(e) => {
                          const instId = inst.id || '';
                          if (e.target.checked) {
                            setFormData({ ...formData, instructorIds: [...formData.instructorIds, instId] });
                          } else {
                            setFormData({ ...formData, instructorIds: formData.instructorIds.filter(id => id !== instId) });
                          }
                        }}
                      />
                      <div className={styles.instructorInfo}>
                        <span className={styles.instructorName}>{inst.name}</span>
                        <span className={styles.instructorEmail}>{inst.email}</span>
                      </div>
                    </label>
                  ))
                ) : (
                  <p className={styles.noData}>No instructors available</p>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowInstructorModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={() => setShowInstructorModal(false)}>
                Done ({formData.instructorIds.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Selection Modal */}
      {showRoomModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRoomModal(false)}>
          <div className={styles.modal} style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Select Rooms</h2>
              <button className={styles.closeBtn} onClick={() => setShowRoomModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                Select lecture halls, classrooms, labs, or other rooms for this course.
              </p>
              
              {/* Group rooms by type */}
              {['Lecture Hall', 'Classroom', 'Computer Lab', 'Laboratory', 'Tutorial Room', 'Other'].map(roomType => {
                const roomsOfType = roomsList.filter(r => 
                  (r.roomType === roomType) || 
                  (!r.roomType && roomType === 'Other')
                );
                if (roomsOfType.length === 0) return null;
                
                return (
                  <div key={roomType} style={{ marginBottom: '16px' }}>
                    <h4 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {roomType}s
                    </h4>
                    <div className={styles.instructorSearchList}>
                      {roomsOfType.map(room => (
                        <label key={room.id} className={styles.instructorItem}>
                          <input
                            type="checkbox"
                            checked={formData.roomIds.includes(room.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, roomIds: [...formData.roomIds, room.id] });
                              } else {
                                setFormData({ ...formData, roomIds: formData.roomIds.filter(id => id !== room.id) });
                              }
                            }}
                          />
                          <div className={styles.instructorInfo}>
                            <span className={styles.instructorName}>
                              {room.building ? `${room.building} - ${room.name}` : room.name}
                            </span>
                            <span className={styles.instructorEmail}>
                              {room.capacity ? `Capacity: ${room.capacity}` : ''}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {roomsList.length === 0 && (
                <p className={styles.noData}>No rooms available. Please add rooms in Facilities first.</p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowRoomModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={() => setShowRoomModal(false)}>
                Done ({formData.roomIds.length} selected)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
