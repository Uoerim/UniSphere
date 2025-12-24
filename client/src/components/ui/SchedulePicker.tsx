import { useState, useEffect } from 'react';
import styles from './SchedulePicker.module.css';

interface ScheduleSlot {
  id: string;
  days: string[];
  startTime: string;
  endTime: string;
}

interface SchedulePickerProps {
  value: string; // JSON string or formatted schedule string
  onChange: (scheduleJson: string, displayString: string) => void;
  label?: string;
}

const DAYS = [
  { short: 'Su', full: 'Sunday' },
  { short: 'M', full: 'Monday' },
  { short: 'Tu', full: 'Tuesday' },
  { short: 'W', full: 'Wednesday' },
  { short: 'Th', full: 'Thursday' },
  { short: 'F', full: 'Friday' },
  { short: 'Sa', full: 'Saturday' },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
};

const formatScheduleDisplay = (slots: ScheduleSlot[]): string => {
  if (slots.length === 0) return '';
  
  return slots
    .filter(slot => slot.days.length > 0 && slot.startTime && slot.endTime)
    .map(slot => {
      const daysStr = slot.days.join('');
      const timeStr = `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`;
      return `${daysStr} ${timeStr}`;
    })
    .join('; ');
};

export default function SchedulePicker({ value, onChange, label = 'Schedule' }: SchedulePickerProps) {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);

  // Parse initial value
  useEffect(() => {
    if (value) {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setSlots(parsed.map((s: any) => ({
            id: s.id || generateId(),
            days: s.days || [],
            startTime: s.startTime || '',
            endTime: s.endTime || ''
          })));
          return;
        }
      } catch {
        // If not JSON, try to parse display string format (e.g., "MWF 9:00 AM - 10:00 AM")
        // For now, just start fresh
      }
    }
    // Default: one empty slot
    if (slots.length === 0) {
      setSlots([{ id: generateId(), days: [], startTime: '', endTime: '' }]);
    }
  }, []);

  const updateSlots = (newSlots: ScheduleSlot[]) => {
    setSlots(newSlots);
    const jsonStr = JSON.stringify(newSlots);
    const displayStr = formatScheduleDisplay(newSlots);
    onChange(jsonStr, displayStr);
  };

  const addSlot = () => {
    updateSlots([...slots, { id: generateId(), days: [], startTime: '', endTime: '' }]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 1) return;
    updateSlots(slots.filter(s => s.id !== id));
  };

  const toggleDay = (slotId: string, day: string) => {
    updateSlots(
      slots.map(slot => {
        if (slot.id !== slotId) return slot;
        const days = slot.days.includes(day)
          ? slot.days.filter(d => d !== day)
          : [...slot.days, day].sort((a, b) => 
              DAYS.findIndex(d => d.short === a) - DAYS.findIndex(d => d.short === b)
            );
        return { ...slot, days };
      })
    );
  };

  const updateTime = (slotId: string, field: 'startTime' | 'endTime', value: string) => {
    updateSlots(
      slots.map(slot => 
        slot.id === slotId ? { ...slot, [field]: value } : slot
      )
    );
  };

  const displayPreview = formatScheduleDisplay(slots);

  return (
    <div className={styles.schedulePickerContainer}>
      <label className={styles.schedulePickerLabel}>{label}</label>
      
      <div className={styles.scheduleSlots}>
        {slots.map((slot) => (
          <div key={slot.id} className={styles.scheduleSlot}>
            <div className={styles.daySelector}>
              {DAYS.map(day => (
                <button
                  key={day.short}
                  type="button"
                  className={`${styles.dayButton} ${slot.days.includes(day.short) ? styles.selected : ''}`}
                  onClick={() => toggleDay(slot.id, day.short)}
                  title={day.full}
                >
                  {day.short}
                </button>
              ))}
            </div>
            
            <div className={styles.timeInput}>
              <label>From:</label>
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) => updateTime(slot.id, 'startTime', e.target.value)}
              />
            </div>
            
            <div className={styles.timeInput}>
              <label>To:</label>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) => updateTime(slot.id, 'endTime', e.target.value)}
              />
            </div>
            
            {slots.length > 1 && (
              <button
                type="button"
                className={styles.removeSlotBtn}
                onClick={() => removeSlot(slot.id)}
                title="Remove time slot"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button type="button" className={styles.addSlotBtn} onClick={addSlot}>
        <span>+</span> Add Another Time Slot
      </button>

      {displayPreview && (
        <div className={styles.schedulePreview}>
          <div className={styles.schedulePreviewTitle}>Preview</div>
          <div className={styles.schedulePreviewText}>{displayPreview}</div>
        </div>
      )}
      
      {!displayPreview && (
        <div className={styles.schedulePreview}>
          <div className={styles.schedulePreviewEmpty}>
            Select days and times to see schedule preview
          </div>
        </div>
      )}
    </div>
  );
}
