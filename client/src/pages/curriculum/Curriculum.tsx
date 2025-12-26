import { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import { BookOpenIcon, CheckCircleIcon, BuildingIcon, StaffIcon, SearchIcon, EditIcon, TrashIcon } from '../../components/ui/Icons';
import styles from '../../styles/pages.module.css';
import modalStyles from '../../components/ui/Modal.module.css';

interface Course {
  id: string;
  name: string;
  code?: string;
  department?: string;
  credits?: string;
  instructor?: string;
  schedule?: string;
  createdAt: string;
  isActive: boolean;
}

export default function Curriculum() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    credits: '',
    instructor: '',
    schedule: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/curriculum', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/curriculum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', code: '', department: '', credits: '', instructor: '', schedule: '' });
        fetchCourses();
      }
    } catch (error) {
      console.error('Failed to create course:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:4000/api/curriculum/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCourses();
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  // Get unique departments
  const departments = [...new Set(courses.map(c => c.department).filter(Boolean))];

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'all' || course.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const getDeptColor = (dept?: string) => {
    const colors: Record<string, string> = {
      'Computer Science': '#4f6ef7',
      'Mathematics': '#10b981',
      'Physics': '#f59e0b',
      'Chemistry': '#ef4444',
      'Biology': '#22c55e',
      'Engineering': '#8b5cf6'
    };
    return colors[dept || ''] || '#6b7280';
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Curriculum</h1>
          <p className={styles.pageSubtitle}>Manage courses and academic programs</p>
        </div>
        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setIsModalOpen(true)}>
          + Add Course
        </button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}><BookOpenIcon /></div>
          <div>
            <div className={styles.statValue}>{courses.length}</div>
            <div className={styles.statLabel}>Total Courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}><CheckCircleIcon /></div>
          <div>
            <div className={styles.statValue}>{courses.filter(c => c.isActive).length}</div>
            <div className={styles.statLabel}>Active Courses</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.info}`}><BuildingIcon /></div>
          <div>
            <div className={styles.statValue}>{departments.length}</div>
            <div className={styles.statLabel}>Departments</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.warning}`}><StaffIcon /></div>
          <div>
            <div className={styles.statValue}>{new Set(courses.map(c => c.instructor).filter(Boolean)).size}</div>
            <div className={styles.statLabel}>Instructors</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}><SearchIcon /></span>
          <input
            type="text"
            placeholder="Search courses, codes, instructors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
        >
          <option value="all">All Departments</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {/* Courses Table */}
      {isLoading ? (
        <div className={styles.loading}>Loading courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className={styles.card}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><BookOpenIcon /></div>
            <div className={styles.emptyTitle}>No Courses Found</div>
            <div className={styles.emptyText}>
              {searchTerm || filterDept !== 'all' 
                ? 'Try adjusting your filters'
                : 'Add your first course to get started'}
            </div>
            {!searchTerm && filterDept === 'all' && (
              <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => setIsModalOpen(true)}>
                Add Course
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Credits</th>
                  <th>Instructor</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: `${getDeptColor(course.department)}20`,
                          color: getDeptColor(course.department),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {course.code?.substring(0, 2) || <BookOpenIcon />}
                        </div>
                        <span style={{ fontWeight: '500' }}>{course.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        background: '#f3f4f6', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontFamily: 'monospace'
                      }}>
                        {course.code || '-'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        background: `${getDeptColor(course.department)}15`,
                        color: getDeptColor(course.department),
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {course.department || 'Unassigned'}
                      </span>
                    </td>
                    <td>{course.credits || '-'}</td>
                    <td>{course.instructor || '-'}</td>
                    <td style={{ fontSize: '13px', color: '#6b7280' }}>{course.schedule || '-'}</td>
                    <td>
                      <span className={`${styles.badge} ${course.isActive ? styles.success : styles.secondary}`}>
                        {course.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions} style={{ flexDirection: 'row', gap: '4px' }}>
                        <button className={styles.iconBtn}><EditIcon size={16} /></button>
                        <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDelete(course.id)}>
                          <TrashIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Course"
        size="lg"
        footer={
          <>
            <button className={`${modalStyles.btn} ${modalStyles.secondary}`} onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button 
              className={`${modalStyles.btn} ${modalStyles.primary}`} 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name}
            >
              {isSubmitting ? 'Adding...' : 'Add Course'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className={modalStyles.formRow}>
            <div className={modalStyles.formGroup}>
              <label>Course Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Introduction to Programming"
                required
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label>Course Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., CS101"
              />
            </div>
          </div>
          <div className={modalStyles.formRow}>
            <div className={modalStyles.formGroup}>
              <label>Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
            <div className={modalStyles.formGroup}>
              <label>Credits</label>
              <input
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                placeholder="e.g., 3"
                min="1"
                max="6"
              />
            </div>
          </div>
          <div className={modalStyles.formRow}>
            <div className={modalStyles.formGroup}>
              <label>Instructor</label>
              <input
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                placeholder="e.g., Dr. John Smith"
              />
            </div>
            <div className={modalStyles.formGroup}>
              <label>Schedule</label>
              <input
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="e.g., Mon/Wed 10:00 AM"
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
