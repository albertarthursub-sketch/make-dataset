# Fresh Architecture: JavaScript Frontend + Python OpenCV Backend

## Overview

**Clean Separation of Concerns:**
```
┌─────────────────────────────────────────┐
│   Next.js Frontend (JavaScript)         │
│   - Simple camera capture               │
│   - User interface                      │
│   - Progress tracking                   │
│   - Image preview                       │
└──────────────┬──────────────────────────┘
               │ HTTP POST (Base64 image)
               ↓
┌─────────────────────────────────────────┐
│   Python Flask Backend                  │
│   - Face detection (OpenCV Haar)        │
│   - Face cropping & alignment           │
│   - Image enhancement                   │
│   - Bounding box visualization          │
│   - Firebase upload                     │
└─────────────────────────────────────────┘
               │
               ↓ Upload
┌─────────────────────────────────────────┐
│   Firebase Cloud Storage                │
│   - Cropped face images                 │
│   - Bounding box visualizations         │
│   - Metadata in Firestore               │
└─────────────────────────────────────────┘
```

## Backend Setup

### 1. Install Python Dependencies

```bash
cd c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1
pip install -r backend_requirements.txt
```

### 2. Configure Environment Variables

Your `.env` file already has Firebase credentials:
```
FIREBASE_PROJECT_ID=facial-attendance-binus
FIREBASE_PRIVATE_KEY_ID=8fa52216a8de274cdc40cb79c6f7f35716b5447b
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@facial-attendance-binus.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=118214808910192528173
FIREBASE_STORAGE_BUCKET=facial-attendance-binus.firebasestorage.app
API_KEY=OUQyQjdEN0EtREFDQy00QkEyLTg3QTAtNUFGNDVDOUZCRTgy
```

### 3. Start Python Backend

```bash
cd c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1
python facial_recognition_backend.py
```

Expected output:
```
🚀 Starting Facial Recognition Backend API
Firebase: ✓ Initialized
Face Detection: ✓ Ready
 * Running on http://0.0.0.0:5000
```

### 4. Test Backend Health

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "ok",
  "firebase": true,
  "cascade": true,
  "timestamp": "2025-11-30T04:22:01.123456"
}
```

## Frontend Setup

### 1. Install Dependencies (Already Done)

```bash
cd web-dataset-collector
npm install
```

### 2. Configure Environment Variables

Already created `.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
FIREBASE_STORAGE_BUCKET=facial-attendance-binus.firebasestorage.app
# ... other Firebase vars
```

### 3. Update Component (pages/index.js)

Import the new simple component:
```javascript
import CaptureStepSimple from '../components/CaptureStepSimple';

// In the CaptureStep section of render:
{step === 'capture' && (
  <CaptureStepSimple
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
```

### 4. Start Frontend

```bash
cd web-dataset-collector
npm run dev
```

Open: http://localhost:3000

## Workflow

### User Journey

1. **Student Info Step**
   - Enter Binusian ID
   - System looks up student info (name, class)
   - Confirm and proceed to capture

2. **Capture Step (New Simple Version)**
   - Camera shows live video feed
   - Student positioned for first photo (front)
   - Click "📸 Capture Image"
   - Frontend sends raw image to Python backend
   - Backend:
     * Detects faces using OpenCV
     * Crops largest face with padding
     * Enhances contrast (histogram equalization)
     * Uploads cropped image to Firebase
     * Returns visualization (bounding boxes)
   - Frontend shows preview with bounding boxes
   - Progress bar updates (1/3 captured)

3. **Repeat for Angles**
   - Position 2: Left side
   - Position 3: Right side
   - Same process for each

4. **Upload Step**
   - Summary of all 3 images
   - Show preview gallery
   - Confirm completion
   - Option to start over

### Backend API Endpoints

#### 1. Health Check
```
GET /api/health
Response: { status, firebase, cascade, timestamp }
```

#### 2. Process Single Image
```
POST /api/process-image
Content-Type: application/json

Request:
{
  "image": "data:image/jpeg;base64,...",
  "studentId": "1234567",
  "studentName": "John Doe",
  "className": "10A",
  "position": "front"
}

Response:
{
  "success": true,
  "faces_detected": 1,
  "processed_image": "data:image/jpeg;base64,...",  // Cropped face
  "visualization": "data:image/jpeg;base64,...",    // With bounding box
  "firebase_path": "gs://bucket/face_dataset/...",
  "message": "✓ Detected and processed 1 face(s)"
}
```

#### 3. Batch Process Multiple Images
```
POST /api/batch-process

Request:
{
  "images": [
    { "image": "base64...", "position": "front" },
    { "image": "base64...", "position": "left_side" },
    { "image": "base64...", "position": "right_side" }
  ],
  "studentId": "1234567",
  "studentName": "John Doe",
  "className": "10A"
}

Response:
{
  "success": true,
  "total_processed": 3,
  "successful": 3,
  "failed": 0,
  "results": [...]
}
```

## Key Features

### Backend (Python/OpenCV)

✅ **Face Detection**
- Haar Cascade Classifier (fast, reliable)
- Detects multiple faces, processes largest
- Works offline (no cloud inference)

✅ **Face Processing**
- Automatic cropping with padding
- Resize to 224×224 (standard for face recognition models)
- Histogram equalization for better contrast
- Padding: 10% on each side for context

✅ **Visualization**
- Bounding boxes (green, matching frontend style)
- Corner markers (indicate face boundaries)
- Confidence labels
- Sent back to frontend for preview

✅ **Firebase Integration**
- Direct upload of cropped faces
- Metadata in Firestore (position, timestamp, etc.)
- Fallback logging if Firebase unavailable

### Frontend (JavaScript)

✅ **Simple Camera Capture**
- No face detection model (lighter, faster)
- Clean, responsive UI
- Progress tracking
- Image preview gallery

✅ **Backend Integration**
- Sends raw image to Python backend
- Receives processed image + visualization
- Shows bounding boxes for user feedback
- Displays crop preview

## Development Testing

### Test Python Backend Only

```bash
# Start backend
python facial_recognition_backend.py

# Test with Python script
python test_firebase_upload.py
```

### Test Frontend Only

```bash
# Start frontend (backend must be running)
cd web-dataset-collector
npm run dev

# Open http://localhost:3000
```

### Test Full Stack

1. Terminal 1: Start Python backend
   ```bash
   python facial_recognition_backend.py
   ```

2. Terminal 2: Start Next.js frontend
   ```bash
   cd web-dataset-collector
   npm run dev
   ```

3. Browser: http://localhost:3000
   - Enter student ID
   - Capture 3 images
   - Check Firebase Console for uploaded cropped faces

## Deployment (Vercel + Python Backend)

### Option A: Backend on Same Server (Recommended)

If you have a Python hosting service (Heroku, Railway, PythonAnywhere):

1. Deploy Python backend
   - Get public URL: `https://your-backend.herokuapp.com`

2. Update frontend `.env.local` in Vercel:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.herokuapp.com
   ```

3. Deploy Next.js to Vercel (as usual)
   - `git push origin main`
   - Auto-deploys

### Option B: Simplified - Backend on Local Machine (Testing)

For now, run backend locally and test frontend:

```bash
# Terminal 1: Backend (local)
python facial_recognition_backend.py

# Terminal 2: Frontend (local)
cd web-dataset-collector
npm run dev

# Open http://localhost:3000
```

## Troubleshooting

### Backend won't start
```
Error: ModuleNotFoundError: No module named 'flask'
```
**Solution:** Install requirements
```bash
pip install -r backend_requirements.txt
```

### Face detection not working
```
Error: No faces detected in image
```
**Solution:** 
- Ensure good lighting
- Face must be clear and centered
- Try different angles
- Check image quality

### Firebase upload fails
```
Error: Firebase initialization failed
```
**Solution:**
- Verify `.env` has correct Firebase credentials
- Check `FIREBASE_STORAGE_BUCKET` is exactly: `facial-attendance-binus.firebasestorage.app`
- Ensure Firebase project allows uploads

### Frontend can't reach backend
```
Error: Failed to fetch http://localhost:5000/api/process-image
```
**Solution:**
- Ensure Python backend is running: `python facial_recognition_backend.py`
- Check backend is on port 5000
- Ensure `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000` in `.env.local`

## File Structure

```
make-dataset-1/
├── .env                              # Firebase credentials
├── facial_recognition_backend.py     # Python backend API
├── backend_requirements.txt           # Python dependencies
├── test_firebase_upload.py           # Test script
│
└── web-dataset-collector/
    ├── .env.local                    # Frontend Firebase config
    ├── pages/
    │   ├── index.js                  # Main page (TODO: update to use CaptureStepSimple)
    │   └── api/
    │       └── face/
    │           └── upload.js         # Old (can remove after testing)
    │
    ├── components/
    │   └── CaptureStepSimple.js      # NEW: Simple camera capture
    │
    ├── lib/
    │   └── firebase-admin.js         # Firebase config
    │
    └── styles/
        └── index.module.css          # CSS styles
```

## Next Steps

1. ✅ Create Python backend (`facial_recognition_backend.py`)
2. ✅ Create frontend component (`CaptureStepSimple.js`)
3. ⚠️ Update `pages/index.js` to use new component
4. ⚠️ Update `web-dataset-collector/.env.local` with `NEXT_PUBLIC_BACKEND_URL`
5. ⚠️ Test locally with both backend and frontend
6. ⚠️ Verify images upload to Firebase with bounding boxes
7. ⚠️ Deploy backend to hosting service
8. ⚠️ Update Vercel environment variables
9. ⚠️ Deploy frontend to Vercel

## Quick Start Checklist

- [ ] Backend dependencies installed: `pip install -r backend_requirements.txt`
- [ ] Backend `.env` configured with Firebase credentials
- [ ] Python backend running: `python facial_recognition_backend.py`
- [ ] Backend health check passing: `curl http://localhost:5000/api/health`
- [ ] Frontend component created: `CaptureStepSimple.js`
- [ ] Frontend `.env.local` has `NEXT_PUBLIC_BACKEND_URL`
- [ ] Frontend updated to use new component in `pages/index.js`
- [ ] Frontend running: `npm run dev`
- [ ] Test capture: Enter student ID → Capture 3 images
- [ ] Verify Firebase: Check `gs://facial-attendance-binus.firebasestorage.app/face_dataset/`
- [ ] Images appear with cropped faces: ✓
- [ ] Metadata in Firestore: ✓

---

**Status:** 🚀 Architecture redesigned, ready for implementation
