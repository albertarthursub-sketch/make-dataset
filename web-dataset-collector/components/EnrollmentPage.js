import React, { useState } from 'react';
import styles from '../styles/enrollment.module.css';

export default function EnrollmentPage({ onStudentData }) {
  const [binusianId, setBinusianId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);

  const handleRetrieve = async (e) => {
    e.preventDefault();
    
    if (!binusianId.trim()) {
      setError('Please enter a Binusian ID');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/student/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: binusianId }),
      });

      const data = await response.json();

      if (data.success) {
        setStudentInfo(data.student);
      } else {
        setError(data.message || 'Student not found. Please check the ID.');
      }
    } catch (err) {
      setError('Failed to retrieve student data. Please try again.');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = () => {
    if (studentInfo) {
      onStudentData({
        studentId: binusianId,
        studentName: studentInfo.name,
        className: studentInfo.class || studentInfo.homeroom,
      });
    }
  };

  const handleNewStudent = () => {
    setBinusianId('');
    setStudentInfo(null);
    setError('');
  };

  return (
    <div className={styles.enrollmentContainer}>
      <div className={styles.enrollmentCard}>
        <h1 className={styles.title}>Facial Attendance System</h1>
        <p className={styles.subtitle}>Enter your Binusian ID to retrieve student data</p>

        {!studentInfo ? (
          <form onSubmit={handleRetrieve} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="binusianId" className={styles.label}>
                Binusian ID
              </label>
              <input
                id="binusianId"
                type="text"
                value={binusianId}
                onChange={(e) => setBinusianId(e.target.value)}
                placeholder="Enter your student ID"
                className={styles.input}
                disabled={loading}
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button
              type="submit"
              className={styles.button}
              disabled={loading || !binusianId.trim()}
            >
              {loading ? 'Retrieving...' : 'Retrieve Student Data'}
            </button>
          </form>
        ) : (
          <div className={styles.studentInfo}>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Name:</span>
                <span className={styles.value}>{studentInfo.name}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Class:</span>
                <span className={styles.value}>{studentInfo.class || studentInfo.homeroom}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Student ID:</span>
                <span className={styles.value}>{binusianId}</span>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button onClick={handleCapture} className={styles.primaryButton}>
                Proceed to Capture
              </button>
              <button onClick={handleNewStudent} className={styles.secondaryButton}>
                Enter Another Student
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
