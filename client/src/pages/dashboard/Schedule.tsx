import React from 'react';
import styles from '../../styles/pages.module.css';

const schedule = [
  { date: '2025-12-25', time: '10:00 AM', place: 'Room 101', event: 'CS101 Lecture' },
  { date: '2025-12-26', time: '2:00 PM', place: 'Lab 202', event: 'CS201 Lab' },
  { date: '2025-12-27', time: '11:00 AM', place: 'Room 305', event: 'Department Meeting' },
];

export default function Schedule() {
  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Schedule</h1>
          <p className={styles.pageSubtitle}>View your upcoming classes, meetings, and events</p>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Place</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.date}</td>
                  <td>{item.time}</td>
                  <td>{item.place}</td>
                  <td>{item.event}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
