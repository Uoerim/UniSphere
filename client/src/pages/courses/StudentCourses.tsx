import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangleIcon, BookOpenIcon, ChartIcon, SearchIcon, BuildingIcon, CalendarIcon, LogoutIcon, CheckIcon } from '../../components/ui/Icons';
import styles from './Courses.module.css';

interface Instructor {
  id: string;
  name: string;
  email?: string;
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
  isEnrolled?: boolean;
}

/**
 * StudentCourses - View and enroll in courses
 * Features: View enrolled courses, browse available courses, enroll/unenroll
 */
export default function StudentCourses() {
  const { user } = useAuth();
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'enrolled' | 'browse'>('enrolled');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all courses
      const response = await fetch('http://localhost:4000/api/curriculum', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch courses');

      const data = await response.json();
      setAllCourses(data.filter((c: Course) => c.isActive));
      
      // Fetch enrolled courses
      try {
        const enrolledResponse = await fetch('http://localhost:4000/api/curriculum/my-courses', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (enrolledResponse.ok) {
          const enrolledData = await enrolledResponse.json();
          setEnrolledCourseIds(new Set(enrolledData.map((c: Course) => c.id)));
        }
      } catch {
        // If endpoint doesn't exist, continue without enrolled courses
        console.log('Could not fetch enrolled courses');
      }
      
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: get course prerequisites
  const getPrerequisites = (course: Course) => {
    // If course has a prerequisites array, use it; else, try to infer from allCourses
    if ((course as any).prerequisites) return (course as any).prerequisites;
    // Try to infer from allCourses (if available)
    return [];
  };

  // Helper: check if prerequisites are met
  const hasPrerequisitesMet = (course: Course) => {
    const prereqs = getPrerequisites(course);
    if (!prereqs || prereqs.length === 0) return true;
    return prereqs.every((pr: any) => enrolledCourseIds.has(pr.id));
  };

  // Helper: check if enrolling would exceed credit limit
  const wouldExceedCreditLimit = (course: Course) => {
    const credits = course.credits || 0;
    return totalCredits + credits > 15;
  };

  const handleEnroll = async (courseId: string) => {
    setEnrollingCourseId(courseId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/curriculum/${courseId}/enroll`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({}) // Let backend use current user entity
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to enroll');
      }

      // Update local state
      setEnrolledCourseIds(prev => new Set([...prev, courseId]));
      setAllCourses(prev => prev.map(c => 
        c.id === courseId 
          ? { ...c, enrolledStudents: c.enrolledStudents + 1 }
          : c
      ));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleUnenroll = async (courseId: string) => {
    setEnrollingCourseId(courseId);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/curriculum/${courseId}/unenroll/${user?.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to unenroll');
      }

      // Update local state
      setEnrolledCourseIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
      setAllCourses(prev => prev.map(c => 
        c.id === courseId 
          ? { ...c, enrolledStudents: Math.max(0, c.enrolledStudents - 1) }
          : c
      ));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const enrolledCourses = useMemo(() => {
    return allCourses.filter(c => enrolledCourseIds.has(c.id));
  }, [allCourses, enrolledCourseIds]);

  const availableCourses = useMemo(() => {
    let result = allCourses.filter(c => !enrolledCourseIds.has(c.id));

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term) ||
        c.department?.toLowerCase().includes(term)
      );
    }

    if (filterDepartment !== 'all') {
      result = result.filter(c => c.department === filterDepartment);
    }

    return result;
  }, [allCourses, enrolledCourseIds, searchTerm, filterDepartment]);

  const departments = useMemo(() => {
    const deps = new Set(allCourses.map(c => c.department).filter(Boolean));
    return Array.from(deps) as string[];
  }, [allCourses]);

  const totalCredits = useMemo(() => {
    return enrolledCourses.reduce((acc, c) => acc + (c.credits || 0), 0);
  }, [enrolledCourses]);

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
          <h1 className={styles.title}>My Courses</h1>
          <p className={styles.subtitle}>View your enrolled courses and browse available courses</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangleIcon size={16} /> {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}><BookOpenIcon size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{enrolledCourses.length}</div>
            <div className={styles.statLabel}>Enrolled Courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}><ChartIcon size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{totalCredits}</div>
            <div className={styles.statLabel}>Total Credits</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><BookOpenIcon size={24} /></div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{availableCourses.length}</div>
            <div className={styles.statLabel}>Available Courses</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tab} ${activeTab === 'enrolled' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('enrolled')}
        >
          <BookOpenIcon size={16} /> My Enrolled Courses ({enrolledCourses.length})
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'browse' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          <SearchIcon size={16} /> Browse Courses ({availableCourses.length})
        </button>
      </div>

      {/* Enrolled Courses Tab */}
      {activeTab === 'enrolled' && (
        <>
          {enrolledCourses.length === 0 ? (
            <div className={styles.emptyState}>
              <BookOpenIcon size={48} />
              <h3>No Enrolled Courses</h3>
              <p>You haven't enrolled in any courses yet. Browse available courses to get started!</p>
              <button 
                className={styles.addButton}
                onClick={() => setActiveTab('browse')}
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {enrolledCourses.map(course => (
                <div key={course.id} className={styles.courseCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.courseCode}>{course.code}</div>
                    <div className={`${styles.statusBadge} ${styles.active}`}>Enrolled</div>
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
                    {course.semester && (
                      <span className={styles.metaItem}><CalendarIcon size={14} /> {course.semester}</span>
                    )}
                  </div>
                  <div className={styles.courseDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Instructor:</span>
                      <span className={styles.detailValue}>
                        {course.instructor?.name || 'TBD'}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Room:</span>
                      <span className={styles.detailValue}>{course.room || 'TBD'}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Schedule:</span>
                      <span className={styles.detailValue}>{course.schedule || 'TBD'}</span>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <button 
                      className={styles.deleteBtn}
                      onClick={() => handleUnenroll(course.id)}
                      disabled={enrollingCourseId === course.id}
                    >
                      {enrollingCourseId === course.id ? '...' : <><LogoutIcon size={16} /> Drop Course</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Browse Courses Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Search and Filters */}
          <div className={styles.filtersBar}>
            <div className={styles.searchBox}>
              <SearchIcon size={16} />
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
          </div>

          <div className={styles.resultsInfo}>
            Showing {availableCourses.length} available courses
          </div>

          {availableCourses.length === 0 ? (
            <div className={styles.emptyState}>
              <BookOpenIcon size={48} />
              <h3>No Available Courses</h3>
              <p>There are no more courses available for enrollment or try adjusting your filters.</p>
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {availableCourses.map(course => {
                const prereqs = getPrerequisites(course);
                const prereqMet = hasPrerequisitesMet(course);
                const creditLimit = wouldExceedCreditLimit(course);
                const isFull = course.enrolledStudents >= (course.capacity || 30);
                let enrollDisabled = enrollingCourseId === course.id || isFull || !prereqMet || creditLimit;
                let enrollMsg = '';
                if (!prereqMet) {
                  enrollMsg = `Missing prerequisites: ${(prereqs || []).map((p: any) => p.name || p.code).join(', ')}`;
                } else if (creditLimit) {
                  enrollMsg = 'Credit hour limit exceeded (15)';
                } else if (isFull) {
                  enrollMsg = 'Full';
                }
                return (
                  <div key={course.id} className={styles.courseCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.courseCode}>{course.code}</div>
                      <div className={`${styles.statusBadge} ${styles.info}`}>
                        {course.enrolledStudents}/{course.capacity || 30}
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
                      {course.semester && (
                        <span className={styles.metaItem}><CalendarIcon size={14} /> {course.semester}</span>
                      )}
                    </div>
                    <div className={styles.courseDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Instructor:</span>
                        <span className={styles.detailValue}>
                          {course.instructor?.name || 'TBD'}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Room:</span>
                        <span className={styles.detailValue}>{course.room || 'TBD'}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Schedule:</span>
                        <span className={styles.detailValue}>{course.schedule || 'TBD'}</span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button 
                        className={styles.addButton}
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollDisabled}
                      >
                        {enrollingCourseId === course.id 
                          ? 'Enrolling...' 
                          : enrollMsg || <><CheckIcon size={16} /> Enroll</>}
                      </button>
                      {enrollMsg && enrollMsg !== 'Full' && (
                        <div style={{ color: 'red', fontSize: 12, marginTop: 4 }}>{enrollMsg}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
