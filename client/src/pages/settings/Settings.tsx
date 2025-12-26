import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, type Theme, type AccentColor } from '../../context/ThemeContext';
import {
  SettingsIcon,
  BellIcon,
  LockIcon,
  PaletteIcon,
  CheckIcon,
  XIcon,
  MonitorIcon,
  SunIcon,
  MoonIcon,
  ShieldIcon,
  GlobeIcon,
  ClockIcon
} from '../../components/ui/Icons';
import styles from './Settings.module.css';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const { theme, accentColor, compactMode, setTheme, setAccentColor, setCompactMode } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    universityName: 'UniSphere University',
    email: user?.email || 'admin@unisphere.edu',
    phone: '+1 (555) 123-4567',
    address: '123 University Ave, Education City',
    timezone: 'America/New_York',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    academicYear: '2024-2025'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    systemAlerts: true,
    weeklyDigest: false,
    announcementAlerts: true
  });

  // Security - Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');

  // Load sessions on security tab
  useEffect(() => {
    if (activeTab === 'security') {
      loadSessions();
    }
  }, [activeTab]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      // Get current session info from browser
      const userAgent = navigator.userAgent;
      const browser = getBrowserName(userAgent);
      const device = getDeviceName(userAgent);
      
      // Create current session
      const currentSession: Session = {
        id: 'current',
        device,
        browser,
        location: 'Current Location',
        ip: 'Your IP',
        lastActive: 'Now',
        isCurrent: true
      };

      // Simulated other sessions (in a real app, these would come from the backend)
      const mockSessions: Session[] = [
        currentSession,
        // You could add more sessions here from an API call
      ];

      setSessions(mockSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const getBrowserName = (ua: string): string => {
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown Browser';
  };

  const getDeviceName = (ua: string): string => {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown Device';
  };

  const handleTerminateSession = async (sessionId: string) => {
    if (sessionId === 'current') {
      // This would log out the user
      if (!confirm('This will log you out. Are you sure?')) return;
    }
    
    setSessions(sessions.filter(s => s.id !== sessionId));
    showNotification('success', 'Session terminated successfully');
  };

  const handleTerminateAllOtherSessions = async () => {
    if (!confirm('This will terminate all other sessions. Are you sure?')) return;
    setSessions(sessions.filter(s => s.isCurrent));
    showNotification('success', 'All other sessions terminated');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showNotification('success', 'Password changed successfully');
      } else {
        const data = await response.json();
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('Failed to change password. Please try again.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // In a real app, save to backend
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Save settings to localStorage for persistence
      localStorage.setItem('generalSettings', JSON.stringify(generalSettings));
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      
      showNotification('success', 'Settings saved successfully!');
    } catch (error) {
      showNotification('error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 4000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon size={18} /> },
    { id: 'security', label: 'Security', icon: <LockIcon size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <PaletteIcon size={18} /> }
  ];

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <SunIcon size={20} /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon size={20} /> },
    { value: 'system', label: 'System', icon: <MonitorIcon size={20} /> }
  ];

  const accentColors: { value: AccentColor; label: string }[] = [
    { value: '#2fda90', label: 'Green' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#f59e0b', label: 'Orange' },
    { value: '#ef4444', label: 'Red' }
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1><SettingsIcon size={28} /> Settings</h1>
          <p>Manage your system preferences and account settings</p>
        </div>
      </div>

      <div className={styles.settingsLayout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <nav className={styles.nav}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>General Settings</h2>
                <p>Configure basic system information</p>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>University Name</label>
                  <input
                    type="text"
                    value={generalSettings.universityName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, universityName: e.target.value })}
                    placeholder="Enter university name"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={generalSettings.email}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                      placeholder="admin@university.edu"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={generalSettings.phone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Address</label>
                  <textarea
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    placeholder="Enter university address"
                    rows={3}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label><GlobeIcon size={16} /> Timezone</label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="UTC">UTC</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Dubai">Dubai (GST)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Language</label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ar">Arabic</option>
                      <option value="zh">Chinese</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label><ClockIcon size={16} /> Date Format</label>
                    <select
                      value={generalSettings.dateFormat}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Academic Year</label>
                    <select
                      value={generalSettings.academicYear}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, academicYear: e.target.value })}
                    >
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2023-2024">2023-2024</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Notification Preferences</h2>
                <p>Choose how you want to be notified</p>
              </div>

              <div className={styles.settingsList}>
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive important updates via email', icon: <BellIcon size={20} /> },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications for real-time alerts', icon: <BellIcon size={20} /> },
                  { key: 'eventReminders', label: 'Event Reminders', desc: 'Get reminded about upcoming events and deadlines', icon: <ClockIcon size={20} /> },
                  { key: 'systemAlerts', label: 'System Alerts', desc: 'Critical system notifications and maintenance updates', icon: <ShieldIcon size={20} /> },
                  { key: 'announcementAlerts', label: 'Announcements', desc: 'Notifications for new announcements', icon: <BellIcon size={20} /> },
                  { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Receive a weekly summary of activities', icon: <BellIcon size={20} /> }
                ].map(item => (
                  <div key={item.key} className={styles.settingItem}>
                    <div className={styles.settingIcon}>{item.icon}</div>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingLabel}>{item.label}</span>
                      <span className={styles.settingDesc}>{item.desc}</span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                        onChange={(e) => setNotificationSettings({ 
                          ...notificationSettings, 
                          [item.key]: e.target.checked 
                        })}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Security Settings</h2>
                <p>Manage your account security and sessions</p>
              </div>

              {/* Password Section */}
              <div className={styles.securityCard}>
                <div className={styles.securityCardHeader}>
                  <div className={styles.securityIcon}><LockIcon size={24} /></div>
                  <div>
                    <h3>Password</h3>
                    <p>Change your account password</p>
                  </div>
                </div>
                <button 
                  className={styles.secondaryBtn}
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </button>
              </div>

              {/* Active Sessions */}
              <div className={styles.securityCard}>
                <div className={styles.securityCardHeader}>
                  <div className={styles.securityIcon}><MonitorIcon size={24} /></div>
                  <div>
                    <h3>Active Sessions</h3>
                    <p>Manage devices where you're logged in</p>
                  </div>
                  {sessions.length > 1 && (
                    <button 
                      className={styles.dangerBtn}
                      onClick={handleTerminateAllOtherSessions}
                    >
                      Terminate All Others
                    </button>
                  )}
                </div>

                <div className={styles.sessionsList}>
                  {isLoadingSessions ? (
                    <div className={styles.loadingState}>
                      <div className={styles.spinner}></div>
                      <p>Loading sessions...</p>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className={styles.emptyState}>
                      <p>No active sessions found</p>
                    </div>
                  ) : (
                    sessions.map(session => (
                      <div key={session.id} className={styles.sessionItem}>
                        <div className={styles.sessionIcon}>
                          <MonitorIcon size={24} />
                        </div>
                        <div className={styles.sessionInfo}>
                          <div className={styles.sessionDevice}>
                            {session.device} • {session.browser}
                            {session.isCurrent && (
                              <span className={styles.currentBadge}>Current</span>
                            )}
                          </div>
                          <div className={styles.sessionMeta}>
                            <span>{session.location}</span>
                            <span>•</span>
                            <span>Last active: {session.lastActive}</span>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <button 
                            className={styles.terminateBtn}
                            onClick={() => handleTerminateSession(session.id)}
                          >
                            Terminate
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Account Info */}
              <div className={styles.securityCard}>
                <div className={styles.securityCardHeader}>
                  <div className={styles.securityIcon}><ShieldIcon size={24} /></div>
                  <div>
                    <h3>Account Information</h3>
                    <p>Your account details and security status</p>
                  </div>
                </div>
                <div className={styles.accountInfo}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{user?.email || generalSettings.email}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Role</span>
                    <span className={styles.infoValue}>{user?.role || 'Admin'}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Account Created</span>
                    <span className={styles.infoValue}>
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance */}
          {activeTab === 'appearance' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Appearance</h2>
                <p>Customize the look and feel of the application</p>
              </div>

              {/* Theme Selection */}
              <div className={styles.appearanceCard}>
                <h3>Theme</h3>
                <p>Choose your preferred color scheme</p>
                <div className={styles.themeOptions}>
                  {themeOptions.map(option => (
                    <button
                      key={option.value}
                      className={`${styles.themeOption} ${theme === option.value ? styles.selected : ''}`}
                      onClick={() => setTheme(option.value)}
                    >
                      <div className={styles.themeIcon}>{option.icon}</div>
                      <span>{option.label}</span>
                      {theme === option.value && (
                        <CheckIcon size={16} className={styles.checkIcon} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className={styles.appearanceCard}>
                <h3>Accent Color</h3>
                <p>Choose your primary accent color</p>
                <div className={styles.colorOptions}>
                  {accentColors.map(color => (
                    <button
                      key={color.value}
                      className={`${styles.colorOption} ${accentColor === color.value ? styles.selected : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setAccentColor(color.value)}
                      title={color.label}
                    >
                      {accentColor === color.value && <CheckIcon size={16} color="white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Mode */}
              <div className={styles.appearanceCard}>
                <div className={styles.appearanceRow}>
                  <div>
                    <h3>Compact Mode</h3>
                    <p>Reduce spacing for a more compact interface</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className={styles.footer}>
            {saveMessage && (
              <div className={`${styles.notification} ${styles[saveMessage.type]}`}>
                {saveMessage.type === 'success' ? <CheckIcon size={16} /> : <XIcon size={16} />}
                {saveMessage.text}
              </div>
            )}
            <button 
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className={styles.modal} onClick={() => setShowPasswordModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Change Password</h2>
              <button className={styles.closeBtn} onClick={() => setShowPasswordModal(false)}>
                <XIcon size={20} />
              </button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className={styles.modalBody}>
                {passwordError && (
                  <div className={styles.errorAlert}>{passwordError}</div>
                )}
                <div className={styles.formGroup}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={8}
                  />
                  <span className={styles.hint}>Must be at least 8 characters</span>
                </div>
                <div className={styles.formGroup}>
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
