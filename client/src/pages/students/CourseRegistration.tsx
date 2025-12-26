import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpenIcon, SearchIcon, FilterIcon, ChevronDownIcon, UserIcon, CalendarIcon, CheckCircleIcon, AlertTriangleIcon } from '../../components/ui/Icons';
import styles from './CourseRegistration.module.css';

interface Course {
  id: string;
  name: string;
  code?: string;
  instructor?: any;
  instructors?: any[];
  schedule?: string;
  description?: string;
  department?: string;
  credits?: number;
  capacity?: number;
  enrolledStudents?: number;
  isActive?: boolean;
  [key: string]: any;
}

interface EnrolledCourse {
  id: string;
  name: string;
  code?: string;
  instructor?: any;
  schedule?: string;
  [key: string]: any;
}

type SortField = 'code' | 'name' | 'department' | 'credits' | 'instructor';
type SortDirection = 'asc' | 'desc';

export default function CourseRegistration() {
  const { token } = useAuth();
  
  // Course data
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterCredits, setFilterCredits] = useState('all');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  // Fetch courses on mount
  useEffect(() => {
    fetchCourses();
  }, [token]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all available courses
      const allRes = await fetch(`${import.meta.env.VITE_API_URL}/api/curriculum`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      
      if (!allRes.ok) throw new Error('Failed to fetch courses');
      const all = await allRes.json();

      // Fetch enrolled courses
      const enrolledRes = await fetch(`${import.meta.env.VITE_API_URL}/api/curriculum/my-courses`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });
      
      if (!enrolledRes.ok) throw new Error('Failed to fetch enrolled courses');
      const enrolled = await enrolledRes.json();

      setAllCourses(all);
      setEnrolledCourses(enrolled);
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Check if student is enrolled
  const isEnrolled = (courseId: string) => enrolledCourses.some(c => c.id === courseId);

  // Register for course
  const handleRegister = async (courseId: string) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/curriculum/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: null })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to register for course');
      }

      // Refresh courses
      await fetchCourses();
      setSuccessMessage('Successfully registered for course!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to register for course');
    }
  };

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(allCourses.map(c => c.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [allCourses]);

  // Get unique credit counts
  const creditOptions = useMemo(() => {
    const credits = new Set(allCourses.map(c => c.credits).filter(c => c !== undefined && c !== null));
    return Array.from(credits).sort((a, b) => a - b);
  }, [allCourses]);

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = allCourses.filter(c => !isEnrolled(c.id));

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.code?.toLowerCase().includes(term) ||
        c.name?.toLowerCase().includes(term) ||
        c.department?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      );
    }

    // Department filter
    if (filterDepartment !== 'all') {
      result = result.filter(c => c.department === filterDepartment);
    }

    // Credits filter
    if (filterCredits !== 'all') {
      result = result.filter(c => c.credits === parseInt(filterCredits));
    }

    // Sort
    result.sort((a, b) => {
      let aVal: any = a[sortField] || '';
      let bVal: any = b[sortField] || '';

      if (sortField === 'credits') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [allCourses, isEnrolled, searchTerm, filterDepartment, filterCredits, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1><BookOpenIcon size={32} /> Course Registration</h1>
          <p>Browse and register for available courses for this term</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Enrolled</span>
            <span className={styles.statValue}>{enrolledCourses.length}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Available</span>
            <span className={styles.statValue}>{filteredCourses.length}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className={styles.alert + ' ' + styles.error}>
          <AlertTriangleIcon size={20} />
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {successMessage && (
        <div className={styles.alert + ' ' + styles.success}>
          <CheckCircleIcon size={20} />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Enrolled Courses Section */}
      <div className={styles.section}>
        <h2>Your Enrolled Courses ({enrolledCourses.length})</h2>
        {enrolledCourses.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpenIcon size={48} />
            <p>You are not enrolled in any courses yet.</p>
          </div>
        ) : (
          <div className={styles.enrolledGrid}>
            {enrolledCourses.map(course => (
              <div key={course.id} className={styles.enrolledCard}>
                <div className={styles.enrolledHeader}>
                  <div className={styles.enrolledCode}>{course.code || 'N/A'}</div>
                  <div className={styles.enrolledBadge}>Enrolled</div>
                </div>
                <h3>{course.name || 'Unnamed Course'}</h3>
                <div className={styles.enrolledMeta}>
                  <span><UserIcon size={14} /> {course.instructor?.name || 'TBA'}</span>
                  <span><CalendarIcon size={14} /> {course.schedule || 'TBD'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Course Registration Section */}
      <div className={styles.section}>
        <h2>Available Courses</h2>

        {/* Filters and Search */}
        <div className={styles.controlsBar}>
          <div className={styles.searchBox}>
            <SearchIcon size={18} />
            <input
              type="text"
              placeholder="Search by code, name, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filters}>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
              value={filterCredits}
              onChange={(e) => setFilterCredits(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Credits</option>
              {creditOptions.map(credits => (
                <option key={credits} value={credits}>{credits} Credits</option>
              ))}
            </select>
          </div>
        </div>

        {/* Courses Table */}
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpenIcon size={48} />
            <p>No courses available matching your filters.</p>
          </div>
        ) : (
          <div className={styles.coursesTable}>
            <div className={styles.tableHeader}>
              <div
                className={styles.headerCell + ' ' + styles.codeCell}
                onClick={() => handleSort('code')}
              >
                Code {sortField === 'code' && <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </div>
              <div
                className={styles.headerCell + ' ' + styles.nameCell}
                onClick={() => handleSort('name')}
              >
                Course Name {sortField === 'name' && <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </div>
              <div
                className={styles.headerCell + ' ' + styles.deptCell}
                onClick={() => handleSort('department')}
              >
                Department {sortField === 'department' && <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </div>
              <div
                className={styles.headerCell + ' ' + styles.creditsCell}
                onClick={() => handleSort('credits')}
              >
                Credits {sortField === 'credits' && <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
              </div>
              <div className={styles.headerCell + ' ' + styles.instructorCell}>Instructor</div>
              <div className={styles.headerCell + ' ' + styles.enrollmentCell}>Enrollment</div>
              <div className={styles.headerCell + ' ' + styles.actionCell}>Action</div>
            </div>

            {filteredCourses.map(course => (
              <div key={course.id} className={styles.tableRow}>
                <div className={styles.cell + ' ' + styles.codeCell}>
                  <span className={styles.badge}>{course.code || 'N/A'}</span>
                </div>
                <div className={styles.cell + ' ' + styles.nameCell}>
                  <div className={styles.courseName}>{course.name || 'Unnamed Course'}</div>
                  <div className={styles.courseDesc}>{course.description || ''}</div>
                </div>
                <div className={styles.cell + ' ' + styles.deptCell}>
                  {course.department || 'N/A'}
                </div>
                <div className={styles.cell + ' ' + styles.creditsCell}>
                  {course.credits || 'N/A'} hrs
                </div>
                <div className={styles.cell + ' ' + styles.instructorCell}>
                  <div>{course.instructor?.name || 'TBA'}</div>
                  <div className={styles.smallText}>{course.schedule || 'TBD'}</div>
                </div>
                <div className={styles.cell + ' ' + styles.enrollmentCell}>
                  <div className={styles.enrollmentInfo}>
                    <span>{course.enrolledStudents || 0}/{course.capacity || 30}</span>
                    <div className={styles.enrollmentBar}>
                      <div
                        className={styles.enrollmentFill}
                        style={{ width: `${((course.enrolledStudents || 0) / (course.capacity || 30)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className={styles.cell + ' ' + styles.actionCell}>
                  <button
                    className={styles.registerBtn}
                    onClick={() => handleRegister(course.id)}
                    disabled={loading}
                  >
                    Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
