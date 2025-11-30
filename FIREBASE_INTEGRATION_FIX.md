# Firebase Integration Fix - Make Dataset

## Problem Summary
The `make_dataset.py` script was only saving face images locally and not uploading them to Firebase Storage. Additionally, the face bounding box cropping needed to be integrated with Firebase uploads.

## Solutions Implemented

### 1. **Firebase Upload Integration**
Added a new function `upload_face_image_to_firebase()` that:
- Takes the enhanced face image (224x224 with histogram equalization)
- Converts it to JPEG format with 95% quality
- Sends it to the web API endpoint (`/api/face/upload`)
- Includes student metadata (ID, name, class, position)

### 2. **Face Bounding Box Cropping (Already Working)**
The cropping process was already correctly implemented:
- ✅ Detected face region with padding (20px)
- ✅ Cropped to face region
- ✅ Resized to 224x224 with cubic interpolation
- ✅ Enhanced with histogram equalization
- ✅ Blended original and enhanced for quality
- ✅ NOW: Uploaded to Firebase immediately after local save

### 3. **Image Enhancement Pipeline**
The face image enhancement process:
```
Raw Face Crop → Resize (224x224) → Histogram Equalization → Blend → Firebase Upload
                                        ↓
                                    Local Save
                                        ↓
                                    Firebase Upload
```

## How It Works Now

### Capture Flow
1. **Camera captures frame** → Face detection
2. **Quality assessment** → Best face selection
3. **Bounding box extraction** → With 20px padding
4. **Image processing**:
   - Resize to 224x224 (high quality)
   - Apply histogram equalization for contrast
   - Blend with original for natural look
5. **Dual storage**:
   - Save locally: `face_dataset/<class>/<name>/<position>.jpg`
   - Upload to Firebase: `face_dataset/<class>/<name>/<position>_<timestamp>.jpg`

### Upload Details
- **Endpoint**: `http://localhost:3000/api/face/upload` (configurable via `UPLOAD_API_URL` env var)
- **Method**: POST multipart/form-data
- **Fields**:
  - `image`: JPEG binary data
  - `studentId`: Binusian ID
  - `studentName`: Full name
  - `className`: Homeroom/class
  - `position`: Image position number (0, 1, 2, etc.)
- **Quality**: 95% JPEG quality for storage efficiency
- **Fallback**: If Firebase unavailable, continues with local save only

## Environment Configuration

### For Make Dataset to Upload
Ensure you have in `.env.local`:
```
# Optional - defaults to localhost if not set
UPLOAD_API_URL=http://localhost:3000/api/face/upload
```

### For Web API Firebase Connection
Ensure your `.env.local` in `web-dataset-collector/` has:
```
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_STORAGE_BUCKET=your-bucket.appspot.com
```

## Testing the Integration

### Prerequisites
```bash
# 1. Install web dependencies
cd web-dataset-collector
npm install

# 2. Make sure Node modules are installed
npm ls
```

### Step-by-Step Test

**Terminal 1 - Start Web Server:**
```bash
cd web-dataset-collector
npm run dev
# Should output: ✓ Ready on http://localhost:3000
```

**Terminal 2 - Run Make Dataset:**
```bash
python make_dataset.py
# Enter Binusian ID when prompted
# When camera opens, follow the prompts to capture images
```

### Expected Output

When uploading successfully:
```
📸 Saved high-quality image 1/3 -> face_dataset/1A/John Doe/000.jpg
   Quality score: 180.5, Position: 2_3
📤 Uploading to Firebase...
   📤 Uploading to Firebase: http://localhost:3000/api/face/upload
      Student: John Doe (12345)
      Class: 1A, Position: 0
   ✅ Firebase upload successful: gs://bucket-name/face_dataset/1A/John Doe/0_1729456789.jpg
```

When Firebase unavailable (graceful fallback):
```
📸 Saved high-quality image 1/3 -> face_dataset/1A/John Doe/000.jpg
📤 Uploading to Firebase...
   ⚠️ Could not connect to upload API at http://localhost:3000/api/face/upload
      Make sure the web server is running (npm run dev or similar)
   ℹ️ Image saved locally at face_dataset/1A/John Doe/000.jpg
```

## Troubleshooting

### Issue 1: "Could not connect to upload API"
**Cause**: Web server not running or wrong URL
**Solution**:
```bash
# Terminal 1 - Start web server
cd web-dataset-collector
npm run dev

# Verify it's running:
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}
```

### Issue 2: Firebase upload fails with auth error
**Cause**: Firebase credentials missing or invalid
**Solution**:
```bash
# Check .env.local in web-dataset-collector/
cat .env.local

# Verify all required fields are present:
# - FIREBASE_PROJECT_ID
# - FIREBASE_PRIVATE_KEY (with proper newlines)
# - FIREBASE_CLIENT_EMAIL
# - FIREBASE_STORAGE_BUCKET
```

### Issue 3: Images only saved locally, not in Firebase
**Causes**:
- Web server not running → Start with `npm run dev`
- Firebase credentials invalid → Check `.env.local`
- Wrong bucket name → Verify `FIREBASE_STORAGE_BUCKET`
- Network connectivity → Check firewall/network

**Debug**:
```bash
# 1. Check web server logs
npm run dev  # Look for errors in output

# 2. Check uploaded files in Firebase Console
# Navigate to Storage tab and look for face_dataset/ folder

# 3. Manually test upload endpoint
curl -X POST http://localhost:3000/api/face/upload \
  -F "studentId=12345" \
  -F "studentName=John" \
  -F "className=1A" \
  -F "position=0" \
  -F "image=@test_face.jpg"
```

### Issue 4: Images uploaded but with wrong structure
**Check**: Firebase Storage console should show:
```
gs://bucket/face_dataset/
  └── 1A/
      └── John Doe/
          ├── 0_1729456789.jpg
          ├── 1_1729456790.jpg
          └── 2_1729456791.jpg
```

If structure is wrong, check the `/api/face/upload` endpoint implementation.

## Local Sync from Firebase

If images are in Firebase but not local, download them:

```bash
python sync_firebase_dataset.py

# With stats:
python sync_firebase_dataset.py --stats

# With deletion after sync:
python sync_firebase_dataset.py --delete-after-sync
```

## Next Steps

1. **Verify Local Saves**: `face_dataset/<class>/<name>/` folder has images
2. **Check Firebase Console**: Images appear in Storage with correct structure
3. **Run Enrollment**: `python enroll_local.py` to create encodings
4. **Test Recognition**: `python main.py` to test facial recognition
5. **Monitor**: Check both local and Firebase copies exist for redundancy

## Performance Notes

- **Upload speed**: ~2-5 seconds per image (depends on network)
- **Image size**: ~15-25KB per JPEG at quality 95%
- **Timeout**: 30 seconds per upload
- **Fallback**: Local save completes even if Firebase unavailable

## Architecture Diagram

```
Camera Frame
    ↓
Face Detection & Cropping (20px padding)
    ↓
Resize to 224x224 (INTER_CUBIC)
    ↓
Histogram Equalization + Blend
    ↓
    ├─→ Save Locally: face_dataset/<class>/<name>/<pos>.jpg
    └─→ Upload to Firebase
         ├─→ SUCCESS: gs://bucket/face_dataset/<class>/<name>/<pos>_<ts>.jpg
         └─→ FAILURE: Continue with local only (logged)
```

## Key Files Modified

- **make_dataset.py**: Added `upload_face_image_to_firebase()` function and integrated Firebase calls
- **Integration Point**: After local save in the capture loop

## Fallback Behavior

The system is designed for resilience:
1. ✅ Always saves locally first
2. ✅ Attempts Firebase upload
3. ✅ On failure: Logs error, continues
4. ✅ Manual sync available via `sync_firebase_dataset.py`

This ensures you never lose captured data, even if Firebase is temporarily unavailable.
