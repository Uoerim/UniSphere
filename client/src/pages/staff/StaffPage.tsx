import { useState, useEffect } from 'react';
import styles from './StaffManagement.module.css';
import api from '../../lib/api';

interface StaffMember {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  phone?: string;
  createdAt: string;
}

export default function StaffPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<StaffMember[]>('/staff');
      setStaffList(response.data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load staff');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = staffList.filter(staff =>
    staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px' }}>Staff Directory</h1>
        <p style={{ color: '#666', marginBottom: '16px' }}>Browse and manage staff members</p>
        <input
          type="text"
          placeholder="Search staff by name, email, or department..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fee', color: '#c33', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
      }}>
        {filteredStaff.map(staff => (
          <div key={staff.id} style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '16px',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>
              {staff.firstName} {staff.lastName}
            </h3>
            <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
              <strong>Email:</strong> {staff.email}
            </p>
            {staff.department && (
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
                <strong>Department:</strong> {staff.department}
              </p>
            )}
            {staff.phone && (
              <p style={{ margin: '4px 0', fontSize: '13px', color: '#666' }}>
                <strong>Phone:</strong> {staff.phone}
              </p>
            )}
            <p style={{ margin: '4px 0', fontSize: '12px', color: '#999' }}>
              Joined: {new Date(staff.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && !isLoading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
          No staff members found
        </div>
      )}
    </div>
  );
}
