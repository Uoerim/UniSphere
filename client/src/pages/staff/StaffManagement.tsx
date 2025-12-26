import { useState, useEffect, useMemo } from 'react';
import styles from './StaffManagement.module.css';
import api from '../../lib/api';
import { StaffIcon, BuildingIcon, AlertTriangleIcon } from '../../components/ui/Icons';
import StaffList from './StaffList';
import StaffDetails from './StaffDetails';
import AddStaffModal from './AddStaffModal';
import { StaffMember, Department, Course, Student } from './types';
import { fetchStaffList, fetchDepartments, fetchFacilities, fetchStaffDetail, calculatePerformanceMetrics } from './hooks';

type SortField = 'email' | 'role' | 'department' | 'createdAt';
type SortDirection = 'asc' | 'desc';
type TabType = 'overview' | 'courses' | 'students' | 'schedule' | 'performance';

export default function StaffManagement() {
  // Staff list state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
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
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<StaffMember> & { phoneCountry: string }>({
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
    const loadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        setIsLoading(true);
        const [staff, departments] = await Promise.all([
          fetchStaffList(token),
          fetchDepartments(token),
        ]);
        setStaffList(staff);
        setDepartmentsList(departments);
        setError('');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Load staff details when selected
  useEffect(() => {
    if (!selectedStaff) {
      setStaffCourses([]);
      setStaffStudents([]);
      setActiveTab('overview');
      return;
    }

    const loadStaffDetail = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const { courses, students } = await fetchStaffDetail(selectedStaff.id, token);
        setStaffCourses(courses);
        setStaffStudents(students);
      } catch (err) {
        console.error('Failed to load staff details:', err);
      }
    };

    loadStaffDetail();
  }, [selectedStaff]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    return calculatePerformanceMetrics(staffCourses, staffStudents);
  }, [staffCourses, staffStudents]);

  // Filter and sort staff
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

  // Department list for filters
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

      // Create account
      const accountResponse = await fetch('http://localhost:4000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          role: 'STAFF',
        }),
      });

      if (!accountResponse.ok) {
        const error = await accountResponse.json();
        throw new Error(error.message || 'Failed to create account');
      }

      const { id: accountId } = await accountResponse.json();

      // Create staff entity attributes
      const staffResponse = await fetch('http://localhost:4000/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          attributes: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            department: formData.department || '',
            departmentId: formData.departmentId || '',
            position: formData.position || '',
            phone: formData.phone || '',
            phoneCountry: formData.phoneCountry || '+1',
            office: formData.office || '',
            hireDate: formData.hireDate || '',
          },
          accountId,
        }),
      });

      if (!staffResponse.ok) {
        throw new Error('Failed to create staff member');
      }

      // Reload staff list
      const reloadedStaff = await fetchStaffList(token);
      setStaffList(reloadedStaff);

      // Reset form
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
      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (staff: StaffMember) => {
    if (!confirm(`Are you sure you want to delete ${staff.email}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/users/${staff.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete staff');

      setStaffList(staffList.filter(s => s.id !== staff.id));
      if (selectedStaff?.id === staff.id) {
        setSelectedStaff(null);
      }
    } catch (err) {
      console.error('Failed to delete staff:', err);
    }
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          <AlertTriangleIcon size={20} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Staff Management</h1>
          <p>Manage staff members, their courses, and students</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>+ Add Staff Member</button>
      </div>

      {/* Stats */}
      {!isLoading && (
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon}`}><StaffIcon size={24} /></div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{staffList.length}</div>
              <div className={styles.statLabel}>Total Staff</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.success}`}><BuildingIcon size={24} /></div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{staffList.filter(s => s.isActive).length}</div>
              <div className={styles.statLabel}>Active</div>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.info}`}><BuildingIcon size={24} /></div>
            <div className={styles.statInfo}>
              <div className={styles.statValue}>{departmentsList.length}</div>
              <div className={styles.statLabel}>Departments</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={styles.content}>
        <StaffList
          staff={filteredStaff}
          isLoading={isLoading}
          searchTerm={searchTerm}
          filterDepartment={filterDepartment}
          sortField={sortField}
          sortDirection={sortDirection}
          departments={departments}
          onSearchChange={setSearchTerm}
          onFilterChange={setFilterDepartment}
          onSort={(field) => {
            if (sortField === field) {
              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
              setSortField(field);
              setSortDirection('asc');
            }
          }}
          onSelectStaff={setSelectedStaff}
          onEdit={(staff) => {
            setSelectedStaff(staff);
            // Could open edit modal here
          }}
          onDelete={handleDelete}
        />

        {selectedStaff ? (
          <StaffDetails
            staff={selectedStaff}
            courses={staffCourses}
            students={staffStudents}
            performanceMetrics={performanceMetrics}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        ) : (
          <div className={styles.noSelection}>
            <div className={styles.noSelectionIcon}><StaffIcon /></div>
            <h3>Select a Staff Member</h3>
            <p>Choose a staff member from the list to view their details, courses, and students.</p>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={showAddModal}
        formData={formData}
        formError={formError}
        isSubmitting={isSubmitting}
        departments={departmentsList}
        onFormChange={(field, value) => {
          setFormData({ ...formData, [field]: value });
          setFormError('');
        }}
        onSubmit={handleAddStaff}
        onClose={() => {
          setShowAddModal(false);
          setFormError('');
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
        }}
      />
    </div>
  );
}
