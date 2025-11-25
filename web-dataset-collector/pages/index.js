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
        setError(`❌ Student not found: ${errorData.message || errorData.error}`);
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📸 Facial Dataset Collector</h1>
        <p>Binus School - Student Face Capture</p>
      </header>

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
  setError
}) {
  return (
    <div className={styles.step}>
      <div className={styles.card}>
        <h2>📝 Student Information</h2>
        <p className={styles.subtitle}>Enter your Binusian ID to auto-load your details</p>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
          // After successful lookup, parent will set step to 'capture'
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
              disabled={studentName ? true : loading}
            />
            <small>Your unique Binus student ID to lookup your information</small>
          </div>

          {studentName && (
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
            </>
          )}

          <button type="submit" disabled={loading || !studentId} className={styles.btn_primary}>
            {loading ? '⏳ Looking up...' : (studentName ? '➜ Continue to Capture' : '🔍 Lookup Student Info')}
          </button>
        </form>

        {studentName && (
          <button 
            onClick={() => {
              setStudentId('');
              setStudentName('');
              setClassName('');
            }}
            className={styles.btn_secondary}
            style={{ marginTop: '10px' }}
          >
            ← Enter Different Student
          </button>
        )}

        <div className={styles.info_box}>
          <h3>ℹ️ How it works</h3>
          <ol>
            <li>Enter your Binusian ID</li>
            <li>Your name and class will auto-load from the system</li>
            <li>Allow camera access when prompted</li>
            <li>Capture 3-5 high-quality face images</li>
            <li>Images are uploaded to secure storage</li>
            <li>You're ready for the attendance system!</li>
          </ol>
        </div>
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
  const [quality, setQuality] = useState('none');
  const [uploading, setUploading] = useState(false);
  const TARGET_IMAGES = 5;

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStreaming(true);
        };
      }
    } catch (err) {
      setError('❌ Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const captureImage = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setImages([...images, { data: imageData, timestamp: Date.now() }]);
    setImageCount(images.length + 1);
    setMessage(`✅ Captured image ${images.length + 1}/${TARGET_IMAGES}`);
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
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div className={styles.capture_info}>
            <p>📸 Captured: <strong>{imageCount}/{TARGET_IMAGES}</strong></p>
            <p>💡 Tips: Good lighting, centered face, different angles</p>
          </div>

          <button
            onClick={captureImage}
            disabled={!streaming || imageCount >= TARGET_IMAGES}
            className={styles.btn_capture}
          >
            {imageCount >= TARGET_IMAGES ? '✅ Complete' : '📸 Capture'}
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
