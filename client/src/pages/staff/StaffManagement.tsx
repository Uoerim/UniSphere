import { useState, useEffect, useMemo } from 'react';
import styles from './StaffManagement.module.css';
import api from '../../lib/api';
import { StaffIcon, CheckCircleIcon, BuildingIcon, BookOpenIcon, SearchIcon, UsersIcon, BriefcaseIcon, EditIcon, TrashIcon, CalendarIcon, EyeIcon, MailIcon, ChartIcon, FileTextIcon, AlertTriangleIcon, LockIcon } from '../../components/ui/Icons';

// Country codes for phone picker
const COUNTRY_CODES = [
  { code: '+1', country: 'US' },
  { code: '+44', country: 'UK' },
  { code: '+20', country: 'EG' },
  { code: '+966', country: 'SA' },
  { code: '+971', country: 'AE' },
  { code: '+974', country: 'QA' },
  { code: '+965', country: 'KW' },
  { code: '+973', country: 'BH' },
  { code: '+968', country: 'OM' },
  { code: '+962', country: 'JO' },
  { code: '+961', country: 'LB' },
  { code: '+91', country: 'IN' },
  { code: '+86', country: 'CN' },
  { code: '+81', country: 'JP' },
  { code: '+82', country: 'KR' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+39', country: 'IT' },
  { code: '+34', country: 'ES' },
  { code: '+31', country: 'NL' },
];

// Types
interface Department {
  id: string;
  name: string;
  code: string;
}

interface Facility {
  id: number;
  name: string;
  roomNumber: string;
  type: string;
  building: string;
}

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
  departmentId?: string;
  position?: string;
  phone?: string;
  phoneCountry?: string;
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

// Format schedule JSON/array/string into human-readable text
const dayName = (abbr: string) => {
  const map: Record<string, string> = {
    Su: 'Sunday', Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday'
  };
  return map[abbr] || abbr;
};

const formatSchedule = (schedule?: any): string => {
  if (!schedule) return 'Schedule TBD';

  const toText = (value: any): string => {
    if (Array.isArray(value)) {
      return value
        .map((item: any) => {
          if (!item) return '';
          const days = Array.isArray(item.days) ? item.days.map((d: string) => dayName(d)).join(', ') : '';
          const time = item.startTime && item.endTime ? `${item.startTime}–${item.endTime}` : '';
          return [days, time].filter(Boolean).join(' ');
        })
        .filter(Boolean)
        .join(' | ');
    }
    return '';
  };

  try {
    const parsed = typeof schedule === 'string' ? JSON.parse(schedule) : schedule;
    const result = toText(parsed);
    if (result) return result;
  } catch {
    // ignore parse errors and fall back
  }

  return typeof schedule === 'string' ? schedule : 'Schedule TBD';
};

export default function StaffManagement() {
  // Staff list state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [facilitiesList, setFacilitiesList] = useState<Facility[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState('');

  // Selected staff member
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Staff's data
  const [staffCourses, setStaffCourses] = useState<Course[]>([]);
  const [staffStudents, setStaffStudents] = useState<Student[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

  // Assign modal state
  const [assignCourseId, setAssignCourseId] = useState('');
  const [assignSemester, setAssignSemester] = useState('Fall 2025');
  const [assignError, setAssignError] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
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
    departmentId: '',
    position: '',
    phone: '',
    phoneCountry: '+1',
    office: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchStaffList();
    fetchDepartments();
    fetchFacilities();
  }, []);

  const getStaffEntityId = (staff?: StaffMember | null) => staff?.entityId || staff?.id || '';

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Failed to fetch departments, status:', response.status);
        return;
      }
      
      const data = await response.json();
      // Only show active departments
      const activeDepts = data.filter((d: any) => d.isActive !== false);
      setDepartmentsList(activeDepts);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await api.get('/facilities');
      // Filter to only show offices
      const facilities = (res.data as Facility[]).filter(f => f.type === 'OFFICE');
      setFacilitiesList(facilities);
    } catch (err) {
      console.error('Failed to fetch facilities:', err);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:4000/api/curriculum', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load courses');
      const data = await res.json();
      setAvailableCourses(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        code: c.code || c.courseCode || 'N/A',
        department: c.department || '—',
        students: c.enrolledStudents || 0,
        schedule: formatSchedule(c.schedule || c.metadata?.schedule),
        semester: c.semester || 'Current'
      })));
    } catch (err) {
      console.error('Failed to fetch available courses:', err);
      setAvailableCourses([]);
    }
  };

  useEffect(() => {
    if (selectedStaff) {
      const staffKey = getStaffEntityId(selectedStaff);
      if (staffKey) {
        fetchStaffDetails(staffKey);
      }
    }
  }, [selectedStaff?.id]);

  useEffect(() => {
    if (showAssignCourseModal) {
      fetchAvailableCourses();
      setAssignError('');
    } else {
      setAssignCourseId('');
    }
  }, [showAssignCourseModal]);

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
          name: c.name || c.courseName || 'Unnamed Course',
          code: c.courseCode || c.code || 'N/A',
          department: c.department || 'Not Assigned',
          students: c.enrolledStudents || c.students || 0,
          schedule: formatSchedule(c.metadata?.schedule || c.schedule),
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
          name: s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.name || s.email || 'Unknown',
          email: s.email || 'No email',
          course: s.course?.code || s.course?.name || 'N/A',
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
  }, [staffList, searchTerm, filterDepartment, sortField, sortDirection]);

  // Calculate performance metrics based on real data
  const performanceMetrics = useMemo(() => {
    if (!staffStudents.length) {
      return {
        averageGrade: 'N/A',
        passRate: 'N/A',
        averageAttendance: 'N/A',
        totalStudents: 0,
        coursesAssigned: staffCourses.length
      };
    }

    // Calculate average grade (assuming grades are A, B, C, D, F or numeric)
    const gradesWithValues = staffStudents
      .filter(s => s.grade && s.grade !== 'N/A')
      .map(s => {
        const grade = s.grade!;
        // Convert letter grades to numeric
        if (grade === 'A') return 4.0;
        if (grade === 'B') return 3.0;
        if (grade === 'C') return 2.0;
        if (grade === 'D') return 1.0;
        if (grade === 'F') return 0.0;
        // Try to parse as number
        const numeric = parseFloat(grade);
        return isNaN(numeric) ? null : numeric;
      })
      .filter(v => v !== null) as number[];

    const avgGrade = gradesWithValues.length > 0
      ? (gradesWithValues.reduce((a, b) => a + b, 0) / gradesWithValues.length).toFixed(2)
      : 'N/A';

    // Calculate pass rate (grades C or above, or numeric >= 2.0)
    const passingStudents = staffStudents.filter(s => {
      if (!s.grade || s.grade === 'N/A') return false;
      const grade = s.grade;
      if (['A', 'B', 'C'].includes(grade)) return true;
      if (['D', 'F'].includes(grade)) return false;
      const numeric = parseFloat(grade);
      return !isNaN(numeric) && numeric >= 2.0;
    });

    const passRate = staffStudents.length > 0
      ? Math.round((passingStudents.length / staffStudents.length) * 100)
      : 0;

    // Calculate average attendance
    const attendanceValues = staffStudents
      .map(s => s.attendance || 0)
      .filter(a => a > 0);

    const avgAttendance = attendanceValues.length > 0
      ? Math.round(attendanceValues.reduce((a, b) => a + b, 0) / attendanceValues.length)
      : 0;

    return {
      averageGrade: avgGrade,
      passRate: passRate > 0 ? `${passRate}%` : 'N/A',
      averageAttendance: avgAttendance > 0 ? `${avgAttendance}%` : 'N/A',
      totalStudents: staffStudents.length,
      coursesAssigned: staffCourses.length
    };
  }, [staffStudents, staffCourses]);

  // Use departmentsList for the filter dropdown
  const departments = useMemo(() => {
    return departmentsList.map(d => d.name);
  }, [departmentsList]);

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
    if (!selectedStaff) {
      setFormError('No staff selected');
      return;
    }

    // Use entityId if available, otherwise use account id
    const updateId = selectedStaff.entityId || selectedStaff.id;

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:4000/api/staff/${updateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          attributes: {
            email: selectedStaff.email,
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

      // Get the entityId from response if created
      const result = await response.json();

      await fetchStaffList();
      setShowEditModal(false);

      // Update selected staff with new data and entityId
      setSelectedStaff(prev => prev ? {
        ...prev,
        ...formData,
        entityId: result.entityId || prev.entityId,
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

  const handleAssignCourse = async () => {
    if (!selectedStaff) return;
    const staffKey = getStaffEntityId(selectedStaff);
    if (!staffKey) {
      setAssignError('Missing staff profile (entity).');
      return;
    }
    if (!assignCourseId) {
      setAssignError('Select a course first.');
      return;
    }

    setAssignLoading(true);
    setAssignError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/staff-courses/${staffKey}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId: assignCourseId, semester: assignSemester })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to assign course');
      }

      await fetchStaffDetails(staffKey);
      setShowAssignCourseModal(false);
      setAssignCourseId('');
    } catch (err: any) {
      setAssignError(err.message || 'Failed to assign course');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    if (!selectedStaff) return;
    const staffKey = getStaffEntityId(selectedStaff);
    if (!staffKey) return;
    if (!confirm('Remove this course assignment?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:4000/api/staff-courses/${staffKey}/unassign/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to remove assignment');
      }

      await fetchStaffDetails(staffKey);
    } catch (err: any) {
      alert(err.message || 'Failed to remove course');
    }
  };

  const openEditModal = () => {
    if (selectedStaff) {
      setFormData({
        firstName: selectedStaff.firstName || '',
        lastName: selectedStaff.lastName || '',
        email: selectedStaff.email,
        department: selectedStaff.department || '',
        departmentId: selectedStaff.departmentId || '',
        position: selectedStaff.position || '',
        phone: selectedStaff.phone || '',
        phoneCountry: selectedStaff.phoneCountry || '+1',
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
      departmentId: '',
      position: '',
      phone: '',
      phoneCountry: '+1',
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
          <div className={`${styles.statIcon} ${styles.primary}`}><StaffIcon /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Staff</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}><CheckCircleIcon /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.active}</div>
            <div className={styles.statLabel}>Active</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><BuildingIcon /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.departments}</div>
            <div className={styles.statLabel}>Departments</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}><BookOpenIcon /></div>
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
              <span><SearchIcon /></span>
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
              <option value="email-asc">Email A-Z</option>
              <option value="email-desc">Email Z-A</option>
              <option value="department-asc">Department A-Z</option>
              <option value="department-desc">Department Z-A</option>
            </select>
          </div>

          {/* Staff List */}
          <div className={styles.staffList}>
            {filteredStaff.length === 0 ? (
              <div className={styles.emptyList}>
                <span><UsersIcon /></span>
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
                    <span className={styles.metaItem}><BuildingIcon /> {selectedStaff.department || 'No Department'}</span>
                    <span className={styles.metaItem}><BriefcaseIcon /> {selectedStaff.position || 'Staff'}</span>
                    {selectedStaff.office && <span className={styles.metaItem}><BuildingIcon /> {selectedStaff.office}</span>}
                  </div>
                </div>
                <div className={styles.detailActions}>
                  <button className={styles.editBtn} onClick={openEditModal}><EditIcon /> Edit</button>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteStaff(selectedStaff.id)}><TrashIcon /></button>
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
                      {staffCourses.length === 0 && (
                        <div className={styles.emptyList}>
                          <span>📚</span>
                          <p>No courses assigned</p>
                        </div>
                      )}
                      {staffCourses.map(course => (
                        <div key={course.id} className={styles.courseCard}>
                          <div className={styles.courseInfo}>
                            <div className={styles.courseCode}>{course.code}</div>
                            <div className={styles.courseName}>{course.name}</div>
                            <div className={styles.courseMeta}>
                              <span><BookOpenIcon /> {course.department}</span>
                              <span><UsersIcon /> {course.students} students</span>
                              <span><CalendarIcon /> {course.schedule}</span>
                            </div>
                          </div>
                          <div className={styles.courseActions}>
                            <button className={styles.viewBtn}>View Details</button>
                            <button className={styles.removeBtn} onClick={() => handleRemoveCourse(course.id)}>Remove</button>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'schedule' && (
                  <div className={styles.scheduleTab}>
                    <div className={styles.tabHeader}>
                      <h3>Schedule</h3>
                    </div>
                    {staffCourses.length === 0 ? (
                      <div className={styles.emptyList}>
                        <span>📅</span>
                        <p>No scheduled courses</p>
                      </div>
                    ) : (
                      <div className={styles.coursesList}>
                        {staffCourses.map(course => (
                          <div key={course.id} className={styles.courseCard}>
                            <div className={styles.courseInfo}>
                              <div className={styles.courseCode}>{course.code}</div>
                              <div className={styles.courseName}>{course.name}</div>
                              <div className={styles.courseMeta}>
                                <span><CalendarIcon /> {course.schedule || 'Schedule TBD'}</span>
                                <span><BookOpenIcon /> {course.department}</span>
                                <span><UsersIcon /> {course.students} students</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'performance' && (
                  <div className={styles.performanceTab}>
                    <div className={styles.tabHeader}>
                      <h3>Performance Metrics</h3>
                    </div>
                    <div className={styles.performanceGrid}>
                      <div className={styles.performanceCard}>
                        <div className={styles.performanceIcon}><CheckCircleIcon /></div>
                        <div className={styles.performanceValue}>
                          {performanceMetrics.averageGrade !== 'N/A' 
                            ? `${performanceMetrics.averageGrade}/4.0` 
                            : 'N/A'}
                        </div>
                        <div className={styles.performanceLabel}>Average Grade</div>
                        <div className={styles.performanceTrend}>
                          {performanceMetrics.totalStudents > 0 
                            ? `Based on ${performanceMetrics.totalStudents} students`
                            : 'No data available'}
                        </div>
                      </div>
                      <div className={styles.performanceCard}>
                        <div className={styles.performanceIcon}><ChartIcon /></div>
                        <div className={styles.performanceValue}>{performanceMetrics.passRate}</div>
                        <div className={styles.performanceLabel}>Pass Rate</div>
                        <div className={styles.performanceTrend}>
                          {performanceMetrics.passRate !== 'N/A' 
                            ? 'C grade or above'
                            : 'No graded students'}
                        </div>
                      </div>
                      <div className={styles.performanceCard}>
                        <div className={styles.performanceIcon}><CalendarIcon /></div>
                        <div className={styles.performanceValue}>{performanceMetrics.averageAttendance}</div>
                        <div className={styles.performanceLabel}>Average Attendance</div>
                        <div className={styles.performanceTrend}>
                          {performanceMetrics.averageAttendance !== 'N/A'
                            ? 'Across all students'
                            : 'No attendance data'}
                        </div>
                      </div>
                      <div className={styles.performanceCard}>
                        <div className={styles.performanceIcon}><BookOpenIcon /></div>
                        <div className={styles.performanceValue}>{performanceMetrics.coursesAssigned}</div>
                        <div className={styles.performanceLabel}>Courses Assigned</div>
                        <div className={styles.performanceTrend}>
                          {performanceMetrics.totalStudents} total students
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionIcon}><StaffIcon /></div>
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
              {formError && <div className={styles.formError}><AlertTriangleIcon /> {formError}</div>}

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
                    value={formData.departmentId}
                    onChange={(e) => {
                      const dept = departmentsList.find(d => d.id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        departmentId: e.target.value,
                        department: dept?.name || ''
                      }));
                    }}
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
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
                    <option value="Advisor">Advisor</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Phone</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={formData.phoneCountry}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneCountry: e.target.value }))}
                    style={{ width: '110px', flexShrink: 0 }}
                  >
                    {COUNTRY_CODES.map(cc => (
                      <option key={cc.code} value={cc.code}>{cc.code} ({cc.country})</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Office</label>
                <select
                  value={formData.office}
                  onChange={(e) => setFormData(prev => ({ ...prev, office: e.target.value }))}
                >
                  <option value="">Select Office</option>
                  {facilitiesList.map(facility => (
                    <option key={facility.id} value={`${facility.building} - ${facility.roomNumber}`}>
                      {facility.building} - {facility.roomNumber} ({facility.name})
                    </option>
                  ))}
                </select>
              </div>

              <p className={styles.formNote}>
                <LockIcon /> A temporary password will be generated and shown after creation.
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
              {formError && <div className={styles.formError}><AlertTriangleIcon /> {formError}</div>}

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
                    value={formData.departmentId}
                    onChange={(e) => {
                      const dept = departmentsList.find(d => d.id === e.target.value);
                      setFormData(prev => ({
                        ...prev,
                        departmentId: e.target.value,
                        department: dept?.name || ''
                      }));
                    }}
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
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
                    <option value="Advisor">Advisor</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Phone</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={formData.phoneCountry}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneCountry: e.target.value }))}
                    style={{ width: '110px', flexShrink: 0 }}
                  >
                    {COUNTRY_CODES.map(cc => (
                      <option key={cc.code} value={cc.code}>{cc.code} ({cc.country})</option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Office</label>
                <select
                  value={formData.office}
                  onChange={(e) => setFormData(prev => ({ ...prev, office: e.target.value }))}
                >
                  <option value="">Select Office</option>
                  {facilitiesList.map(facility => (
                    <option key={facility.id} value={`${facility.building} - ${facility.roomNumber}`}>
                      {facility.building} - {facility.roomNumber} ({facility.name})
                    </option>
                  ))}
                </select>
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
              {assignError && <div className={styles.formError}>⚠️ {assignError}</div>}
              <div className={styles.formGroup}>
                <label>Select Course</label>
                <select value={assignCourseId} onChange={(e) => setAssignCourseId(e.target.value)}>
                  <option value="">Choose a course...</option>
                  {availableCourses
                    .filter(c => !staffCourses.some(sc => sc.id === c.id))
                    .map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                  ))}
                </select>
                {availableCourses.length === 0 && (
                  <p className={styles.smallNote}>No courses available to assign.</p>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Semester</label>
                <input
                  type="text"
                  value={assignSemester}
                  onChange={(e) => setAssignSemester(e.target.value)}
                  placeholder="e.g., Fall 2025"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowAssignCourseModal(false)}>Cancel</button>
              <button className={styles.submitBtn} onClick={handleAssignCourse} disabled={assignLoading}>
                {assignLoading ? 'Assigning...' : 'Assign Course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
