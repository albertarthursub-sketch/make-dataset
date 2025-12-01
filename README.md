# BINUS Facial Attendance System

A clean, simple facial attendance system for BINUS students. Students enter their Binusian ID, retrieve their data from the BINUS API, and capture face images using OpenCV with automatic Firebase storage.

## System Architecture

### Frontend (Next.js)
- **Enrollment Page**: Enter Binusian ID → Call BINUS API → Display student info
- **Capture Page**: Live camera → OpenCV face detection → Capture 3 angles → Upload to Firebase

### Backend (Flask + OpenCV)
- Face detection using Haar Cascade
- Face cropping and enhancement with CLAHE
- Firebase Cloud Storage upload
- Firestore metadata storage

## Key Features

✓ **API-Only Workflow** - No manual fallback
✓ **Live Face Detection** - OpenCV bounded box visualization
✓ **Multi-angle Capture** - Front, Left, Right positions
✓ **Flexible Image Management** - Delete/Retake any image
✓ **Beautiful UI** - Images lineup on left side during capture
✓ **Auto Upload** - Firebase storage with confirmation
✓ **Student Data** - Retrieved directly from BINUS API

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm/yarn
- Camera access
- BINUS API credentials
- Firebase credentials

### Backend Setup

```bash
cd make-dataset-1
pip install -r requirements.txt
```

Create `.env.local` with:
```
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_CLIENT_ID=...
FIREBASE_STORAGE_BUCKET=...
```

Run backend:
```bash
python facial_recognition_backend.py
```

Backend runs on: `http://localhost:5000`

### Frontend Setup

```bash
cd web-dataset-collector
npm install
```

Create `.env.local` with:
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_BINUS_API_URL=https://api.binus.ac.id
NEXT_PUBLIC_BINUS_API_KEY=...
```

Run frontend:
```bash
npm run dev
```

Frontend runs on: `http://localhost:3000`

## Usage

1. **Open browser**: http://localhost:3000
2. **Enter Binusian ID**: Input student ID number
3. **Retrieve Data**: Click "Retrieve Student Data" button
4. **View Student Info**: Name and class will be displayed
5. **Start Capture**: Click "Proceed to Capture"
6. **Capture Faces**: 
   - Allow camera access
   - Capture front face image
   - Capture left side image
   - Capture right side image
7. **Delete/Retake**: Click retake or delete on any image as needed
8. **Upload**: Click upload button
9. **Confirmation**: See success message

All images are automatically uploaded to Firebase during capture. Metadata is saved to Firestore.

## API Endpoints

### Student Lookup
```
POST /api/student/lookup
{
  "studentId": "2470006173"
}
```

### Process Image
```
POST /api/process-image
{
  "image": "base64_encoded",
  "studentId": "2470006173",
  "studentName": "John Doe",
  "className": "10A",
  "position": "front"  // or "left", "right"
}
```

### Upload Images
```
POST /api/upload-images
{
  "studentId": "2470006173",
  "studentName": "John Doe",
  "className": "10A",
  "images": {
    "front": "base64_encoded",
    "left": "base64_encoded",
    "right": "base64_encoded"
  }
}
```

## File Structure

```
make-dataset-1/
├── facial_recognition_backend.py    # Flask + OpenCV backend
├── .env.local                        # Firebase credentials
├── facial-attendance-binus-firebase-adminsdk.json
│
└── web-dataset-collector/
    ├── pages/
    │   ├── index.js                 # Main entry point
    │   ├── _app.js
    │   ├── _document.js
    │   └── api/
    │       ├── student/
    │       │   └── lookup.js        # BINUS API integration
    │       ├── process-image.js     # Image processing
    │       └── upload-images.js     # Upload confirmation
    ├── components/
    │   ├── EnrollmentPage.js        # Student enrollment
    │   └── CapturePage.js           # Face capture
    ├── styles/
    │   ├── globals.css              # Global styles
    │   ├── index.module.css
    │   ├── enrollment.module.css
    │   └── capture.module.css
    ├── .env.local
    ├── .env.example
    ├── package.json
    └── next.config.js
```

## Development Notes

### Face Detection Parameters
- **scaleFactor**: 1.1 (more sensitive than default 1.3)
- **minNeighbors**: 4 (allows more detections)
- **minSize**: 30x30 (detects smaller faces)

### Image Processing
- Resize to max 720p for faster processing
- Crop with 20% horizontal padding, 30% top padding
- CLAHE histogram equalization for contrast
- JPEG quality 85 for balance between quality and size

### Firebase Storage
- Path: `face_dataset/{studentName}/{studentId}_{position}_{timestamp}.jpg`
- Metadata stored in Firestore: `students/{studentId}/images/{docId}`

## Common Issues

**Camera not working**: Grant camera permissions in browser
**Face not detected**: Ensure good lighting and face is clearly visible
**API timeout**: Check BINUS API connection and availability
**Firebase error**: Verify .env.local credentials and Firebase project settings

## License

Internal use only - BINUS School
