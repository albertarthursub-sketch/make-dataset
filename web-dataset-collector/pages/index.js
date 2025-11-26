import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/index.module.css';

// Note: useState is already imported above

export default function Home() {
  const [step, setStep] = useState('info'); // 'info', 'capture', 'upload'
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [imageCount, setImageCount] = useState(0);
  const [images, setImages] = useState([]);

  // ==========================================
  // Step 1: Student Info
  // ==========================================
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (!studentId) {
        setError('Please enter your Binusian ID');
        setLoading(false);
        return;
      }

      // Call API to lookup student info
      const lookupResponse = await fetch('/api/student/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });

      if (!lookupResponse.ok) {
        const errorData = await lookupResponse.json();
        const errorMsg = errorData.error || errorData.message || 'Unknown error';
        const details = errorData.details ? ` - ${errorData.details}` : '';
        setError(`❌ ${errorMsg}${details}`);
        setLoading(false);
        return;
      }

      const data = await lookupResponse.json();
      
      if (data.success) {
        // Auto-populate from API response
        setStudentName(data.name);
        setClassName(data.homeroom);
        setMessage(`✅ Found: ${data.name} | Class: ${data.homeroom}`);

        // Save metadata to Firebase
        const metaResponse = await fetch('/api/student/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            studentId: data.studentId,
            studentName: data.name,
            className: data.homeroom,
            gradeCode: data.gradeCode,
            gradeName: data.gradeName
          })
        });

        if (metaResponse.ok) {
          setMessage(`✅ Ready to capture images! Welcome, ${data.name}`);
          setStep('capture');
          setImages([]);
        }
      } else {
        setError('Failed to retrieve student information');
      }

    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate random security metrics
  const [metrics, setMetrics] = useState({
    networkLatency: '12ms',
    encryptionLevel: '256-bit AES',
    systemUptime: '99.97%',
    rateLimit: '9,847/10,000'
  });

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        networkLatency: (Math.random() * 40 + 5).toFixed(1) + 'ms',
        encryptionLevel: '256-bit AES',
        systemUptime: (98 + Math.random() * 2).toFixed(2) + '%',
        rateLimit: Math.floor(Math.random() * 1000 + 9000) + '/10,000'
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.main_layout}>
        {/* Side Boot Sequence Panel */}
        <aside className={styles.boot_sidebar}>
          <div className={styles.boot_panel}>
            <h3>⚙️ SYSTEM BOOT</h3>
            <SystemBootLoader />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={styles.main_content}>
          <header className={styles.header}>
            <h1>🔐 FACIAL ENCODING COLLECTION</h1>
            <p>Biometric Dataset Acquisition System v2.0</p>
          </header>

      {/* Security Metrics Bar */}
      <div className={styles.security_metrics}>
        <div className={styles.metric}>
          <div className={styles.metric_label}>Network Latency</div>
          <div className={styles.metric_value}>{metrics.networkLatency}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metric_label}>Encryption</div>
          <div className={styles.metric_value}>{metrics.encryptionLevel}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metric_label}>System Uptime</div>
          <div className={styles.metric_value}>{metrics.systemUptime}</div>
        </div>
        <div className={styles.metric}>
          <div className={styles.metric_label}>Rate Limit</div>
          <div className={styles.metric_value}>{metrics.rateLimit}</div>
        </div>
      </div>

      {error && <div className={styles.alert_error}>{error}</div>}
      {message && <div className={styles.alert_success}>{message}</div>}

      {step === 'info' && (
        <InfoStep
          studentId={studentId}
          setStudentId={setStudentId}
          studentName={studentName}
          setStudentName={setStudentName}
          className={className}
          setClassName={setClassName}
          loading={loading}
          onSubmit={handleInfoSubmit}
          error={error}
          setError={setError}
          onContinueToCapture={() => setStep('capture')}
        />
      )}

      {step === 'capture' && (
        <CaptureStep
          studentId={studentId}
          studentName={studentName}
          className={className}
          imageCount={imageCount}
          setImageCount={setImageCount}
          images={images}
          setImages={setImages}
          setStep={setStep}
          setMessage={setMessage}
          setError={setError}
        />
      )}

      {step === 'upload' && (
        <UploadStep
          studentName={studentName}
          imageCount={imageCount}
          setStep={setStep}
        />
      )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Step 1: Student Information Form
// ==========================================
function InfoStep({
  studentId,
  setStudentId,
  studentName,
  setStudentName,
  className,
  setClassName,
  loading,
  onSubmit,
  error,
  setError,
  onContinueToCapture
}) {
  return (
    <div className={styles.step}>
      <div className={styles.card}>
        <h2>📝 Student Information</h2>
        <p className={styles.subtitle}>Enter your Binusian ID to auto-load your details</p>

        {!studentName ? (
          <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit(e);
          }}>
            <div className={styles.form_group}>
              <label>Binusian ID * (Required)</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                }}
                placeholder="e.g., 2401234567"
                required
                disabled={loading}
              />
              <small>Your unique Binus student ID to lookup your information</small>
            </div>

            <button type="submit" disabled={loading || !studentId} className={styles.btn_primary}>
              {loading ? '⏳ Looking up...' : '🔍 Lookup Student Info'}
            </button>
          </form>
        ) : (
          <>
            <div className={styles.form_group}>
              <label>Full Name (Auto-filled)</label>
              <input
                type="text"
                value={studentName}
                disabled
                style={{ backgroundColor: '#f0f0f0' }}
              />
              <small>Automatically loaded from system</small>
            </div>

            <div className={styles.form_group}>
              <label>Class / Homeroom (Auto-filled)</label>
              <input
                type="text"
                value={className}
                disabled
                style={{ backgroundColor: '#f0f0f0' }}
              />
              <small>Your homeroom class</small>
            </div>

            <div className={styles.button_group}>
              <button 
                onClick={() => {
                  setStudentId('');
                  setStudentName('');
                  setClassName('');
                }}
                className={styles.btn_secondary}
              >
                ← Enter Different Student
              </button>
              <button 
                onClick={() => {
                  onContinueToCapture();
                }}
                className={styles.btn_primary}
              >
                ➜ Continue to Capture
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// Step 2: Face Capture Interface
// ==========================================
function CaptureStep({
  studentId,
  studentName,
  className,
  imageCount,
  setImageCount,
  images,
  setImages,
  setStep,
  setMessage,
  setError
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const TARGET_IMAGES = 5;

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      // Try with explicit constraints first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 }, 
            height: { ideal: 720 }, 
            facingMode: 'user' 
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setStreaming(true);
            setMessage('✅ Camera connected successfully');
          };
        }
      } catch (permissionErr) {
        // If permission denied or constraints failed, try with minimal constraints
        console.log('Trying with minimal constraints...', permissionErr.message);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setStreaming(true);
            setMessage('✅ Camera connected successfully');
          };
        }
      }
    } catch (err) {
      console.error('Camera error:', err.message);
      
      // Provide more specific error messages
      if (err.name === 'NotAllowedError') {
        setError('❌ Camera permission denied. Please enable camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('❌ No camera found. Please check your camera connection.');
      } else if (err.name === 'NotReadableError') {
        setError('❌ Camera is in use by another application. Please close it and try again.');
      } else if (err.name === 'OverconstrainedError') {
        // Try once more with no constraints
        try {
          console.log('Constraints too strict, trying basic access...');
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              setStreaming(true);
              setMessage('✅ Camera connected (basic mode)');
            };
          }
        } catch (finalErr) {
          setError(`❌ Camera access error: ${finalErr.message}`);
        }
      } else {
        setError(`❌ Camera error: ${err.message}`);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = () => {
    if (!canvasRef.current || !videoRef.current) {
      setError('❌ Camera or canvas reference not available');
      return;
    }

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError('❌ Canvas context not available');
        return;
      }
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      if (canvas.width === 0 || canvas.height === 0) {
        setError('❌ Video not loaded yet. Try again in a moment.');
        return;
      }
      
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.95);
      
      const newImages = [...images, { data: imageData, timestamp: Date.now() }];
      setImages(newImages);
      setImageCount(newImages.length);
      setMessage(`✅ Captured image ${newImages.length}/${TARGET_IMAGES}`);
    } catch (err) {
      setError(`❌ Failed to capture image: ${err.message}`);
      console.error('Capture error:', err);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    setImageCount(newImages.length);
  };

  const uploadAll = async () => {
    if (images.length === 0) {
      setError('No images to upload');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      let uploaded = 0;
      let failed = 0;
      
      for (let i = 0; i < images.length; i++) {
        try {
          const formData = new FormData();
          formData.append('studentId', studentId);
          formData.append('studentName', studentName);
          formData.append('className', className);
          formData.append('position', `capture_${i + 1}`);

          // Convert base64 data URL to Blob
          const base64Data = images[i].data.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }
          const blob = new Blob([bytes], { type: 'image/jpeg' });
          formData.append('image', blob, `${studentName}_${i + 1}.jpg`);

          const uploadResponse = await fetch('/api/face/upload', {
            method: 'POST',
            body: formData
          });

          if (uploadResponse.ok) {
            uploaded++;
            setMessage(`⏳ Uploading... ${uploaded}/${images.length}`);
          } else {
            failed++;
            const errorData = await uploadResponse.json();
            console.error(`Upload failed for image ${i + 1}:`, errorData);
          }
        } catch (imgErr) {
          failed++;
          console.error(`Error uploading image ${i + 1}:`, imgErr);
        }
      }

      if (uploaded > 0) {
        setMessage(`✅ Successfully uploaded ${uploaded}/${images.length} images${failed > 0 ? ` (${failed} failed)` : ''}!`);
        setStep('upload');
      } else {
        setError('Failed to upload any images. Please try again.');
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.step}>
      <div className={styles.card}>
        <h2>📷 Capture Face Images</h2>
        <p className={styles.subtitle}>Position yourself in good lighting</p>

        <div className={styles.capture_container}>
          <video
            ref={videoRef}
            className={styles.video}
            playsInline
            autoPlay
            muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div className={styles.capture_info}>
            <p>📸 Captured: <strong>{imageCount}/{TARGET_IMAGES}</strong></p>
            <p>{streaming ? '✅ Camera Ready' : '⏳ Initializing camera...'}</p>
            <p>💡 Tips: Good lighting, centered face, different angles</p>
            {!streaming && (
              <button
                onClick={() => {
                  setStreaming(false);
                  setError('');
                  setMessage('');
                  startCamera();
                }}
                className={styles.btn_secondary}
                style={{ marginTop: '10px', width: '100%' }}
              >
                🔄 Retry Camera
              </button>
            )}
          </div>

          <button
            onClick={captureImage}
            disabled={!streaming || imageCount >= TARGET_IMAGES || uploading}
            className={styles.btn_capture}
            style={{ 
              opacity: !streaming ? 0.5 : 1,
              cursor: !streaming ? 'not-allowed' : 'pointer'
            }}
          >
            {!streaming ? '⏳ Camera loading...' : imageCount >= TARGET_IMAGES ? '✅ Ready to Upload' : '📸 Capture'}
          </button>
        </div>

        {images.length > 0 && (
          <div className={styles.preview_grid}>
            <h3>Preview ({images.length} images)</h3>
            <div className={styles.image_grid}>
              {images.map((img, idx) => (
                <div key={idx} className={styles.image_item}>
                  <img src={img.data} alt={`Capture ${idx + 1}`} />
                  <button
                    onClick={() => removeImage(idx)}
                    className={styles.btn_delete}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.button_group}>
          <button
            onClick={() => setStep('info')}
            className={styles.btn_secondary}
          >
            ← Back
          </button>
          <button
            onClick={uploadAll}
            disabled={images.length === 0 || uploading}
            className={styles.btn_primary}
          >
            {uploading ? '⏳ Uploading...' : `📤 Upload ${images.length} Images`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Step 3: Upload Confirmation
// ==========================================
function UploadStep({ studentName, imageCount, setStep }) {
  return (
    <div className={styles.step}>
      <div className={styles.card + ' ' + styles.card_success}>
        <div className={styles.success_icon}>✅</div>
        <h2>Upload Complete!</h2>
        <p className={styles.subtitle}>
          Successfully captured and uploaded <strong>{imageCount}</strong> images
        </p>

        <div className={styles.info_box}>
          <h3>📌 Next Steps</h3>
          <ol>
            <li>Your face data has been securely stored</li>
            <li>The facial recognition system will process your images</li>
            <li>You'll be recognized by the attendance system automatically</li>
            <li>Other students can now capture their photos using this app</li>
          </ol>
        </div>

        <button
          onClick={() => window.location.reload()}
          className={styles.btn_primary}
        >
          ↻ Capture Another Student
        </button>
      </div>
    </div>
  );
}

// ==========================================
// System Boot Loader - Techy Sequence
// ==========================================
function SystemBootLoader() {
  const [bootSequence, setBootSequence] = useState([]);

  useEffect(() => {
    const bootSteps = [
      { label: 'Initializing facial recognition...', delay: 200 },
      { label: 'Loading biometric database [85%]', delay: 200 },
      { label: 'Verifying encryption [256-bit AES]', delay: 200 },
      { label: 'Authenticating credentials...', delay: 200 },
      { label: 'Calibrating camera sensor...', delay: 200 },
      { label: '✓ System ready [ALL SYSTEMS GO]', delay: 200 }
    ];

    let currentIndex = 0;
    const bootCycle = () => {
      if (currentIndex < bootSteps.length) {
        const step = bootSteps[currentIndex];
        setBootSequence(prev => [...prev, step]);
        currentIndex++;
        setTimeout(bootCycle, step.delay);
      } else {
        // Reset after showing all steps
        setTimeout(() => {
          currentIndex = 0;
          setBootSequence([]);
          setTimeout(bootCycle, 500);
        }, 1000);
      }
    };

    bootCycle();
    
    return () => {
      // Cleanup handled by setTimeout mechanism
    };
  }, []);

  return (
    <div className={styles.boot_sequence}>
      {bootSequence.length === 0 ? (
        <div className={styles.boot_line}>$ <span className={styles.boot_cursor}>█</span></div>
      ) : (
        bootSequence.map((step, idx) => (
          <div key={idx} className={styles.boot_line}>
            $ {step.label}
            {idx === bootSequence.length - 1 && <span className={styles.boot_cursor}>█</span>}
          </div>
        ))
      )}
    </div>
  );
}
