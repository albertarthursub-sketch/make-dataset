import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/index.module.css';

const TARGET_IMAGES = 5;

export default function Home() {
  // State management
  const [step, setStep] = useState('info'); // 'info', 'capture', 'upload', 'success'
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [imageCount, setImageCount] = useState(0);
  const [images, setImages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const faceDetectorRef = useRef(null);

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

      const lookupResponse = await fetch('/api/student/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });

      if (!lookupResponse.ok) {
        const errorData = await lookupResponse.json();
        setError(`❌ ${errorData.error || 'Student not found'}`);
        setLoading(false);
        return;
      }

      const data = await lookupResponse.json();
      if (data.success) {
        setStudentName(data.name);
        setClassName(data.className);
        setMessage('✅ Student found! Ready to capture images.');
        setTimeout(() => {
          setStep('capture');
          setLoading(false);
        }, 1000);
      }
    } catch (err) {
      setError(`❌ Error: ${err.message}`);
      setLoading(false);
    }
  };

  // ==========================================
  // Step 2: Camera & Face Detection
  // ==========================================
  const loadModels = async () => {
    try {
      const { FilesetResolver, FaceDetector } = await import('@mediapipe/face_detection');
      
      const filesetResolver = await FilesetResolver.forVisionOnWasm();
      const detector = await FaceDetector.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.tflite'
        },
        runningMode: 'VIDEO'
      });
      faceDetectorRef.current = detector;
      setModelsLoaded(true);
      setMessage('✅ Face detection ready');
    } catch (err) {
      setError(`❌ Failed to load models: ${err.message}`);
    }
  };

  useEffect(() => {
    if (step === 'capture') {
      startCamera();
      loadModels();
    }
    return () => stopCamera();
  }, [step]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStreaming(true);
          setMessage('✅ Camera connected');
        };
      }
    } catch (err) {
      setError(`❌ Camera error: ${err.message}`);
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
      const detectionResult = await detector.detectForVideo(video, Date.now());
      const detections = detectionResult.detections;

      if (!detections || detections.length === 0) {
        setError('❌ No face detected');
        return null;
      }

      const detection = detections[0];
      const boundingBox = detection.boundingBox;

      const x = boundingBox.originX * video.videoWidth;
      const y = boundingBox.originY * video.videoHeight;
      const width = boundingBox.width * video.videoWidth;
      const height = boundingBox.height * video.videoHeight;

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
      setError(`❌ Detection error: ${err.message}`);
      return null;
    }
  };

  const captureImage = async () => {
    setError('');
    setMessage('🔍 Detecting face...');

    const croppedImageData = await detectAndCropFace();
    if (!croppedImageData) return;

    const newImages = [...images, { data: croppedImageData, timestamp: Date.now() }];
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
          formData.append('cropped', 'true');

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
          }
        } catch (err) {
          failed++;
          console.error(`Error uploading image ${i + 1}:`, err);
        }
      }

      if (uploaded > 0) {
        setMessage(`✅ Successfully uploaded ${uploaded}/${images.length} images!`);
        setStep('success');
      } else {
        setError('Failed to upload images');
      }
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // Render UI
  // ==========================================
  if (step === 'info') {
    return (
      <div className={styles.step}>
        <div className={styles.card}>
          <h2>👤 Student Information</h2>
          <form onSubmit={handleInfoSubmit}>
            <div className={styles.form_group}>
              <label>Binusian ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your Binusian ID"
                disabled={loading}
              />
            </div>
            {error && <div className={styles.alert_error}>{error}</div>}
            {message && <div className={styles.alert_success}>{message}</div>}
            <button type="submit" disabled={loading} className={styles.btn_primary}>
              {loading ? '⏳ Loading...' : '➜ Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'capture') {
    return (
      <div className={styles.step}>
        <div className={styles.card}>
          <h2>📷 Capture Images</h2>
          <p className={styles.subtitle}>{studentName} ({className})</p>

          <div className={styles.capture_container}>
            <video
              ref={videoRef}
              className={styles.video}
              playsInline
              autoPlay
              muted
            />
          </div>

          <div className={styles.capture_info}>
            <p>📸 Captured: <strong>{imageCount}/{TARGET_IMAGES}</strong></p>
            <p>{streaming ? (modelsLoaded ? '✅ Ready' : '⏳ Loading...') : '⏳ Starting...'}</p>
            <p>💡 Good lighting, centered face, different angles</p>
          </div>

          {error && <div className={styles.alert_error}>{error}</div>}
          {message && <div className={styles.alert_success}>{message}</div>}

          <button
            onClick={captureImage}
            disabled={!streaming || !modelsLoaded || imageCount >= TARGET_IMAGES}
            className={styles.btn_capture}
          >
            📸 Capture Image
          </button>

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

          {imageCount >= TARGET_IMAGES && (
            <button
              onClick={uploadAll}
              disabled={uploading}
              className={styles.btn_primary}
              style={{ marginTop: '20px' }}
            >
              {uploading ? '⏳ Uploading...' : '📤 Upload All Images'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className={styles.step}>
        <div className={styles.card} style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2em', marginBottom: '20px' }}>✅ Success!</h2>
          <p>All {imageCount} images uploaded successfully</p>
          <p>Student: <strong>{studentName}</strong></p>
          <p>Class: <strong>{className}</strong></p>
          <button
            onClick={() => {
              setStep('info');
              setStudentId('');
              setStudentName('');
              setClassName('');
              setImages([]);
              setImageCount(0);
              setError('');
              setMessage('');
            }}
            className={styles.btn_primary}
            style={{ marginTop: '30px' }}
          >
            ➜ Capture More
          </button>
        </div>
      </div>
    );
  }
}
