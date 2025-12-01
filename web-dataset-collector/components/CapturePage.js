import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/capture.module.css';

const POSITIONS = ['front', 'left', 'right'];

export default function CapturePage({ studentData, onBack, onUploadComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImages, setCapturedImages] = useState({}); // { position: { processed, visualization } }
  const [currentPosition, setCurrentPosition] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [showVisualization, setShowVisualization] = useState(null); // Show bounding box overlay

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraReady(true);
        }
      } catch (err) {
        setError('Failed to access camera. Please allow camera permissions.');
        console.error('Camera error:', err);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setLoading(true);
      setError('');

      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.9);

      // Process image with backend - with retry logic
      let response = await fetch('/api/process-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          studentId: studentData.studentId,
          studentName: studentData.studentName,
          className: studentData.className,
          position: POSITIONS[currentPosition],
        }),
      });

      let result = await response.json();

      // If face not detected, try one more time with different angles hint
      if (!result.success && result.faces_detected === 0) {
        setError('Face not detected. Adjusting position slightly...');
        
        // Wait a moment and try again
        await new Promise(resolve => setTimeout(resolve, 800));
        
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const retryImageData = canvasRef.current.toDataURL('image/jpeg', 0.9);
        
        response = await fetch('/api/process-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: retryImageData,
            studentId: studentData.studentId,
            studentName: studentData.studentName,
            className: studentData.className,
            position: POSITIONS[currentPosition],
          }),
        });
        
        result = await response.json();
      }

      if (result.success) {
        const position = POSITIONS[currentPosition];
        setCapturedImages(prev => ({
          ...prev,
          [position]: {
            processed: result.processed_image,  // Cropped face
            visualization: result.visualization  // With bounding box
          },
        }));
        setShowVisualization(result.visualization); // Show bounding box briefly
        setSuccess(`✓ ${position.charAt(0).toUpperCase() + position.slice(1)} face captured (${result.faces_detected} face detected)`);
        
        // Hide visualization after 2 seconds, then move to next position
        setTimeout(() => {
          setShowVisualization(null);
          setSuccess('');
          if (currentPosition < POSITIONS.length - 1) {
            setCurrentPosition(currentPosition + 1);
          }
        }, 2000);
      } else {
        setError(`${result.error || 'Failed to capture face'} - Try better lighting or move closer to camera.`);
      }
    } catch (err) {
      setError('Error capturing image. Please try again.');
      console.error('Capture error:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = (position) => {
    setCapturedImages(prev => {
      const updated = { ...prev };
      delete updated[position];
      return updated;
    });
  };

  const retakeImage = (position) => {
    const posIndex = POSITIONS.indexOf(position);
    setCurrentPosition(posIndex);
    deleteImage(position);
  };

  const handleUpload = async () => {
    if (Object.keys(capturedImages).length === 0) {
      setError('Please capture at least one image');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const response = await fetch('/api/upload-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentData.studentId,
          studentName: studentData.studentName,
          className: studentData.className,
          images: Object.entries(capturedImages).reduce((acc, [pos, data]) => {
            acc[pos] = data.processed; // Only send processed (cropped) images
            return acc;
          }, {}),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('✓ All images uploaded to Firebase successfully!');
        setTimeout(() => {
          onUploadComplete();
        }, 2000);
      } else {
        setError(result.error || 'Upload failed. Please try again.');
      }
    } catch (err) {
      setError('Error uploading images. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const captureProgress = Object.keys(capturedImages).length;
  const allCaptured = captureProgress === POSITIONS.length;

  return (
    <div className={styles.captureContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Face Capture</h1>
        <p className={styles.subtitle}>
          {studentData.studentName} - {studentData.className}
        </p>
      </div>

      <div className={styles.mainContent}>
        {/* Video/Camera Section */}
        <div className={styles.cameraSection}>
          <div className={styles.videoWrapper}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className={styles.video}
            />
            {!cameraReady && <div className={styles.cameraLoading}>Initializing camera...</div>}
            
            {/* Show bounding box visualization overlay after capture */}
            {showVisualization && (
              <div className={styles.visualizationOverlay}>
                <img src={showVisualization} alt="Face detected with bounding box" className={styles.visualizationImage} />
                <div className={styles.visualizationLabel}>✓ Face Detected & Cropped</div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} width={1280} height={720} style={{ display: 'none' }} />

          <div className={styles.cameraControls}>
            <div className={styles.positionIndicator}>
              Current Position: <span className={styles.positionName}>{POSITIONS[currentPosition].toUpperCase()}</span>
            </div>

            <div className={styles.progressBar}>
              {POSITIONS.map((pos, idx) => (
                <div
                  key={pos}
                  className={`${styles.progressDot} ${
                    capturedImages[pos] ? styles.completed : idx === currentPosition ? styles.active : ''
                  }`}
                >
                  {pos.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <button
              onClick={captureImage}
              disabled={loading || !cameraReady}
              className={styles.captureButton}
            >
              {loading ? 'Processing...' : 'Capture'}
            </button>
          </div>
        </div>

        {/* Images Lineup Section */}
        <div className={styles.imagesSection}>
          <h3 className={styles.imagesTitle}>Captured Images ({captureProgress}/{POSITIONS.length})</h3>
          
          <div className={styles.imagesList}>
            {POSITIONS.map(position => (
              <div key={position} className={styles.imageItem}>
                <div className={styles.imageLabel}>{position.toUpperCase()}</div>
                
                {capturedImages[position] ? (
                  <div className={styles.imageWrapper}>
                    <img
                      src={capturedImages[position].processed}
                      alt={position}
                      className={styles.capturedImage}
                    />
                    <div className={styles.imageActions}>
                      <button
                        onClick={() => retakeImage(position)}
                        className={styles.retakeButton}
                        title="Retake this image"
                      >
                        Retake
                      </button>
                      <button
                        onClick={() => deleteImage(position)}
                        className={styles.deleteButton}
                        title="Delete this image"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.placeholder}>No image</div>
                )}
              </div>
            ))}
          </div>

          {capturedImages[POSITIONS[0]] && (
            <div className={styles.footerActions}>
              <button
                onClick={onBack}
                className={styles.backButton}
              >
                Back to Enrollment
              </button>
              
              <button
                onClick={handleUpload}
                disabled={uploading || captureProgress === 0}
                className={`${styles.uploadButton} ${allCaptured ? styles.complete : ''}`}
              >
                {uploading ? 'Uploading...' : `Upload ${captureProgress} Image${captureProgress !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>

      {success && (
        <div className={styles.successOverlay}>
          <div className={styles.successMessage}>{success}</div>
        </div>
      )}
    </div>
  );
}
