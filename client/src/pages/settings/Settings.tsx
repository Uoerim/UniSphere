import { useState } from 'react';
import styles from '../../styles/pages.module.css';
import {
  SettingsIcon,
  BellIcon,
  LockIcon,
  PaletteIcon,
  LinkIcon,
  CalendarIcon,
  BriefcaseIcon,
  MessageIcon,
  VideoIcon,
  CheckIcon
} from '../../components/ui/Icons';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [generalSettings, setGeneralSettings] = useState({
    universityName: 'UniSphere University',
    email: 'admin@unisphere.edu',
    phone: '+1 (555) 123-4567',
    address: '123 University Ave, Education City',
    timezone: 'America/New_York',
    language: 'en'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    eventReminders: true,
    systemAlerts: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const tabs: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon size={18} /> },
    { id: 'security', label: 'Security', icon: <LockIcon size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <PaletteIcon size={18} /> },
    { id: 'integrations', label: 'Integrations', icon: <LinkIcon size={18} /> }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>Manage your university system preferences</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Sidebar */}
        <div className={styles.card} style={{ width: '240px', padding: '16px', height: 'fit-content' }}>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  border: 'none',
                  background: activeTab === tab.id ? '#eef1fe' : 'transparent',
                  color: activeTab === tab.id ? '#4f6ef7' : '#6b7280',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className={styles.card} style={{ flex: 1, padding: '24px' }}>
          {activeTab === 'general' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                General Settings
              </h2>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    University Name
                  </label>
                  <input
                    type="text"
                    value={generalSettings.universityName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, universityName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={generalSettings.email}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={generalSettings.phone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                    Address
                  </label>
                  <textarea
                    value={generalSettings.address}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Timezone
                    </label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                      Language
                    </label>
                    <select
                      value={generalSettings.language}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                Notification Preferences
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                  { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Text message alerts' },
                  { key: 'eventReminders', label: 'Event Reminders', desc: 'Get reminded about upcoming events' },
                  { key: 'systemAlerts', label: 'System Alerts', desc: 'Important system notifications' }
                ].map(item => (
                  <div 
                    key={item.key}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{item.desc}</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                      <input
                        type="checkbox"
                        checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                        onChange={(e) => setNotificationSettings({ 
                          ...notificationSettings, 
                          [item.key]: e.target.checked 
                        })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: notificationSettings[item.key as keyof typeof notificationSettings] 
                          ? '#4f6ef7' : '#e5e7eb',
                        transition: '0.4s',
                        borderRadius: '24px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '18px',
                          width: '18px',
                          left: notificationSettings[item.key as keyof typeof notificationSettings] 
                            ? '27px' : '3px',
                          bottom: '3px',
                          backgroundColor: 'white',
                          transition: '0.4s',
                          borderRadius: '50%'
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                Security Settings
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    Change Password
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                    Update your password to keep your account secure
                  </p>
                  <button className={`${styles.actionBtn} ${styles.secondary}`}>
                    Change Password
                  </button>
                </div>

                <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    Two-Factor Authentication
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                    Add an extra layer of security to your account
                  </p>
                  <button className={`${styles.actionBtn} ${styles.primary}`}>
                    Enable 2FA
                  </button>
                </div>

                <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                    Active Sessions
                  </h3>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                    Manage your active login sessions
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '6px',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>Current Session</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Windows • Chrome</div>
                    </div>
                    <span className={`${styles.badge} ${styles.success}`}>Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                Appearance
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
                    Theme
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['Light', 'Dark', 'System'].map(theme => (
                      <button
                        key={theme}
                        style={{
                          padding: '12px 24px',
                          border: theme === 'Light' ? '2px solid #4f6ef7' : '1px solid #e5e7eb',
                          borderRadius: '8px',
                          background: theme === 'Light' ? '#eef1fe' : 'white',
                          color: theme === 'Light' ? '#4f6ef7' : '#6b7280',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
                    Accent Color
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {['#4f6ef7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(color => (
                      <button
                        key={color}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          border: color === '#4f6ef7' ? '3px solid #1a1f36' : '2px solid transparent',
                          background: color,
                          cursor: 'pointer'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px' }}>
                Integrations
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {([
                  { name: 'Google Calendar', desc: 'Sync events with Google Calendar', connected: true, icon: <CalendarIcon size={24} /> },
                  { name: 'Microsoft Teams', desc: 'Enable Teams integration', connected: false, icon: <BriefcaseIcon size={24} /> },
                  { name: 'Slack', desc: 'Send notifications to Slack', connected: false, icon: <MessageIcon size={24} /> },
                  { name: 'Zoom', desc: 'Schedule Zoom meetings', connected: true, icon: <VideoIcon size={24} /> }
                ] as { name: string; desc: string; connected: boolean; icon: React.ReactNode }[]).map(integration => (
                  <div
                    key={integration.name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: '#f9fafb',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4f6ef7'
                    }}>
                      {integration.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{integration.name}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>{integration.desc}</div>
                    </div>
                    <button 
                      className={`${styles.actionBtn} ${integration.connected ? styles.secondary : styles.primary}`}
                      style={{ minWidth: '100px' }}
                    >
                      {integration.connected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div style={{ 
            marginTop: '32px', 
            paddingTop: '24px', 
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '16px'
          }}>
            {saveMessage && (
              <span style={{ color: '#10b981', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckIcon size={16} color="#10b981" /> {saveMessage}
              </span>
            )}
            <button 
              className={`${styles.actionBtn} ${styles.primary}`}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
