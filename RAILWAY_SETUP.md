# Railway Deployment Setup Guide

## What is Railway?
Railway is a modern infrastructure platform that makes it easy to deploy Python applications. Perfect for hosting your Flask backend.

## Prerequisites
- [Railway account](https://railway.app) (free tier available)
- GitHub account (already have it)
- Your repository pushed to GitHub (already done ✓)

## Step 1: Create Railway Account & Project

1. Go to [railway.app](https://railway.app)
2. Click "Start New Project"
3. Select "Deploy from GitHub"
4. Authorize GitHub access
5. Select repository: `albertarthursub-sketch/make-dataset`
6. Click "Deploy Now"

## Step 2: Configure Environment Variables

In Railway dashboard → Project Settings → Variables, add:

```
FLASK_ENV=production
PORT=8000

# Firebase
FIREBASE_PROJECT_ID=facial-attendance-binus
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# BINUS API
BINUS_API_KEY=your-binus-sandbox-key
```

**To get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Copy the JSON values to Railway variables

## Step 3: Configure Build & Start Commands

Railway auto-detects Python and uses `requirements.txt`. The system will:

1. Install dependencies from `requirements.txt`
2. Run Flask using `Procfile` command
3. Expose on Railway's domain

**Procfile already configured:**
```
web: gunicorn -w 1 -b 0.0.0.0:$PORT facial_recognition_backend:app
```

This tells Railway:
- Use `gunicorn` web server (handles production traffic)
- Run `facial_recognition_backend.py` Flask app
- Listen on Railway's assigned PORT

## Step 4: Get Your Backend URL

After deployment completes:

1. Railway Dashboard → Select Project
2. Look for **Public URL** (something like `https://make-dataset-prod-7x9k.railway.app`)
3. Copy this URL

## Step 5: Update Vercel with Backend URL

1. Go to [vercel.com](https://vercel.com) → Your Project
2. Settings → Environment Variables
3. Add/Update: `NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.railway.app`
4. Redeploy or wait for automatic rebuild

## Step 6: Verify Deployment

### Test Backend Health
```bash
curl https://your-railway-url/api/health
```

Expected response:
```json
{"status": "ok"}
```

### Test from Frontend
1. Open your Vercel URL
2. Enter a student ID
3. Check browser console (F12) for API calls
4. Should see successful responses

## Architecture After Deployment

```
┌──────────────────────────┐
│ Vercel (Frontend)        │
│ https://your-app.vercel.app │
└────────────┬─────────────┘
             │ API calls
             ↓
┌──────────────────────────┐
│ Railway (Backend)        │
│ https://your-app-prod.railway.app │
│ - Flask app running      │
│ - Face detection         │
│ - Firebase uploads       │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│ Firebase                 │
│ - Storage (images)       │
│ - Firestore (metadata)   │
└──────────────────────────┘
```

## Monitoring & Logs

### View Logs
1. Railway Dashboard → Deployments
2. Click latest deployment
3. View real-time logs

### Monitor Usage
1. Railway Dashboard → Overview
2. See CPU, memory, network usage
3. Free tier limits: generous for this use case

## Deployment Details

### What's Running on Railway
- `facial_recognition_backend.py` - Flask app
- Port 8000 (Railway assigns dynamically)
- Gunicorn web server (handles requests)

### Environment
- Python 3.10+ (auto-detected from code)
- System dependencies (OpenCV, etc.) auto-installed by Nixpacks
- 512MB RAM (free tier) - enough for face detection

### Cold Starts
- First request after idle: ~10-20 seconds
- Subsequent requests: <1 second
- Railway doesn't auto-sleep like Heroku

## Troubleshooting

### "Application failed to start"
1. Check Railway logs for Python errors
2. Verify `facial_recognition_backend.py` runs locally:
   ```bash
   python facial_recognition_backend.py
   ```
3. Check `requirements.txt` has all dependencies

### "502 Bad Gateway"
1. Backend might be down - check Railway logs
2. Verify environment variables are set
3. Try redeploying: Railway Dashboard → Redeploy

### "Cannot connect from frontend"
1. Verify `NEXT_PUBLIC_BACKEND_URL` in Vercel
2. Check CORS in `facial_recognition_backend.py`:
   ```python
   CORS(app, origins=['https://your-vercel-url.vercel.app'])
   ```
3. Test backend URL directly in browser

### "Face detection timeout"
1. Increase Railway plan (free tier might be slow)
2. Or reduce image resolution before sending
3. Check backend logs for processing time

## Performance Optimization

### If face detection is slow:
1. Use `opencv-python-headless` instead of `opencv-python` (already in requirements.txt)
2. Reduce image size before sending to backend
3. Consider upgrading Railway plan

### If uploads are slow:
1. Compress images to JPEG (already done)
2. Use Firebase CDN (automatic)
3. Consider image optimization library

## Security Notes

- ✅ Environment variables stored securely on Railway
- ✅ No credentials in code or git
- ✅ HTTPS enforced by Railway
- ✅ Firebase Security Rules applied
- Set CORS origin to Vercel URL only in production

## Next Steps

1. **Deploy to Railway** (click "Deploy Now")
2. **Get Railway URL** from dashboard
3. **Update Vercel** with `NEXT_PUBLIC_BACKEND_URL`
4. **Test the full workflow** from Vercel URL
5. **Monitor logs** for issues

## Files Created for Railway

- `Procfile` - Tells Railway how to start Flask
- `requirements.txt` - Python dependencies
- `railway.json` - Railway configuration

All committed to GitHub, ready to deploy!

---

**Ready to go? Let's deploy!** 🚀
