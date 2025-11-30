# Firebase Integration Quick Start

## What Was Fixed

Your system had two issues:
1. ❌ **make_dataset.py** was NOT uploading to Firebase (only saving locally)
2. ❌ **Face bounding box cropping** wasn't being sent to Firebase

Both are now FIXED ✅

## What Changed

**make_dataset.py** now:
- ✅ Captures face images with bounding box
- ✅ Crops face region with 20px padding
- ✅ Resizes to 224x224 (high quality)
- ✅ Enhances with histogram equalization
- ✅ **NEW: Uploads to Firebase Storage immediately**
- ✅ Falls back to local-only if Firebase unavailable

## Get Started in 3 Steps

### Step 1: Start the Web Server
```bash
cd web-dataset-collector
npm run dev
```
You should see: `✓ Ready on http://localhost:3000`

### Step 2: Verify Configuration
```bash
# From the root directory
python verify_firebase_integration.py
```
This checks:
- ✅ Environment variables
- ✅ Web server connection
- ✅ Local storage
- ✅ Upload endpoint

### Step 3: Capture Images with Firebase Upload
```bash
python make_dataset.py
```

Follow the prompts:
1. Enter Binusian ID
2. Position yourself in front of camera
3. Press 'c' to capture images

**Real-time feedback:**
```
✅ Saved high-quality image 1/3 -> face_dataset/1A/John Doe/000.jpg
📤 Uploading to Firebase...
   ✅ Firebase upload successful: gs://bucket.../face_dataset/1A/John Doe/0_123456.jpg
```

## Architecture

```
CAMERA CAPTURE
    ↓
FACE DETECTION & BOUNDING BOX
    ↓
CROP (20px padding) + RESIZE (224x224)
    ↓
ENHANCE (histogram equalization)
    ↓
    ├──→ SAVE LOCALLY: face_dataset/<class>/<name>/<pos>.jpg
    └──→ UPLOAD TO FIREBASE
         ├─→ ON SUCCESS: gs://bucket/...
         └─→ ON FAILURE: Skip (images still saved locally)
```

## Check If It's Working

### In Your Code
Look at `make_dataset.py`:
- Line 12-62: New `upload_face_image_to_firebase()` function
- Line 165-185: Firebase upload call during capture

### In Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Storage** tab
4. Navigate to: `face_dataset/<class>/<name>/`
5. See your uploaded images with timestamps

### In Local Files
Check local saves:
```bash
ls -la face_dataset/<class>/<name>/
# Should see: 000.jpg, 001.jpg, 002.jpg
```

## If Firebase Upload Fails

### Problem: "Could not connect to upload API"
**Solution**: Start the web server
```bash
cd web-dataset-collector
npm run dev
```

### Problem: Firebase credential errors
**Solution**: Check `.env.local` in `web-dataset-collector/`
```bash
cd web-dataset-collector
cat .env.local

# Should contain:
# FIREBASE_PROJECT_ID=...
# FIREBASE_PRIVATE_KEY=...
# FIREBASE_CLIENT_EMAIL=...
# FIREBASE_STORAGE_BUCKET=...
```

### Problem: Images only in local storage
**Solution**: Manually sync from Firebase
```bash
python sync_firebase_dataset.py
```

## Key File Changes

**Modified**: `make_dataset.py`
- Added imports: `requests`, `base64`, `io`
- Added function: `upload_face_image_to_firebase()`
- Added Firebase upload call in capture loop
- Updated instructions to mention Firebase

**New files**:
- `verify_firebase_integration.py` - Verification script
- `FIREBASE_INTEGRATION_FIX.md` - Detailed documentation

## Important: Face Cropping Details

The system properly handles:
- ✅ **Bounding Box**: Detected face region
- ✅ **Padding**: 20px around bounding box for full face capture
- ✅ **Cropping**: Extracts only the face region
- ✅ **Resizing**: To consistent 224x224 size
- ✅ **Enhancement**: Histogram equalization + blending
- ✅ **Quality**: 95% JPEG quality
- ✅ **Upload**: With student metadata

## Environment Variables

Set in `.env.local` (optional, defaults shown):

```bash
# For make_dataset.py (optional)
UPLOAD_API_URL=http://localhost:3000/api/face/upload

# For web server (required for Firebase)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
```

## Testing Checklist

- [ ] Web server started (`npm run dev`)
- [ ] `verify_firebase_integration.py` passed
- [ ] `make_dataset.py` runs without errors
- [ ] Images appear locally in `face_dataset/`
- [ ] Images appear in Firebase Storage
- [ ] Firebase paths are correct: `face_dataset/<class>/<name>/`
- [ ] Metadata saved in Firestore (check console)

## Troubleshooting Commands

```bash
# Verify web server
curl http://localhost:3000/api/health

# Check local files
ls -la face_dataset/*/

# Download from Firebase
python sync_firebase_dataset.py --stats

# Run tests
python verify_firebase_integration.py

# Check logs
tail -f facial_recognition_security.log
```

## Next Steps

1. ✅ Verify Firebase integration is working
2. Run `python enroll_local.py` to create encodings
3. Run `python main.py` for facial recognition
4. Test recognition with newly enrolled faces

## Support

For detailed troubleshooting, see:
- `FIREBASE_INTEGRATION_FIX.md` - Comprehensive guide
- `verify_firebase_integration.py` - Automated tests
- Log files for errors

---

**Status**: Firebase integration is now active and ready to use! 🎉
