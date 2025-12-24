import { useState, useEffect, useMemo } from "react";
import styles from "./ParentManagement.module.css";
import api from "../../lib/api";

interface Child {
  id: string;
  name: string;
  studentId: string;
  grade?: string;
}

interface Parent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phoneCountry?: string;
  address?: string;
  occupation?: string;
  relationship?: string;
  emergencyContact?: boolean;
  status: "ACTIVE" | "INACTIVE";
  children: Child[];
  createdAt: string;
}

interface Student {
  id: string;
  name: string;
  studentId: string;
  grade?: string;
}

interface Stats {
  totalParents: number;
  activeParents: number;
  totalChildren: number;
  averageChildren: number;
}

const COUNTRY_CODES = [
  { code: "+1", country: "US" },
  { code: "+44", country: "UK" },
  { code: "+20", country: "EG" },
  { code: "+966", country: "SA" },
  { code: "+971", country: "AE" },
  { code: "+974", country: "QA" },
  { code: "+965", country: "KW" },
  { code: "+973", country: "BH" },
  { code: "+968", country: "OM" },
  { code: "+962", country: "JO" },
  { code: "+961", country: "LB" },
  { code: "+91", country: "IN" },
  { code: "+86", country: "CN" },
  { code: "+81", country: "JP" },
  { code: "+82", country: "KR" },
  { code: "+49", country: "DE" },
  { code: "+33", country: "FR" },
  { code: "+39", country: "IT" },
  { code: "+34", country: "ES" },
  { code: "+31", country: "NL" },
];

const RELATIONSHIPS = ["Father", "Mother", "Guardian", "Grandfather", "Grandmother", "Uncle", "Aunt", "Other"];

export default function ParentManagement() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalParents: 0,
    activeParents: 0,
    totalChildren: 0,
    averageChildren: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRelationship, setFilterRelationship] = useState<string>("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChildrenModal, setShowChildrenModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    phoneCountry: "+1",
    address: "",
    occupation: "",
    relationship: "Father",
    emergencyContact: false,
    selectedChildren: [] as string[],
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchParents();
    fetchStats();
    fetchAvailableStudents();
  }, []);

  const fetchParents = async () => {
    try {
      const res = await api.get<Parent[]>("/parents");
      setParents(res.data);
    } catch (err) {
      console.error("Failed to fetch parents:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get<Stats>("/parents/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const res = await api.get<Student[]>("/parents/available-students");
      setAvailableStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch available students:", err);
    }
  };

  const filteredParents = useMemo(() => {
    return parents.filter((parent) => {
      const matchesSearch =
        searchQuery === "" ||
        parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parent.children.some(
          (child) =>
            child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            child.studentId.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesStatus = filterStatus === "all" || parent.status === filterStatus;
      const matchesRelationship = filterRelationship === "all" || parent.relationship === filterRelationship;

      return matchesSearch && matchesStatus && matchesRelationship;
    });
  }, [parents, searchQuery, filterStatus, filterRelationship]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      phoneCountry: "+1",
      address: "",
      occupation: "",
      relationship: "Father",
      emergencyContact: false,
      selectedChildren: [],
    });
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (parent: Parent) => {
    setSelectedParent(parent);
    setFormData({
      name: parent.name,
      email: parent.email,
      password: "",
      phone: parent.phone || "",
      phoneCountry: parent.phoneCountry || "+1",
      address: parent.address || "",
      occupation: parent.occupation || "",
      relationship: parent.relationship || "Father",
      emergencyContact: parent.emergencyContact || false,
      selectedChildren: parent.children.map((c) => c.id),
    });
    setShowEditModal(true);
  };

  const handleDelete = (parent: Parent) => {
    setSelectedParent(parent);
    setShowDeleteModal(true);
  };

  const handleManageChildren = (parent: Parent) => {
    setSelectedParent(parent);
    setFormData({
      ...formData,
      selectedChildren: parent.children.map((c) => c.id),
    });
    setShowChildrenModal(true);
  };

  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        phoneCountry: formData.phoneCountry,
        address: formData.address,
        occupation: formData.occupation,
        relationship: formData.relationship,
        emergencyContact: formData.emergencyContact,
        childrenIds: formData.selectedChildren,
      };
      await api.post("/parents", payload);
      setShowAddModal(false);
      fetchParents();
      fetchStats();
      fetchAvailableStudents();
    } catch (err) {
      console.error("Failed to create parent:", err);
      alert("Failed to create parent");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent) return;
    setFormLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        phoneCountry: formData.phoneCountry,
        address: formData.address,
        occupation: formData.occupation,
        relationship: formData.relationship,
        emergencyContact: formData.emergencyContact,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      await api.put(`/parents/${selectedParent.id}`, payload);
      setShowEditModal(false);
      fetchParents();
      fetchStats();
    } catch (err) {
      console.error("Failed to update parent:", err);
      alert("Failed to update parent");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedParent) return;
    setFormLoading(true);
    try {
      await api.delete(`/parents/${selectedParent.id}`);
      setShowDeleteModal(false);
      fetchParents();
      fetchStats();
      fetchAvailableStudents();
    } catch (err) {
      console.error("Failed to delete parent:", err);
      alert("Failed to delete parent");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (parent: Parent) => {
    try {
      const newStatus = parent.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await api.put(`/parents/${parent.id}`, { status: newStatus });
      fetchParents();
      fetchStats();
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleResetPassword = async (parent: Parent) => {
    if (!confirm(`Reset password for ${parent.name}?`)) return;
    try {
      const res = await api.post<{ temporaryPassword: string }>(`/parents/${parent.id}/reset-password`);
      alert(`Password reset to: ${res.data.temporaryPassword}`);
    } catch (err) {
      console.error("Failed to reset password:", err);
      alert("Failed to reset password");
    }
  };

  const handleRemoveChild = async (parent: Parent, studentId: string) => {
    if (!confirm("Remove this child connection?")) return;
    try {
      await api.delete(`/parents/${parent.id}/children/${studentId}`);
      fetchParents();
      fetchAvailableStudents();
    } catch (err) {
      console.error("Failed to remove child:", err);
    }
  };

  const handleSaveChildren = async () => {
    if (!selectedParent) return;
    setFormLoading(true);
    try {
      // Get current children
      const currentChildIds = selectedParent.children.map((c) => c.id);
      
      // Find children to add and remove
      const toAdd = formData.selectedChildren.filter((id) => !currentChildIds.includes(id));
      const toRemove = currentChildIds.filter((id) => !formData.selectedChildren.includes(id));

      // Add new children
      for (const studentId of toAdd) {
        await api.post(`/parents/${selectedParent.id}/children`, { studentId });
      }

      // Remove children
      for (const studentId of toRemove) {
        await api.delete(`/parents/${selectedParent.id}/children/${studentId}`);
      }

      setShowChildrenModal(false);
      fetchParents();
      fetchStats();
      fetchAvailableStudents();
    } catch (err) {
      console.error("Failed to update children:", err);
      alert("Failed to update children");
    } finally {
      setFormLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterRelationship("all");
  };

  // Get all students (available + already assigned to selected parent)
  const getAllStudentsForModal = () => {
    if (!selectedParent) return availableStudents;
    const assignedStudents = selectedParent.children.map((c) => ({
      id: c.id,
      name: c.name,
      studentId: c.studentId,
      grade: c.grade,
    }));
    return [...assignedStudents, ...availableStudents];
  };

  if (loading) {
    return <div className={styles.loading}>Loading parents...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>👨‍👩‍👧‍👦 Parent Management</h1>
          <p>Manage parent accounts and their connections to students</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.addBtn} onClick={handleAdd}>
            <span>+</span> Add Parent
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.primary}`}>
          <h3>Total Parents</h3>
          <div className={styles.value}>{stats.totalParents}</div>
        </div>
        <div className={`${styles.statCard} ${styles.success}`}>
          <h3>Active Parents</h3>
          <div className={styles.value}>{stats.activeParents}</div>
        </div>
        <div className={`${styles.statCard} ${styles.info}`}>
          <h3>Total Children</h3>
          <div className={styles.value}>{stats.totalChildren}</div>
        </div>
        <div className={`${styles.statCard} ${styles.warning}`}>
          <h3>Avg. Children/Parent</h3>
          <div className={styles.value}>{stats.averageChildren.toFixed(1)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or child..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label>Relationship</label>
            <select value={filterRelationship} onChange={(e) => setFilterRelationship(e.target.value)}>
              <option value="all">All Relationships</option>
              {RELATIONSHIPS.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>
          <button className={styles.clearFilters} onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Parents Grid */}
      {filteredParents.length === 0 ? (
        <div className={styles.emptyState}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3>No Parents Found</h3>
          <p>
            {searchQuery || filterStatus !== "all" || filterRelationship !== "all"
              ? "Try adjusting your filters"
              : "Click 'Add Parent' to create your first parent account"}
          </p>
        </div>
      ) : (
        <div className={styles.parentsGrid}>
          {filteredParents.map((parent) => (
            <div
              key={parent.id}
              className={`${styles.parentCard} ${parent.status === "INACTIVE" ? styles.inactive : ""}`}
            >
              <div className={styles.cardHeader}>
                <h3>{parent.name}</h3>
                <p className={styles.parentEmail}>{parent.email}</p>
                <span
                  className={`${styles.statusBadge} ${
                    parent.status === "ACTIVE" ? styles.active : styles.inactive
                  }`}
                >
                  {parent.status}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <strong>Relationship:</strong>
                  <span className={styles.value}>{parent.relationship || "Not specified"}</span>
                </div>
                {parent.phone && (
                  <div className={styles.infoRow}>
                    <strong>Phone:</strong>
                    <span className={styles.value}>
                      {parent.phoneCountry} {parent.phone}
                    </span>
                  </div>
                )}
                {parent.occupation && (
                  <div className={styles.infoRow}>
                    <strong>Occupation:</strong>
                    <span className={styles.value}>{parent.occupation}</span>
                  </div>
                )}
                {parent.emergencyContact && (
                  <div className={styles.infoRow}>
                    <span className={styles.value}>🚨 Emergency Contact</span>
                  </div>
                )}

                {/* Children Section */}
                <div className={styles.childrenSection}>
                  <div className={styles.childrenHeader}>
                    <h4>Children ({parent.children.length})</h4>
                    <button
                      className={styles.addChildBtn}
                      onClick={() => handleManageChildren(parent)}
                    >
                      + Manage
                    </button>
                  </div>
                  {parent.children.length === 0 ? (
                    <div className={styles.noChildren}>No children connected</div>
                  ) : (
                    <div className={styles.childrenList}>
                      {parent.children.map((child) => (
                        <div key={child.id} className={styles.childTag}>
                          <div className={styles.childInfo}>
                            <span>{child.name}</span>
                            <span className={styles.studentId}>({child.studentId})</span>
                          </div>
                          <button
                            className={styles.removeChildBtn}
                            onClick={() => handleRemoveChild(parent, child.id)}
                            title="Remove child"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.editBtn} onClick={() => handleEdit(parent)}>
                  ✏️ Edit
                </button>
                <button className={styles.toggleBtn} onClick={() => handleToggleStatus(parent)}>
                  {parent.status === "ACTIVE" ? "🚫" : "✅"}
                </button>
                <button className={styles.resetBtn} onClick={() => handleResetPassword(parent)}>
                  🔑
                </button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(parent)}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.wide}`}>
            <div className={styles.modalHeader}>
              <h2>Add New Parent</h2>
              <button className={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitAdd}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      placeholder="Enter password"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Relationship *</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      required
                    >
                      {RELATIONSHIPS.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <div className={styles.phoneInput}>
                    <select
                      value={formData.phoneCountry}
                      onChange={(e) => setFormData({ ...formData, phoneCountry: e.target.value })}
                    >
                      {COUNTRY_CODES.map((cc) => (
                        <option key={cc.code} value={cc.code}>
                          {cc.code} ({cc.country})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Occupation</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="Enter occupation"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.emergencyContact}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyContact: e.target.checked })
                      }
                      style={{ marginRight: "0.5rem" }}
                    />
                    Mark as Emergency Contact
                  </label>
                </div>

                {/* Children Selection */}
                <div className={styles.childrenSelection}>
                  <h4>Connect to Students</h4>
                  {availableStudents.length === 0 ? (
                    <div className={styles.noStudents}>No available students to connect</div>
                  ) : (
                    <div className={styles.availableStudentsList}>
                      {availableStudents.map((student) => (
                        <label key={student.id} className={styles.studentOption}>
                          <input
                            type="checkbox"
                            checked={formData.selectedChildren.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  selectedChildren: [...formData.selectedChildren, student.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  selectedChildren: formData.selectedChildren.filter(
                                    (id) => id !== student.id
                                  ),
                                });
                              }
                            }}
                          />
                          <div className={styles.studentDetails}>
                            <div className={styles.studentName}>{student.name}</div>
                            <div className={styles.studentMeta}>
                              ID: {student.studentId} {student.grade && `• Grade: ${student.grade}`}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                  {formLoading ? "Creating..." : "Create Parent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedParent && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.wide}`}>
            <div className={styles.modalHeader}>
              <h2>Edit Parent</h2>
              <button className={styles.closeBtn} onClick={() => setShowEditModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitEdit}>
              <div className={styles.modalBody}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>New Password (leave blank to keep current)</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Relationship *</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      required
                    >
                      {RELATIONSHIPS.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <div className={styles.phoneInput}>
                    <select
                      value={formData.phoneCountry}
                      onChange={(e) => setFormData({ ...formData, phoneCountry: e.target.value })}
                    >
                      {COUNTRY_CODES.map((cc) => (
                        <option key={cc.code} value={cc.code}>
                          {cc.code} ({cc.country})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Occupation</label>
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="Enter occupation"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.emergencyContact}
                      onChange={(e) =>
                        setFormData({ ...formData, emergencyContact: e.target.checked })
                      }
                      style={{ marginRight: "0.5rem" }}
                    />
                    Mark as Emergency Contact
                  </label>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                  {formLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedParent && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Delete Parent</h2>
              <button className={styles.closeBtn} onClick={() => setShowDeleteModal(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to delete <strong>{selectedParent.name}</strong>?
              </p>
              {selectedParent.children.length > 0 && (
                <p style={{ color: "var(--warning)", marginTop: "0.5rem" }}>
                  ⚠️ This parent is connected to {selectedParent.children.length} student(s). The
                  connections will be removed.
                </p>
              )}
              <p style={{ color: "var(--danger)", marginTop: "0.5rem" }}>
                This action cannot be undone.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${styles.submitBtn} ${styles.dangerBtn}`}
                onClick={handleSubmitDelete}
                disabled={formLoading}
              >
                {formLoading ? "Deleting..." : "Delete Parent"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Children Modal */}
      {showChildrenModal && selectedParent && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Manage Children for {selectedParent.name}</h2>
              <button className={styles.closeBtn} onClick={() => setShowChildrenModal(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.childrenSelection}>
                <h4>Select Students</h4>
                {getAllStudentsForModal().length === 0 ? (
                  <div className={styles.noStudents}>No students available</div>
                ) : (
                  <div className={styles.availableStudentsList}>
                    {getAllStudentsForModal().map((student) => (
                      <label key={student.id} className={styles.studentOption}>
                        <input
                          type="checkbox"
                          checked={formData.selectedChildren.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                selectedChildren: [...formData.selectedChildren, student.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selectedChildren: formData.selectedChildren.filter(
                                  (id) => id !== student.id
                                ),
                              });
                            }
                          }}
                        />
                        <div className={styles.studentDetails}>
                          <div className={styles.studentName}>{student.name}</div>
                          <div className={styles.studentMeta}>
                            ID: {student.studentId} {student.grade && `• Grade: ${student.grade}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowChildrenModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleSaveChildren}
                disabled={formLoading}
              >
                {formLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
