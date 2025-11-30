/**
 * Clean Camera Capture Component with Bounding Box Guide
 * - Camera display with bounding box guide overlay
 * - Simple capture from different angles
 * - Ability to delete and retake individual photos
 * - Backend face processing
 */

import React, { useState, useEffect, useRef } from 'react';
import styles from '../styles/index.module.css';

function CaptureStepSimple({
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
  const overlayCanvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [localMessage, setLocalMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const TARGET_IMAGES = 3;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  const animationFrameRef = useRef(null);

  // Start camera
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
          setLocalMessage('✅ Camera ready - position face and capture');
        };
      }
    } catch (err) {
      setLocalError(`❌ Camera error: ${err.message}`);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setStreaming(false);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  useEffect(() => {
    startCamera();
    return stopCamera;
  }, []);

  // Ensure bounding box is always visible
  useEffect(() => {
    if (streaming && videoRef.current && overlayCanvasRef.current) {
      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;
      
      if (video.videoWidth && video.videoHeight) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      
      // Start the bounding box animation loop
      if (!animationFrameRef.current) {
        drawBoundingBox();
      }
    }
  }, [streaming]);

  // Draw bounding box guide on overlay canvas
  const drawBoundingBox = () => {
    if (!videoRef.current || !overlayCanvasRef.current || !streaming) {
      animationFrameRef.current = requestAnimationFrame(drawBoundingBox);
      return;
    }

    const canvas = overlayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Set actual pixel size
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // SIMPLE FACE GUIDE BOX
    const boxSize = Math.min(canvas.width, canvas.height) * 0.35;
    const rectX = (canvas.width - boxSize) / 2;
    const rectY = (canvas.height - boxSize) / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw main guide box outline - CRISP GREEN
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.strokeRect(rectX, rectY, boxSize, boxSize);

    // Draw corner brackets
    ctx.fillStyle = '#00ff88';
    const cornerLen = 30;
    const cornerThick = 3;
    
    // Top-left corner
    ctx.fillRect(rectX, rectY, cornerLen, cornerThick);
    ctx.fillRect(rectX, rectY, cornerThick, cornerLen);
    
    // Top-right corner
    ctx.fillRect(rectX + boxSize - cornerLen, rectY, cornerLen, cornerThick);
    ctx.fillRect(rectX + boxSize - cornerThick, rectY, cornerThick, cornerLen);
    
    // Bottom-left corner
    ctx.fillRect(rectX, rectY + boxSize - cornerThick, cornerLen, cornerThick);
    ctx.fillRect(rectX, rectY + boxSize - cornerLen, cornerThick, cornerLen);
    
    // Bottom-right corner
    ctx.fillRect(rectX + boxSize - cornerLen, rectY + boxSize - cornerThick, cornerLen, cornerThick);
    ctx.fillRect(rectX + boxSize - cornerThick, rectY + boxSize - cornerLen, cornerThick, cornerLen);

    // Center crosshair - subtle
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(centerX, rectY + 20);
    ctx.lineTo(centerX, rectY + boxSize - 20);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(rectX + 20, centerY);
    ctx.lineTo(rectX + boxSize - 20, centerY);
    ctx.stroke();

    ctx.setLineDash([]);

    // Center dot
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();

    animationFrameRef.current = requestAnimationFrame(drawBoundingBox);
  };

  // Capture image from video
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      const video = videoRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data as base64
      const imageData = canvas.toDataURL('image/jpeg', 0.95);

      return imageData;
    } catch (err) {
      setLocalError(`Capture error: ${err.message}`);
      return null;
    }
  };

  // Process image with backend
  const processAndUploadImage = async (imageBase64, position) => {
    setProcessing(true);
    setLocalError('');
    setLocalMessage(`⏳ Processing image (${position})...`);

    try {
      // Call backend API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${BACKEND_URL}/api/process-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          studentId,
          studentName,
          className,
          position
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        let error = 'Backend processing failed';
        let suggestion = '';
        try {
          const data = JSON.parse(text);
          error = data.error || error;
          suggestion = data.suggestion || '';
        } catch (e) {
          error = text || error;
        }
        throw new Error(suggestion ? `${error}\n💡 ${suggestion}` : error);
      }

      const processData = await response.json();

      if (!processData.success) {
        throw new Error(processData.error || 'Processing failed');
      }

      // Add to captured images
      const newImage = {
        id: Date.now(),
        position,
        processed: processData.processed_image,
        timestamp: new Date().toISOString()
      };

      setImages([...images, newImage]);
      setImageCount(prev => prev + 1);
      const newCount = imageCount + 1;
      setLocalMessage(`✅ Image ${newCount}/${TARGET_IMAGES} captured: ${position}`);
      setUploadProgress(Math.round((newCount / TARGET_IMAGES) * 100));

      return true;
    } catch (err) {
      console.error('Processing error:', err);
      
      // Better error messages
      let errorMsg = err.message;
      if (err.name === 'AbortError') {
        errorMsg = 'Processing timeout (15s) - try better lighting or move face closer';
      }
      
      setLocalError(`❌ ${errorMsg}`);
      return false;
    } finally {
      setProcessing(false);
    }
  };

  // Handle capture button click
  const handleCapture = async () => {
    if (!streaming) {
      setLocalError('Camera not ready');
      return;
    }

    if (processing) {
      setLocalError('Still processing previous image');
      return;
    }

    const position = imageCount === 0 ? 'front' : imageCount === 1 ? 'left_side' : 'right_side';
    const imageData = await captureImage();

    if (imageData) {
      await processAndUploadImage(imageData, position);
    } else {
      setLocalError('Failed to capture image');
    }
  };

  // Finish capture
  const handleFinishCapture = () => {
    stopCamera();
    setStep('upload');
  };

  // Redo capture
  const handleRedo = () => {
    setImages([]);
    setImageCount(0);
    setUploadProgress(0);
    startCamera();
  };

  // Delete individual image
  const handleDeleteImage = (imageId) => {
    const filteredImages = images.filter(img => img.id !== imageId);
    setImages(filteredImages);
    setImageCount(filteredImages.length);
    setUploadProgress(Math.round((filteredImages.length / TARGET_IMAGES) * 100));
    setLocalMessage(`✅ Image deleted. ${filteredImages.length}/${TARGET_IMAGES} remaining`);
  };

  return (
    <div className={styles.step}>
      <div className={styles.card} style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '32px',
            margin: '0 0 8px 0',
            color: '#fff',
            fontWeight: '700'
          }}>
            📸 Capture Your Face
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#999',
            margin: '0',
            marginBottom: '20px'
          }}>
            Position {imageCount === 0 ? 'face straight to camera' :
                       imageCount === 1 ? 'face slightly to the left' :
                       'face slightly to the right'}
          </p>
          
          {/* Progress Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            alignItems: 'center'
          }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: i < imageCount ? '#00ff88' : '#333',
                  boxShadow: i < imageCount ? '0 0 10px #00ff88' : 'none',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
            <span style={{
              marginLeft: '12px',
              color: '#00ff88',
              fontSize: '13px',
              fontWeight: '600'
            }}>
              {imageCount}/{TARGET_IMAGES} captured
            </span>
          </div>
        </div>

        {/* Main Content - Camera and Images Side by Side */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: '25px',
          marginBottom: '30px'
        }}>
          {/* LEFT - CAMERA */}
          <div>
            {/* Camera Container */}
            <div style={{
              position: 'relative',
              width: '100%',
              backgroundColor: '#000',
              borderRadius: '12px',
              overflow: 'hidden',
              aspectRatio: '4 / 3',
              border: '2px solid #222',
              boxShadow: '0 0 30px rgba(0, 255, 136, 0.1)'
            }}>
              {/* Video */}
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
                autoPlay
                playsInline
              />

              {/* Overlay Canvas - BOUNDING BOX */}
              <canvas
                ref={overlayCanvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 5,
                  cursor: 'crosshair'
                }}
              />

              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                padding: '8px 14px',
                backgroundColor: streaming ? '#00ff88' : '#ff4444',
                color: '#000',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'currentColor',
                  animation: streaming ? 'pulse 1s infinite' : 'none'
                }}></span>
                {streaming ? 'LIVE' : 'STANDBY'}
              </div>
            </div>

            {/* Hidden capture canvas */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Progress Bar Below Camera */}
            <div style={{
              marginTop: '20px',
              width: '100%'
            }}>
              <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                height: '6px',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    backgroundColor: '#00ff88',
                    height: '100%',
                    width: `${uploadProgress}%`,
                    transition: 'width 0.3s ease',
                    boxShadow: '0 0 15px rgba(0, 255, 136, 0.5)'
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '20px',
              flexWrap: 'wrap'
            }}>
              {imageCount < TARGET_IMAGES ? (
                <>
                  <button
                    onClick={handleCapture}
                    disabled={!streaming || processing}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      backgroundColor: processing ? '#555' : '#00ff88',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      opacity: processing ? 0.6 : 1,
                      transition: 'all 0.3s ease',
                      boxShadow: processing ? 'none' : '0 4px 15px rgba(0, 255, 136, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!processing) {
                        e.target.style.boxShadow = '0 6px 25px rgba(0, 255, 136, 0.5)';
                        e.target.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!processing) {
                        e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.3)';
                        e.target.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {processing ? '⏳ Processing...' : '📸 Capture'}
                  </button>
                  {imageCount > 0 && (
                    <button
                      onClick={handleRedo}
                      style={{
                        flex: 1,
                        padding: '14px 24px',
                        backgroundColor: 'transparent',
                        color: '#999',
                        border: '1.5px solid #444',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.borderColor = '#00ff88';
                        e.target.style.color = '#00ff88';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.borderColor = '#444';
                        e.target.style.color = '#999';
                      }}
                    >
                      🔄 Reset
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleFinishCapture}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      backgroundColor: '#00ff88',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(0, 255, 136, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.boxShadow = '0 6px 25px rgba(0, 255, 136, 0.5)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.3)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    ✓ Continue
                  </button>
                  <button
                    onClick={handleRedo}
                    style={{
                      flex: 1,
                      padding: '14px 24px',
                      backgroundColor: 'transparent',
                      color: '#999',
                      border: '1.5px solid #444',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.borderColor = '#00ff88';
                      e.target.style.color = '#00ff88';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.borderColor = '#444';
                      e.target.style.color = '#999';
                    }}
                  >
                    📸 Retake
                  </button>
                </>
              )}
            </div>
          </div>

          {/* RIGHT - CAPTURED IMAGES */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#00ff88',
              margin: '0 0 8px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Captured
            </h3>

            {images.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#111',
                borderRadius: '8px',
                border: '1.5px dashed #333',
                color: '#666',
                fontSize: '12px',
                textAlign: 'center',
                padding: '20px',
                minHeight: '300px'
              }}>
                <div>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📷</div>
                  <div>Capture images to start</div>
                </div>
              </div>
            ) : (
              images.map((img, idx) => (
                <div
                  key={img.id}
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '2px solid #00ff88',
                    boxShadow: '0 0 12px rgba(0, 255, 136, 0.2)',
                    backgroundColor: '#000',
                    aspectRatio: '1 / 1'
                  }}
                >
                  <img
                    src={img.processed}
                    alt={`Captured ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    color: '#00ff88',
                    padding: '8px',
                    textAlign: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    borderTop: '1px solid #00ff88',
                    textTransform: 'capitalize'
                  }}>
                    {img.position.replace('_', ' ')}
                  </div>
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '36px',
                      width: '28px',
                      height: '28px',
                      backgroundColor: '#ff4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      zIndex: 10,
                      opacity: 0.85,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(255, 68, 68, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 68, 68, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.85';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 68, 68, 0.3)';
                    }}
                    title="Delete this image"
                  >
                    ✕
                  </button>
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    width: '24px',
                    height: '24px',
                    backgroundColor: '#00ff88',
                    color: '#000',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}>
                    {idx + 1}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages */}
        {localMessage && (
          <div style={{
            marginTop: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 255, 136, 0.05)',
            border: '1px solid rgba(0, 255, 136, 0.2)',
            color: '#00ff88',
            fontSize: '13px',
            textAlign: 'center'
          }}>
            {localMessage}
          </div>
        )}
        {localError && (
          <div style={{
            marginTop: '20px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 68, 68, 0.05)',
            border: '1px solid rgba(255, 68, 68, 0.2)',
            color: '#ff4444',
            fontSize: '13px',
            textAlign: 'center',
            whiteSpace: 'pre-wrap'
          }}>
            {localError}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default CaptureStepSimple;
