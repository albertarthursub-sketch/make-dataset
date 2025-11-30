# Implementation Checklist - Fresh Architecture

## ✅ Completed

- [x] Python backend created (`facial_recognition_backend.py`)
  - Face detection with OpenCV Haar Cascade
  - Face cropping and enhancement
  - Firebase integration
  - Bounding box visualization
  - API endpoints ready

- [x] Frontend component created (`CaptureStepSimple.js`)
  - Simple camera capture (no TensorFlow.js)
  - Backend integration
  - Image preview
  - Progress tracking

- [x] Configuration files
  - `backend_requirements.txt` (Python dependencies)
  - `.env` (Firebase credentials - already set with correct bucket)
  - `.env.local` (Frontend config - already set)

- [x] Documentation
  - `FRESH_ARCHITECTURE_GUIDE.md` (complete setup & usage)
  - API endpoints documented
  - Troubleshooting guide

## ⚠️ TODO - Implementation Steps

### Step 1: Install Backend Dependencies
```bash
cd c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1
pip install -r backend_requirements.txt
```
**Time:** ~2 minutes
**Check:** `pip list | findstr flask`

---

### Step 2: Start Python Backend
```bash
python facial_recognition_backend.py
```
**Expected Output:**
```
🚀 Starting Facial Recognition Backend API
Firebase: ✓ Initialized
Face Detection: ✓ Ready
 * Running on http://0.0.0.0:5000
```
**Keep this terminal open**

---

### Step 3: Test Backend Health
In new PowerShell terminal:
```bash
curl http://localhost:5000/api/health
```
**Expected:** JSON response with `"status": "ok"`

---

### Step 4: Update Frontend Component (pages/index.js)

Find the CaptureStep section around line 165-167 and replace with:

**Current:**
```javascript
{step === 'capture' && (
  <CaptureStep
    studentId={studentId}
    ...
  />
)}
```

**New:**
```javascript
import CaptureStepSimple from '../components/CaptureStepSimple';

// Then in render:
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

---

### Step 5: Update Frontend .env.local

Add/update this line in `web-dataset-collector/.env.local`:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

**Already added:** ✓

---

### Step 6: Start Frontend
In new PowerShell terminal:
```bash
cd web-dataset-collector
npm run dev
```
**Expected:** "compiled successfully" message

---

### Step 7: Test Full Stack

1. Open http://localhost:3000
2. Enter Student ID (e.g., 2401234567)
3. Click "Lookup Student Info"
4. Click "Continue to Capture"
5. Position face to camera
6. Click "📸 Capture Image"
7. **Verify:**
   - [ ] Image processes (~2 seconds)
   - [ ] Bounding box preview shows
   - [ ] Progress updates to 1/3
   - [ ] Message shows "✓ Face detected & cropped"
8. Capture 2 more images from different angles
9. Click "Continue to Upload"
10. Check Firebase Console:
    - [ ] Images in `gs://facial-attendance-binus.firebasestorage.app/face_dataset/`
    - [ ] Cropped faces (not full camera image)
    - [ ] Metadata in Firestore under `students` collection

---

### Step 8: Verify Firebase Upload

Go to Firebase Console:
1. https://console.firebase.google.com/
2. Select "facial-attendance-binus" project
3. Go to **Storage** → **face_dataset**
4. Should see folders like: `John Doe/`, `Jane Smith/`, etc.
5. Each folder has images: `1234567_front_20251130_042301.jpg`
6. Click image → Should see cropped face (~224×224)
7. Go to **Firestore** → **students** collection
8. Should see documents with metadata

---

### Step 9: Remove Old TensorFlow Dependencies (Optional)

Once everything works, you can remove TensorFlow.js from `package.json` since backend handles face detection:

```bash
cd web-dataset-collector
npm uninstall @tensorflow/tfjs @tensorflow-models/face-detection
```

Update `package.json` and run `npm install`

---

### Step 10: Deploy Backend (Future)

When ready to deploy:
1. Choose Python hosting (Heroku, Railway, PythonAnywhere, etc.)
2. Deploy `facial_recognition_backend.py` with requirements.txt
3. Get public URL: `https://your-backend.example.com`
4. Update Vercel `NEXT_PUBLIC_BACKEND_URL` env var
5. Redeploy Next.js to Vercel

---

## Testing Scripts

### Test 1: Backend API Only
```bash
cd c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1
python test_firebase_upload.py
```
**Result:** Image uploads successfully to Firebase

---

### Test 2: Backend Face Detection
Create `test_face_detection.py`:
```python
import requests
import base64

# Start with existing test image
with open('test_capture.jpg', 'rb') as f:
    image_data = base64.b64encode(f.read()).decode()

response = requests.post('http://localhost:5000/api/process-image', json={
    'image': f'data:image/jpeg;base64,{image_data}',
    'studentId': 'TEST001',
    'studentName': 'Test Student',
    'className': '10A',
    'position': 'front'
})

print(response.json())
```

---

## Troubleshooting

### Issue: "Module not found: flask"
```
pip install -r backend_requirements.txt
```

### Issue: "Address already in use" (port 5000)
```bash
# Kill process on port 5000
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process
```

### Issue: "CORS error - cannot reach backend"
- Backend must be running: `python facial_recognition_backend.py`
- Check `NEXT_PUBLIC_BACKEND_URL` in `.env.local`
- Check backend port is 5000

### Issue: "No faces detected"
- Ensure good lighting
- Face must be centered and clear
- Try from different angle
- Check image is in JPEG format

### Issue: Firebase upload fails
- Check `.env` has all Firebase credentials
- Verify `FIREBASE_STORAGE_BUCKET=facial-attendance-binus.firebasestorage.app`
- Check Firebase project allows uploads (rules)

---

## Success Criteria

✅ All checks pass:
1. Backend health check: `curl http://localhost:5000/api/health` → 200 OK
2. Frontend loads: http://localhost:3000 → Shows login page
3. Student lookup works: Enter ID → Auto-fills name & class
4. Image capture works: Camera shows → Click capture → Processes
5. Face detection works: Bounding box appears → Shows preview
6. Firebase upload works: Images appear in Storage & Firestore
7. Full workflow: 3 images → Upload → Success message

---

## Estimated Timeline

| Step | Time | Status |
|------|------|--------|
| Install backend deps | 2 min | Ready |
| Start backend | 1 min | Ready |
| Test backend | 2 min | Ready |
| Update frontend component | 5 min | Ready |
| Start frontend | 2 min | Ready |
| Test full stack | 10 min | Ready |
| Verify Firebase | 5 min | Ready |
| **Total** | **27 min** | ✅ Ready to start |

---

## Questions?

Refer to:
1. `FRESH_ARCHITECTURE_GUIDE.md` - Full documentation
2. `FIREBASE_UPLOAD_FIX.md` - Firebase bucket configuration
3. Backend logs - Check console for detailed error messages
4. Frontend console - Check browser developer tools (F12)

**Ready to proceed? Let's go! 🚀**
