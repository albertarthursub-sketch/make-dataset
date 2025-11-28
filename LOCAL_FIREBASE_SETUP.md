# Running Locally with Firebase Storage

## Overview
Your facial attendance system is configured to run **locally on your machine** while storing all data in **Firebase Cloud Storage** (not deployed to Vercel).

## Current Setup

### 🖥️ Local Development
- **App URL**: http://localhost:3003 (or 3000/3001/3002 if ports are busy)
- **Framework**: Next.js 14.2.33 with Node.js
- **Server**: Running locally, handles student info, image capture, and uploads

### ☁️ Cloud Storage
- **Firebase Project**: `facial-attendance-binus`
- **Storage Bucket**: `facial-attendance-binus.firebasestorage.app`
- **Database**: Firestore (optional metadata storage)
- **Authentication**: Service Account (Firebase Admin SDK)

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    Your Computer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js Dev Server (http://localhost:3003)          │   │
│  │  ├─ Student Info Entry Form                          │   │
│  │  ├─ Camera/File Upload Interface                     │   │
│  │  ├─ API Routes                                       │   │
│  │  │  ├─ /api/student/lookup (Binus School API)       │   │
│  │  │  ├─ /api/face/upload → Firebase Storage          │   │
│  │  │  └─ /api/student/metadata → Firestore            │   │
│  │  └─ Local Fallback Storage (/public/uploads/)       │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓↓↓                                   │
│                  Internet Connection                          │
│                         ↓↓↓                                   │
└─────────────────────────────────────────────────────────────┘
                         ↓↓↓
        ☁️ FIREBASE (Google Cloud)
        ├─ Storage Bucket (Images)
        ├─ Firestore (Metadata)
        └─ Service Account Auth (Credentials in .env.local)
```

## Getting Started

### Step 1: Start the Development Server
```bash
cd /home/pandora/facial-attendance-v2/web-dataset-collector
npm run dev
```

The server will start on the first available port (3000, 3001, 3002, 3003, etc.)
Look for: `Local: http://localhost:XXXX`

### Step 2: Access the App
Open your browser and go to: **http://localhost:3003** (or whatever port shows)

### Step 3: Use the App

1. **Enter Student Info**
   - Student ID: (from Binus School system)
   - Name: Student name
   - Class: Homeroom class
   - Click "Next"

2. **Upload Images**
   - Option A: Use camera (if available)
   - Option B: Click file upload area to select 3 image files
   - Images show in preview grid

3. **Upload to Firebase**
   - Click "Upload Images"
   - Images are stored in Firebase Storage
   - Metadata saved to Firestore (optional)
   - Fallback: If Firebase unavailable, saves to `/public/uploads/`

## Firebase Integration Details

### What Gets Uploaded to Firebase?

**Storage Structure:**
```
gs://facial-attendance-binus.firebasestorage.app/
├─ face_dataset/
│  └─ {CLASS}/
│     └─ {STUDENT_NAME}/
│        ├─ capture_1_1704067200000.jpg
│        ├─ capture_2_1704067201000.jpg
│        └─ capture_3_1704067202000.jpg
```

**Firestore Structure (Optional):**
```
Firestore/
├─ students/
│  └─ {STUDENT_ID}/
│     ├─ (metadata fields)
│     └─ images/
│        ├─ doc1: {fileName, fileSize, uploadedAt, storageUrl}
│        ├─ doc2: {...}
│        └─ doc3: {...}
```

### Authentication
Your `.env.local` contains Firebase Admin SDK credentials:
- **Service Account Email**: `firebase-adminsdk-fbsvc@facial-attendance-binus.iam.gserviceaccount.com`
- **Private Key**: Used to authenticate API requests
- **Permissions**: Storage Admin + Firestore Writer roles

## Multi-Station Setup

You can run this app on **multiple computers/stations**:

1. **Station 1 (Admin PC)**
   ```bash
   cd /home/pandora/facial-attendance-v2/web-dataset-collector
   npm run dev
   # Visit http://localhost:3003
   ```

2. **Station 2 (Photo Booth A)**
   ```bash
   # Copy project to Station 2
   git clone <repo>
   cd web-dataset-collector
   npm install
   npm run dev
   # Visit http://localhost:3003
   ```

3. **Station 3 (Photo Booth B)**
   - Same setup as Station 2
   - All stations upload to **same Firebase Storage**
   - All data synchronized in cloud

## Key Files

| File | Purpose |
|------|---------|
| `web-dataset-collector/pages/index.js` | Main UI (student info → capture → upload) |
| `web-dataset-collector/pages/api/face/upload.js` | Handles Firebase Storage uploads |
| `web-dataset-collector/lib/firebase-admin.js` | Centralized Firebase initialization |
| `web-dataset-collector/.env.local` | Firebase credentials |
| `.env` | Binus School API key |

## Troubleshooting

### Issue: "Firebase bucket does not exist"
**Solution**: Verify bucket name in `.env.local`
```env
FIREBASE_STORAGE_BUCKET=facial-attendance-binus.firebasestorage.app
```

### Issue: "Upload failed (500 error)"
**Solution**: Check server logs
```bash
tail -50 /tmp/dev-server.log | grep -i firebase
```

### Issue: "No camera detected"
**Solution**: Use file upload alternative (already built in)
- Click the dashed box that says "Or click to upload image files"
- Select 3 JPG/PNG files from your computer

### Issue: Images only saving locally, not in Firebase
**Check**:
1. Is Firebase bucket accessible? (Check IAM permissions)
2. Are credentials correct in `.env.local`?
3. Server will automatically fallback to local storage (`/public/uploads/`)

## Local Storage Fallback

If Firebase is unavailable, images automatically save to:
```
/home/pandora/facial-attendance-v2/web-dataset-collector/public/uploads/
├─ {CLASS}/
│  └─ {STUDENT_NAME}/
│     ├─ capture_1_*.jpg
│     ├─ capture_2_*.jpg
│     └─ capture_3_*.jpg
```

You can manually upload these later or they persist for local access.

## Accessing Firebase Data

### Via Firebase Console
- Go to: https://console.firebase.google.com/
- Project: `facial-attendance-binus`
- Storage: View all uploaded images
- Firestore: View student metadata

### Via Command Line (if gsutil installed)
```bash
gsutil ls gs://facial-attendance-binus.firebasestorage.app/face_dataset/
gsutil ls gs://facial-attendance-binus.firebasestorage.app/face_dataset/4C/
gsutil cp gs://facial-attendance-binus.firebasestorage.app/face_dataset/4C/StudentName/img.jpg ./
```

## Summary

✅ **Runs Locally**: Development server on your machine (http://localhost:3003)
✅ **Stores in Firebase**: All images in Firebase Storage bucket
✅ **Multi-Station Ready**: Multiple machines can upload to same cloud storage
✅ **No Deployment Needed**: Works without Vercel or any cloud hosting
✅ **Automatic Fallback**: Local storage if Firebase unavailable
✅ **Zero Cost**: Using existing Firebase project

You now have a **complete local + cloud hybrid solution** perfect for multi-station photo capture systems!
