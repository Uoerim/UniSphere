import { useState, useEffect } from 'react';
import api from '../../lib/api';
import styles from './Facilities.module.css';
import {
  BuildingIcon,
  BeakerIcon,
  BriefcaseIcon,
  TheaterIcon,
  MonitorIcon,
  ClipboardIcon,
  VideoIcon,
  SchoolIcon,
  CheckCircleIcon,
  UsersIcon,
  EditIcon,
  TrashIcon,
  PlusIcon
} from '../../components/ui/Icons';

interface Facility {
  id: number;
  name: string;
  roomNumber: string;
  type: string;
  floor: number;
  capacity: number;
  status: string;
  features: string[];
  notes?: string;
}

interface FormData {
  name: string;
  roomNumber: string;
  type: string;
  floor: string;
  capacity: string;
  status: string;
  features: string[];
  notes: string;
}

const FACILITY_TYPES: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: 'CLASSROOM', label: 'Classroom', icon: <BuildingIcon size={18} /> },
  { value: 'LABORATORY', label: 'Laboratory', icon: <BeakerIcon size={18} /> },
  { value: 'OFFICE', label: 'Office', icon: <BriefcaseIcon size={18} /> },
  { value: 'LECTURE_HALL', label: 'Lecture Hall', icon: <TheaterIcon size={18} /> },
  { value: 'COMPUTER_LAB', label: 'Computer Lab', icon: <MonitorIcon size={18} /> },
  { value: 'CONFERENCE_ROOM', label: 'Conference Room', icon: <ClipboardIcon size={18} /> },
  { value: 'AUDITORIUM', label: 'Auditorium', icon: <VideoIcon size={18} /> },
];

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'RESERVED', label: 'Reserved' },
];



export default function Facilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [featureInput, setFeatureInput] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const initialFormData: FormData = {
    name: '',
    roomNumber: '',
    type: 'CLASSROOM',
    floor: '1',
    capacity: '',
    status: 'AVAILABLE',
    features: [],
    notes: '',
  };

  const [formData, setFormData] = useState<FormData>(initialFormData);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await api.get<Facility[]>('/facilities');
      setFacilities(response.data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddFeature = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && featureInput.trim()) {
      e.preventDefault();
      if (!formData.features.includes(featureInput.trim())) {
        setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
      }
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== feature) }));
  };

  const openAddModal = () => {
    setEditingFacility(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const openEditModal = (facility: Facility) => {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
      roomNumber: facility.roomNumber,
      type: facility.type,
      floor: facility.floor.toString(),
      capacity: facility.capacity.toString(),
      status: facility.status,
      features: facility.features || [],
      notes: facility.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        floor: parseInt(formData.floor),
        capacity: parseInt(formData.capacity),
      };

      if (editingFacility) {
        await api.put(`/facilities/${editingFacility.id}`, payload);
      } else {
        await api.post('/facilities', payload);
      }
      setShowModal(false);
      fetchFacilities();
    } catch (error) {
      console.error('Error saving facility:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this facility?')) return;
    try {
      await api.delete(`/facilities/${id}`);
      fetchFacilities();
    } catch (error) {
      console.error('Error deleting facility:', error);
    }
  };

  const getTypeInfo = (type: string) => {
    return FACILITY_TYPES.find(t => t.value === type) || FACILITY_TYPES[0];
  };

  // Filter facilities
  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = !searchTerm || 
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || facility.type === filterType;
    const matchesStatus = !filterStatus || facility.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Stats
  const stats = {
    total: facilities.length,
    available: facilities.filter(f => f.status === 'AVAILABLE').length,
    occupied: facilities.filter(f => f.status === 'OCCUPIED').length,
    maintenance: facilities.filter(f => f.status === 'MAINTENANCE').length,
    classrooms: facilities.filter(f => f.type === 'CLASSROOM').length,
    labs: facilities.filter(f => f.type === 'LABORATORY' || f.type === 'COMPUTER_LAB').length,
    offices: facilities.filter(f => f.type === 'OFFICE').length,
    halls: facilities.filter(f => f.type === 'LECTURE_HALL' || f.type === 'AUDITORIUM').length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Facilities Management</h1>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={openAddModal}>
            <PlusIcon size={16} /> Add Facility
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.total}`}><SchoolIcon size={24} /></div>
          <div className={styles.statInfo}>
            <h3>{stats.total}</h3>
            <p>Total Facilities</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.available}`}><CheckCircleIcon size={24} /></div>
          <div className={styles.statInfo}>
            <h3>{stats.available}</h3>
            <p>Available</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.classrooms}`}><BuildingIcon size={24} /></div>
          <div className={styles.statInfo}>
            <h3>{stats.classrooms}</h3>
            <p>Classrooms</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.labs}`}><BeakerIcon size={24} /></div>
          <div className={styles.statInfo}>
            <h3>{stats.labs}</h3>
            <p>Laboratories</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.offices}`}><BriefcaseIcon size={24} /></div>
          <div className={styles.statInfo}>
            <h3>{stats.offices}</h3>
            <p>Offices</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.halls}`}><TheaterIcon size={24} /></div>
          <div className={styles.statInfo}>
            <h3>{stats.halls}</h3>
            <p>Halls</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersRow}>
          <div className={`${styles.filterGroup} ${styles.searchGroup}`}>
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by name or room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Type</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              {FACILITY_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className={styles.emptyState}>
          <SchoolIcon size={48} />
          <h3>No facilities found</h3>
          <p>Add a new facility or adjust your filters</p>
        </div>
      ) : (
        <div className={styles.facilitiesGrid}>
          {filteredFacilities.map(facility => {
            const typeInfo = getTypeInfo(facility.type);
            return (
              <div key={facility.id} className={styles.facilityCard}>
                <div className={styles.facilityHeader}>
                  <div className={styles.facilityTitleSection}>
                    <div className={`${styles.facilityIcon} ${styles[facility.type]}`}>
                      {typeInfo.icon}
                    </div>
                    <div className={styles.facilityTitle}>
                      <h3>{facility.name}</h3>
                      <p>{facility.roomNumber} • {typeInfo.label}</p>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${styles[facility.status.toLowerCase()]}`}>
                    {facility.status}
                  </span>
                </div>

                <div className={styles.facilityDetails}>
                  <div className={styles.detailItem}>
                    <span>#</span>
                    <span>Floor {facility.floor}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <UsersIcon size={16} />
                    <span>Capacity: {facility.capacity}</span>
                  </div>
                </div>

                {facility.features && facility.features.length > 0 && (
                  <div className={styles.facilityFeatures}>
                    {facility.features.map((feature, idx) => (
                      <span key={idx} className={styles.featureTag}>{feature}</span>
                    ))}
                  </div>
                )}

                <div className={styles.facilityActions}>
                  <button className={styles.editBtn} onClick={() => openEditModal(facility)}>
                    <EditIcon size={14} /> Edit
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(facility.id)}>
                    <TrashIcon size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingFacility ? 'Edit Facility' : 'Add New Facility'}</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Facility Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Physics Lab 101"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Room Number *</label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., A-101"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Facility Type *</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} required>
                      {FACILITY_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Floor</label>
                    <input
                      type="number"
                      name="floor"
                      value={formData.floor}
                      onChange={handleInputChange}
                      min="0"
                      max="20"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Capacity *</label>
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      placeholder="e.g., 30"
                      min="1"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange}>
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Features (Press Enter to add)</label>
                    <div className={styles.featuresInput}>
                      {formData.features.map((feature, idx) => (
                        <span key={idx} className={styles.featureTagInput}>
                          {feature}
                          <button type="button" onClick={() => handleRemoveFeature(feature)}>×</button>
                        </span>
                      ))}
                      <input
                        type="text"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={handleAddFeature}
                        placeholder="e.g., Projector, Whiteboard, AC..."
                      />
                    </div>
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label>Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Any additional notes about this facility..."
                    />
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingFacility ? 'Update Facility' : 'Add Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
