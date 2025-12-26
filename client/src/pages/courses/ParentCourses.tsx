import { useState, useEffect } from 'react';
import { AlertTriangleIcon, UsersIcon, UserIcon, BookOpenIcon, ChartIcon, BuildingIcon, CalendarIcon, EyeIcon } from '../../components/ui/Icons';
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
  room?: string;
  schedule?: string;
  isActive: boolean;
  instructor?: Instructor | null;
}

interface Child {
  id: string;
  name: string;
  email?: string;
  courses: Course[];
}

/**
 * ParentCourses - View children's enrolled courses
 * Features: View each child's courses, see course details
 */
export default function ParentCourses() {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      // Try to fetch parent's children
      try {
        const response = await fetch('http://localhost:4000/api/users/my-children', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const childrenData = await response.json();
          
          // For each child, fetch their enrolled courses
          const childrenWithCourses = await Promise.all(
            childrenData.map(async (child: any) => {
              try {
                const coursesResponse = await fetch(
                  `http://localhost:4000/api/curriculum/student/${child.id}/courses`,
                  { headers: { 'Authorization': `Bearer ${token}` } }
                );
                
                if (coursesResponse.ok) {
                  const courses = await coursesResponse.json();
                  return { ...child, courses };
                }
              } catch {
                // If fetch fails, return child with empty courses
              }
              return { ...child, courses: [] };
            })
          );

          setChildren(childrenWithCourses);
          if (childrenWithCourses.length > 0) {
            setSelectedChild(childrenWithCourses[0]);
          }
        } else {
          // If endpoint doesn't exist, show placeholder
          setChildren([]);
        }
      } catch {
        // If fetch fails, show placeholder
        setChildren([]);
      }
      
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const openCourseDetails = (course: Course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
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
          <h1 className={styles.title}>Children's Courses</h1>
          <p className={styles.subtitle}>View courses your children are enrolled in</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangleIcon size={16} /> {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {children.length === 0 ? (
        <div className={styles.emptyState}>
          <UsersIcon size={48} />
          <h3>No Children Found</h3>
          <p>You don't have any children linked to your account. Please contact the administrator to link your children's accounts.</p>
        </div>
      ) : (
        <>
          {/* Child Tabs */}
          <div className={styles.tabsContainer}>
            {children.map(child => (
              <button
                key={child.id}
                className={`${styles.tab} ${selectedChild?.id === child.id ? styles.activeTab : ''}`}
                onClick={() => setSelectedChild(child)}
              >
                <UserIcon size={16} /> {child.name} ({child.courses.length} courses)
              </button>
            ))}
          </div>

          {/* Selected Child's Stats */}
          {selectedChild && (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.primary}`}><UserIcon size={24} /></div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{selectedChild.name}</div>
                    <div className={styles.statLabel}>Student</div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.success}`}><BookOpenIcon size={24} /></div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>{selectedChild.courses.length}</div>
                    <div className={styles.statLabel}>Enrolled Courses</div>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={`${styles.statIcon} ${styles.info}`}><ChartIcon size={24} /></div>
                  <div className={styles.statInfo}>
                    <div className={styles.statValue}>
                      {selectedChild.courses.reduce((acc, c) => acc + (c.credits || 0), 0)}
                    </div>
                    <div className={styles.statLabel}>Total Credits</div>
                  </div>
                </div>
              </div>

              {/* Child's Courses */}
              {selectedChild.courses.length === 0 ? (
                <div className={styles.emptyState}>
                  <BookOpenIcon size={48} />
                  <h3>No Enrolled Courses</h3>
                  <p>{selectedChild.name} is not enrolled in any courses yet.</p>
                </div>
              ) : (
                <div className={styles.coursesGrid}>
                  {selectedChild.courses.map(course => (
                    <div key={course.id} className={styles.courseCard}>
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
                          className={styles.viewBtn}
                          onClick={() => openCourseDetails(course)}
                        >
                          <EyeIcon size={16} /> View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
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

                {selectedCourse.description && (
                  <div className={`${styles.detailsSection} ${styles.fullWidth}`}>
                    <h3>Description</h3>
                    <p className={styles.description}>{selectedCourse.description}</p>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
