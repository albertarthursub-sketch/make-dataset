# Terminal Commands Reference

## Currently Running

### Terminal 1: Python Backend (Port 5000)
Status: ✅ RUNNING
```
Location: make-dataset-1/
Command: python facial_recognition_backend.py
URL: http://localhost:5000
```

### Terminal 2: Next.js Frontend (Port 3000)
Status: ✅ RUNNING
```
Location: make-dataset-1/web-dataset-collector/
Command: npm run dev
URL: http://localhost:3000
```

---

## To Stop & Restart

### Stop Backend
```powershell
# Stop the Python process (Ctrl+C in terminal)
# Or kill via PowerShell:
Get-Process python | Where-Object {$_.ProcessName -eq 'python'} | Stop-Process -Force
```

### Stop Frontend
```powershell
# Stop Next.js (Ctrl+C in terminal)
# Or kill via PowerShell:
Get-Process node | Stop-Process -Force
```

---

## To Restart Backend
```powershell
cd "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1"
python facial_recognition_backend.py
```

Expected output:
```
✓ Cascade classifier loaded
✓ Firebase initialized successfully
🚀 Starting Facial Recognition Backend API
Firebase: ✓ Initialized
Face Detection: ✓ Ready
 * Running on http://0.0.0.0:5000
```

---

## To Restart Frontend
```powershell
cd "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\web-dataset-collector"
npm run dev
```

Expected output:
```
> facial-attendance-web-collector@1.0.0 dev
> next dev

  ⚡ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 6.9s
```

---

## Test Commands

### Test Backend Health
```powershell
# In a new PowerShell terminal:
cd "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1"
python test_backend_health.py
```

Expected:
```
Testing backend health...
Status: 200
Response: {'status': 'ok', 'firebase': True, 'cascade': True, ...}
```

### Test Image Upload (Python)
```powershell
cd "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1"
python test_firebase_upload.py
```

This will:
1. Open your camera
2. Capture an image (press SPACE)
3. Upload to Firebase
4. Show success if complete

Expected output:
```
============================================================
✅ TEST COMPLETE - IMAGE UPLOADED SUCCESSFULLY
============================================================
```

---

## Setup Commands (Reference - Already Done)

### Install Python Dependencies
```powershell
cd "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1"
pip install -r backend_requirements.txt
```

### Install Node Dependencies
```powershell
cd "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\web-dataset-collector"
npm install
```

### Rebuild npm (if needed)
```powershell
cd "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\web-dataset-collector"
npm install
npm cache clean --force
npm install
```

---

## File Locations

### Root Project
```
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\
├── .env (Firebase credentials)
├── facial_recognition_backend.py (Python backend)
├── backend_requirements.txt (Python deps)
├── test_firebase_upload.py (Test script)
└── web-dataset-collector/
    ├── .env.local (Frontend config)
    ├── pages/
    │   └── index.js (Main page - UPDATED)
    ├── components/
    │   └── CaptureStepSimple.js (NEW component)
    └── package.json (UPDATED - removed TensorFlow)
```

---

## Environment Variables

### `.env` (Backend - root directory)
```
FIREBASE_PROJECT_ID=facial-attendance-binus
FIREBASE_PRIVATE_KEY_ID=8fa52216a8de274cdc40cb79c6f7f35716b5447b
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@facial-attendance-binus.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=118214808910192528173
FIREBASE_STORAGE_BUCKET=facial-attendance-binus.firebasestorage.app
API_KEY=OUQyQjdEN0EtREFDQy00QkEyLTg3QTAtNUFGNDVDOUZCRTgy
```

### `.env.local` (Frontend - web-dataset-collector/)
```
FIREBASE_PROJECT_ID=facial-attendance-binus
FIREBASE_PRIVATE_KEY_ID=8fa52216a8de274cdc40cb79c6f7f35716b5447b
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@facial-attendance-binus.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=118214808910192528173
FIREBASE_STORAGE_BUCKET=facial-attendance-binus.firebasestorage.app
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
API_KEY=OUQyQjdEN0EtREFDQy00QkEyLTg3QTAtNUFGNDVDOUZCRTgy
```

---

## Port Information

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Python Backend | 5000 | http://localhost:5000 | ✓ Running |
| Next.js Frontend | 3000 | http://localhost:3000 | ✓ Running |
| Firebase | N/A | https://console.firebase.google.com | ✓ Configured |

---

## Key Directories

```powershell
# Backend
cd c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1

# Frontend
cd c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\web-dataset-collector

# Project root
cd c:\Users\albert.arthur\Downloads\Portfolio
```

---

## Quick Start (Complete Setup from Scratch)

If you need to redo everything:

```powershell
# 1. Navigate to project
cd "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1"

# 2. Install Python dependencies
pip install -r backend_requirements.txt

# 3. Start Backend (Terminal 1)
python facial_recognition_backend.py

# 4. In new terminal, go to frontend
cd "c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\web-dataset-collector"

# 5. Install Node dependencies
npm install

# 6. Start Frontend (Terminal 2)
npm run dev

# 7. Open browser
# http://localhost:3000
```

---

## Debugging

### Check if ports are in use
```powershell
# Check port 5000
netstat -ano | findstr :5000

# Check port 3000
netstat -ano | findstr :3000

# Kill process on port 5000
# Get PID from above, then:
taskkill /PID <PID> /F
```

### Check Python version
```powershell
python --version
# Should be 3.8+
```

### Check Node version
```powershell
node --version
npm --version
```

### Clear npm cache
```powershell
npm cache clean --force
```

### Check if packages installed
```powershell
# Backend
pip list | findstr -i flask

# Frontend
npm list next
```

---

## Logs to Monitor

### Backend Logs (Console 1)
```
Watch for:
✓ Firebase initialized successfully
✓ Face Detection: ✓ Ready
 * Running on http://0.0.0.0:5000
```

### Frontend Logs (Console 2)
```
Watch for:
✓ Ready in Xs
```

### Browser Console (F12)
```
Watch for:
✓ Camera ready
⏳ Processing image
✅ Image captured
```

---

## Common Issues & Fixes

### "Module not found: flask"
```powershell
pip install -r backend_requirements.txt
```

### "next not found"
```powershell
cd web-dataset-collector
npm install
```

### "Port already in use"
```powershell
# Kill Python
Get-Process python | Stop-Process -Force

# Kill Node
Get-Process node | Stop-Process -Force

# Restart normally
```

### "Cannot connect to localhost:5000"
1. Check backend is running
2. Check `.env` exists in root
3. Check Firebase credentials are correct
4. Restart backend

### "Cannot connect to localhost:3000"
1. Check frontend is running
2. Check you're in `web-dataset-collector` directory
3. Check `npm run dev` completed successfully
4. Restart frontend

---

## All File Locations

```powershell
# Main files
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\.env
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\facial_recognition_backend.py
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\backend_requirements.txt
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\test_firebase_upload.py
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\test_backend_health.py

# Frontend files
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\web-dataset-collector\.env.local
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\web-dataset-collector\pages\index.js
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\web-dataset-collector\components\CaptureStepSimple.js
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\web-dataset-collector\package.json

# Documentation
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\START_HERE.md
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\FRESH_ARCH_COMPLETE.md
c:\Users\albert.arthur\Downloads\Portfolio\make-dataset-1\FRESH_ARCHITECTURE_GUIDE.md
```

---

**Ready to start? Open Terminal 1 and run:**
```
python facial_recognition_backend.py
```

Then open Terminal 2 and run:
```
cd web-dataset-collector && npm run dev
```

Then open: **http://localhost:3000**

🚀 Let's go!
