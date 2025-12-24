import { useState, useEffect, useMemo } from 'react';
import styles from './Departments.module.css';

interface Department {
  id: string;
  name: string;
  description?: string;
  code?: string;
  head?: string;
  building?: string;
  floor?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  courseCount: number;
  staffCount: number;
}

interface DepartmentStats {
  totalDepartments: number;
  activeDepartments: number;
  totalCourses: number;
  totalStaff: number;
}

interface StaffMember {
  id: string;
  name: string;
  email?: string;
}

interface Building {
  id: string;
  name: string;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [buildingsList, setBuildingsList] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    head: '',
    building: '',
    floor: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchStats();
    fetchStaff();
    fetchBuildings();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch departments');

      const data = await response.json();
      setDepartments(data);
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
      const response = await fetch('http://localhost:4000/api/departments/stats/overview', {
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

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/staff', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const fetchBuildings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/facilities/buildings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setBuildingsList(data);
      }
    } catch (err) {
      console.error('Failed to fetch buildings:', err);
    }
  };

  const filteredDepartments = useMemo(() => {
    let result = [...departments];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(term) ||
        d.code?.toLowerCase().includes(term) ||
        d.head?.toLowerCase().includes(term) ||
        d.building?.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      result = result.filter(d => filterStatus === 'active' ? d.isActive : !d.isActive);
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [departments, searchTerm, filterStatus]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      head: '',
      building: '',
      floor: '',
      phone: '',
    });
    setFormError('');
  };

  const handleAddDepartment = async () => {
    if (!formData.name) {
      setFormError('Department name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create department');
      }

      await fetchDepartments();
      await fetchStats();
      setShowAddModal(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDepartment = async () => {
    if (!selectedDepartment || !formData.name) {
      setFormError('Department name is required');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/departments/${selectedDepartment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update department');
      }

      await fetchDepartments();
      await fetchStats();
      setShowEditModal(false);
      setSelectedDepartment(null);
      resetForm();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/departments/${selectedDepartment.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete department');
      }

      await fetchDepartments();
      await fetchStats();
      setShowDeleteModal(false);
      setSelectedDepartment(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (dept: Department) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/departments/${dept.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !dept.isActive }),
      });

      if (!response.ok) throw new Error('Failed to update department status');

      await fetchDepartments();
      await fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditModal = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      code: dept.code || '',
      head: dept.head || '',
      building: dept.building || '',
      floor: dept.floor || '',
      phone: dept.phone || '',

    });
    setFormError('');
    setShowEditModal(true);
  };

  const openDeleteModal = (dept: Department) => {
    setSelectedDepartment(dept);
    setShowDeleteModal(true);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading departments...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Department Management</h1>
          <p>Manage academic departments and their structure</p>
        </div>
        <button className={styles.addButton} onClick={() => { resetForm(); setShowAddModal(true); }}>
          <span>+</span> Add Department
        </button>
      </div>

      {/* Error Banner */}
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
            <div className={`${styles.statIcon} ${styles.primary}`}>🏛️</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.totalDepartments}</div>
              <div className={styles.statLabel}>Total Departments</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.success}`}>✅</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.activeDepartments}</div>
              <div className={styles.statLabel}>Active</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.info}`}>📚</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.totalCourses}</div>
              <div className={styles.statLabel}>Total Courses</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.warning}`}>👨‍🏫</div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{stats.totalStaff}</div>
              <div className={styles.statLabel}>Staff Members</div>
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
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          className={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Departments Grid */}
      <div className={styles.departmentsGrid}>
        {filteredDepartments.length === 0 ? (
          <div className={styles.emptyState}>
            <span>🏛️</span>
            <h3>No departments found</h3>
            <p>Try adjusting your filters or add a new department</p>
          </div>
        ) : (
          filteredDepartments.map(dept => (
            <div key={dept.id} className={`${styles.departmentCard} ${!dept.isActive ? styles.inactive : ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.departmentCode}>{dept.code || 'DEPT'}</div>
                <div className={`${styles.statusBadge} ${dept.isActive ? styles.active : styles.inactive}`}>
                  {dept.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.departmentName}>{dept.name}</h3>
                {dept.description && (
                  <p className={styles.departmentDescription}>{dept.description}</p>
                )}
                <div className={styles.departmentStats}>
                  <div className={styles.deptStat}>
                    <span>📚</span>
                    <span>{dept.courseCount} Courses</span>
                  </div>
                  <div className={styles.deptStat}>
                    <span>👨‍🏫</span>
                    <span>{dept.staffCount} Staff</span>
                  </div>
                </div>
                <div className={styles.departmentMeta}>
                  {dept.head && (
                    <span className={styles.metaItem}>👤 {dept.head}</span>
                  )}
                  {dept.building && (
                    <span className={styles.metaItem}>🏢 {dept.building}{dept.floor ? `, Floor ${dept.floor}` : ''}</span>
                  )}
                </div>
              </div>
              <div className={styles.cardActions}>
                <button onClick={() => openEditModal(dept)}>✏️ Edit</button>
                <button onClick={() => handleToggleStatus(dept)}>
                  {dept.isActive ? '🔒 Deactivate' : '🔓 Activate'}
                </button>
                <button className={styles.deleteBtn} onClick={() => openDeleteModal(dept)}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add New Department</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {formError && <div className={styles.formError}>⚠️ {formError}</div>}

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Department Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Computer Science"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Department Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., CS"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Department Head</label>
                  <select
                    value={formData.head}
                    onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                  >
                    <option value="">Select Department Head</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.name}>{staff.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Building</label>
                  <select
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  >
                    <option value="">Select Building</option>
                    {buildingsList.map(building => (
                      <option key={building.id} value={building.name}>{building.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Floor</label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    placeholder="e.g., 3rd Floor"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g., +1 234 567 8900"
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the department..."
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
                onClick={handleAddDepartment}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Department'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && selectedDepartment && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Edit Department</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              {formError && <div className={styles.formError}>⚠️ {formError}</div>}

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Department Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Department Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Department Head</label>
                  <select
                    value={formData.head}
                    onChange={(e) => setFormData({ ...formData, head: e.target.value })}
                  >
                    <option value="">Select Department Head</option>
                    {staffList.map(staff => (
                      <option key={staff.id} value={staff.name}>{staff.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Building</label>
                  <select
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  >
                    <option value="">Select Building</option>
                    {buildingsList.map(building => (
                      <option key={building.id} value={building.name}>{building.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Floor</label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleEditDepartment}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedDepartment && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Delete Department</h2>
              <button className={styles.closeBtn} onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.deleteWarning}>
                <span>⚠️</span>
                <h3>Are you sure you want to delete "{selectedDepartment.name}"?</h3>
                <p>This action cannot be undone. All associated data will be permanently removed.</p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button
                className={styles.dangerBtn}
                onClick={handleDeleteDepartment}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
