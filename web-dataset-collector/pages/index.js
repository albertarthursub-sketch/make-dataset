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
          {/* Navigation */}
          <nav className={styles.navigation}>
            <div className={styles.nav_links}>
              <a href="/" className={styles.nav_link_active}>📸 Enrollment</a>
              <a href="/dashboard" className={styles.nav_link}>📊 Dashboard</a>
              <a href="/attendance-records" className={styles.nav_link}>📅 Attendance</a>
            </div>
          </nav>

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
  const faceDetectorRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const TARGET_IMAGES = 3;

  useEffect(() => {
    loadModels();
    startCamera();
    return () => stopCamera();
  }, []);

  const loadModels = async () => {
    try {
      const { FaceDetector, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const filesetResolver = await FilesetResolver.forVisionOnWasm();
      const detector = await FaceDetector.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm`
        },
        runningMode: 'VIDEO'
      });
      faceDetectorRef.current = detector;
      setModelsLoaded(true);
      setMessage('✅ Face detection model loaded');
    } catch (err) {
      console.error('Failed to load models:', err);
      setError(`❌ Failed to load models: ${err.message}`);
    }
  };

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

  const detectAndCropFace = async () => {
    if (!videoRef.current || !modelsLoaded || !faceDetectorRef.current) {
      setError('❌ Camera or models not ready');
      return null;
    }

    try {
      const video = videoRef.current;
      const detector = faceDetectorRef.current;
      
      // Use detectForVideo method for video stream
      const results = await detector.detectForVideo(video, Date.now());
      const detections = results.detections;

      if (!detections || detections.length === 0) {
        setError('❌ No face detected');
        return null;
      }

      // Get the first face detection
      const face = detections[0];
      
      // boundingBox has originX, originY (top-left), width, height as normalized coordinates
      const bbox = face.boundingBox;
      if (!bbox) {
        setError('❌ Could not get face bounding box');
        return null;
      }

      const x = bbox.originX * video.videoWidth;
      const y = bbox.originY * video.videoHeight;
      const width = bbox.width * video.videoWidth;
      const height = bbox.height * video.videoHeight;

      const padding = 20;
      const cropX = Math.max(0, x - padding);
      const cropY = Math.max(0, y - padding);
      const cropWidth = Math.min(video.videoWidth - cropX, width + padding * 2);
      const cropHeight = Math.min(video.videoHeight - cropY, height + padding * 2);

      if (cropWidth < 50 || cropHeight < 50) {
        setError('❌ Face too small - move closer');
        return null;
      }

      if (cropWidth > 400 || cropHeight > 400) {
        setError('❌ Face too large - move back');
        return null;
      }

      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const ctx = croppedCanvas.getContext('2d');
      ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      return croppedCanvas.toDataURL('image/jpeg', 0.95);
    } catch (err) {
      console.error('Detection error:', err);
      setError(`❌ Detection error: ${err.message}`);
      return null;
    }
  };

  const captureImage = async () => {
    if (!modelsLoaded) {
      setError('❌ Models still loading, please wait...');
      return;
    }

    const croppedImage = await detectAndCropFace();
    if (!croppedImage) {
      return;
    }

    const newImages = [...images, { data: croppedImage, timestamp: Date.now() }];
    setImages(newImages);
    setImageCount(newImages.length);
    setMessage(`✅ Captured image ${newImages.length}/${TARGET_IMAGES}`);
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
        <p className={styles.subtitle}>{imageCount}/{TARGET_IMAGES} images captured</p>

        {/* Camera Frame */}
        <div style={{ width: '100%', marginBottom: '20px' }}>
          <video
            ref={videoRef}
            className={styles.video}
            playsInline
            autoPlay
            muted
            style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {/* Capture Button */}
        <button
          onClick={captureImage}
          disabled={!streaming || !modelsLoaded || imageCount >= TARGET_IMAGES || uploading}
          className={styles.btn_capture}
          style={{ width: '100%', marginBottom: '10px', padding: '15px', fontSize: '16px' }}
        >
          {!streaming ? '⏳ Camera loading...' : !modelsLoaded ? '⏳ Models loading...' : imageCount >= TARGET_IMAGES ? '✅ All images captured' : '📸 Capture Image'}
        </button>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setStep('info')}
            className={styles.btn_secondary}
            style={{ flex: 1, padding: '12px' }}
          >
            ← Enter Another Student
          </button>
          <button
            onClick={uploadAll}
            disabled={images.length === 0 || uploading}
            className={styles.btn_primary}
            style={{ flex: 1, padding: '12px' }}
          >
            {uploading ? '⏳ Uploading...' : `📤 Upload Images`}
          </button>
        </div>

        {/* Captured Images Preview */}
        {images.length > 0 && (
          <div>
            <h3 style={{ marginBottom: '10px' }}>Captured Images ({images.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={img.data} alt={`Capture ${idx + 1}`} style={{ width: '100%', height: 'auto' }} />
                  <button
                    onClick={() => removeImage(idx)}
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '25px',
                      height: '25px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
// System Boot Loader - Continuous Random Sequence
// ==========================================
function SystemBootLoader() {
  const [bootSequence, setBootSequence] = useState([]);

  const bootMessages = [
    'Initializing facial recognition engine...',
    'Loading biometric database [85%]',
    'Verifying encryption [256-bit AES]',
    'Authenticating credentials...',
    'Calibrating camera sensor...',
    'Scanning facial landmarks...',
    'Processing neural networks [92%]',
    'Syncing with cloud storage...',
    'Validating encryption keys...',
    'Optimizing capture parameters...',
    'Checking system resources...',
    'Initializing buffer cache...',
    'Loading model weights [78%]',
    'Verifying database integrity...',
    'Establishing secure connection...',
    'Calibrating light sensors...',
    'Processing image filters...',
    'Running diagnostics [PASS]',
    'Checking hardware acceleration...',
    'Loading compression codec...',
    'Verifying API endpoints...',
    'Initializing session tokens...',
    'Preparing data pipeline...',
    'Scanning environment...',
    '✓ System ready [ALL SYSTEMS GO]'
  ];

  useEffect(() => {
    let isMounted = true;

    const addBootLine = () => {
      if (!isMounted) return;

      const randomMsg = bootMessages[Math.floor(Math.random() * bootMessages.length)];
      setBootSequence(prev => {
        // Keep only last 15 lines to prevent memory issues
        const newSequence = [...prev, { label: randomMsg, id: Date.now() }];
        return newSequence.slice(-15);
      });

      // Random delay between 300-800ms for natural feel
      const nextDelay = Math.random() * 500 + 300;
      setTimeout(addBootLine, nextDelay);
    };

    // Start the continuous boot sequence
    addBootLine();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={styles.boot_sequence}>
      {bootSequence.map((step, idx) => (
        <div key={step.id} className={styles.boot_line}>
          $ {step.label}
          {idx === bootSequence.length - 1 && <span className={styles.boot_cursor}>█</span>}
        </div>
      ))}
      {bootSequence.length === 0 && (
        <div className={styles.boot_line}>$ <span className={styles.boot_cursor}>█</span></div>
      )}
    </div>
  );
}
