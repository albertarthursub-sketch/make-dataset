# 🎬 Getting Started with Facial Attendance System

This guide walks you through the complete process from setup to deployment.

## 🔍 What You Have

You have a **complete facial attendance system** with:

1. **Main System** (Python - Local)
   - Face detection & recognition
   - Real-time attendance logging
   - API integration

2. **Web Dataset Collector** (Node.js - Vercel) - ⭐ NEW!
   - Students capture face images from anywhere
   - Auto-upload to Firebase
   - Simple browser interface

3. **Helper Scripts** (Python)
   - Firebase sync
   - Enrollment
   - Metrics

## 🎯 Your Goal

Get students to **capture face images** for the attendance system to learn and recognize them.

**Old way**: Run `make_dataset.py` at specific locations ❌
**New way**: Use web collector - students self-service online ✅

## 📋 Pre-Requirements

### You Need
- [ ] **Binus API Key** (You already have: `API_KEY=OUQyQjdE...` in .env)
- [ ] **Firebase Account** (Google account - free tier available)
- [ ] **Vercel Account** (GitHub or email signup - free)
- [ ] **Node.js** (v16+) installed locally

### Students Need
- [ ] Web browser (Chrome, Firefox, Safari)
- [ ] Webcam or phone camera
- [ ] Internet connection
- [ ] URL you give them

## 🚀 Step-by-Step Setup

### Phase 1: Firebase Setup (5 minutes)

1. **Create Firebase Project**
   - Go to https://console.firebase.google.com
   - Click "Add project"
   - Name it: `binus-facial-attendance`
   - Click "Create project"

2. **Enable Storage**
   - In sidebar, click "Storage"
   - Click "Create bucket"
   - Choose location near you
   - Click "Create"

3. **Get Service Account Credentials**
   - Click ⚙️ (Settings) → "Project settings"
   - Click "Service accounts" tab
   - Click "Generate new private key"
   - Copy the entire JSON (save somewhere safe!)

4. **Extract Credentials**
   ```json
   {
     "type": "service_account",
     "project_id": "YOUR_PROJECT_ID",
     "private_key": "YOUR_PRIVATE_KEY",
     "client_email": "YOUR_EMAIL@appspot.gserviceaccount.com",
     ...
   }
   ```

### Phase 2: Configure Web Collector (5 minutes)

1. **Edit environment file**
   ```bash
   cd web-dataset-collector
   cp .env.example .env.local
   ```

2. **Fill in .env.local**
   ```env
   # From your existing system
   API_KEY=OUQyQjdE... (copy from parent .env)
   
   # From Firebase step above
   FIREBASE_PROJECT_ID=binus-facial-attendance
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@appspot.gserviceaccount.com
   FIREBASE_STORAGE_BUCKET=binus-facial-attendance.appspot.com
   ```

3. **Test Locally**
   ```bash
   npm install
   npm run dev
   # Open http://localhost:3000
   ```

   ✅ Should see:
   - Student form
   - Camera request when capturing
   - Images preview
   - Upload button

### Phase 3: Deploy to Vercel (5 minutes)

**Option A: Using CLI**
```bash
npm install -g vercel
vercel
# Follow prompts, add environment variables
```

**Option B: Using GitHub**
1. Push web-dataset-collector to GitHub
2. Go to vercel.com
3. Click "New Project"
4. Import from GitHub
5. Add environment variables
6. Deploy

**Result**: You get a URL like:
```
https://facial-collector-123abc.vercel.app
```

### Phase 4: Share with Students (1 minute)

Send them:
```
📸 Please capture your face for attendance system:
   https://facial-collector-123abc.vercel.app
   
Steps:
   1. Enter your Binusian ID
   2. Enter your full name
   3. Enter your class (1A, 2B, etc)
   4. Allow camera access
   5. Click capture 3-5 times from different angles
   6. Click upload
   
Takes ~5 minutes!
```

## 📸 Student Usage Flow

```
Student opens URL
       ↓
[Enter ID, Name, Class]
       ↓
[Click Continue]
       ↓
[Browser asks for camera]
       ↓
[Allow camera access]
       ↓
[Click "Capture" 3-5 times]
       ↓
[Click "Upload"]
       ↓
[Success! Images in Firebase]
       ↓
✅ Done!
```

## 💻 Processing Images (After Collection)

After students upload images (takes 1-7 days depending on your schedule):

### Step 1: Download Images

```bash
# In parent directory
python3 sync_firebase_dataset.py
```

This downloads all images to `face_dataset/` organized by class and student name.

### Step 2: Organize Locally

```bash
# Images are already organized, but verify
python3 make_dataset.py
# Follow prompts if you need to reorganize
```

### Step 3: Generate Face Encodings

```bash
python3 enroll_local.py
# This creates encodings.pickle
```

### Step 4: Test Attendance System

```bash
python3 main.py
# System will recognize students in real-time
```

## 📊 Monitoring

### Check Upload Progress

```bash
# Check Firebase storage statistics
python3 sync_firebase_dataset.py --stats
```

Output:
```
Firebase Storage Statistics
Total files: 450
Total size: 1.2 GB
Classes: 12

By Class:
  📁 1A
     Files: 45
     Size: 120.5 MB
  📁 2B
     Files: 42
     Size: 112.3 MB
  ...
```

### Check Vercel Logs

1. Go to vercel.com/dashboard
2. Click your deployment
3. Click "Deployments"
4. See real-time logs of uploads

## 🎨 Customization (Optional)

Want to change the interface?

### Change Colors

Edit `web-dataset-collector/styles/index.module.css`:
```css
/* Line 1: Change from purple gradient */
.container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change to your colors */
}
```

### Add More Form Fields

Edit `web-dataset-collector/pages/index.js`:
```jsx
<div className={styles.form_group}>
  <label>New Field</label>
  <input type="text" onChange={...} />
</div>
```

### Change Number of Images

Edit `web-dataset-collector/pages/index.js`:
```javascript
const TARGET_IMAGES = 5; // Change to 3, 7, 10, etc
```

## 🔒 Security Setup

### Firebase Storage Rules

Update rules to be more restrictive (optional):

1. Go to Firebase Console → Storage → Rules
2. Replace with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /face_dataset/{class}/{student}/{filename} {
      // Only authenticated admin can upload
      allow write: if request.auth != null;
      // Public read (optional, for team)
      allow read: if true;
    }
    // Block everything else
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## 🐛 Troubleshooting

### "Camera doesn't work"
- Make sure you're using HTTPS (Vercel provides this)
- Update your browser
- Try a different browser

### "Upload fails"
- Check internet connection
- Verify Firebase credentials
- Check browser console for errors

### "API lookup returns wrong info"
- Verify API_KEY is correct
- Check API endpoint

### "No images in Firebase"
- Check if uploads actually completed
- Go to Firebase Console → Storage → Browse

## 📈 Timeline

### Day 1-2: Setup
- [ ] Create Firebase project
- [ ] Deploy web collector
- [ ] Test with yourself

### Day 3-7: Collection
- [ ] Share link with students
- [ ] Promote participation
- [ ] Monitor progress

### Day 8: Processing
- [ ] Download images
- [ ] Run enrollment
- [ ] Test recognition

### Day 9+: Operation
- [ ] Run attendance system
- [ ] Monitor accuracy
- [ ] Fix any issues

## 💡 Tips for Success

1. **Start Small**: Test with 1-2 students first
2. **Good Lighting**: Remind students about lighting when capturing
3. **Mobile Friendly**: Test on phones too
4. **Multiple Angles**: Encourage capturing from different angles
5. **Backup**: Download images regularly
6. **Monitor**: Check upload progress daily

## 📞 Quick Links

- **Firebase**: https://console.firebase.google.com
- **Vercel**: https://vercel.com
- **GitHub**: https://github.com/BINUS-Simprug-AI-Club/facial-attendance-v2

## 📚 Detailed Docs

- Setup issues? → `web-dataset-collector/QUICKSTART.md`
- Deployment help? → `web-dataset-collector/DEPLOYMENT_CHECKLIST.md`
- Integration details? → `web-dataset-collector/INTEGRATION.md`
- System overview? → `SYSTEM_SUMMARY.md`

## ✅ Checklist

After following this guide, you should have:

- [ ] Firebase project created
- [ ] Web collector deployed to Vercel
- [ ] URL shared with students
- [ ] Images uploading to Firebase
- [ ] Download script working
- [ ] Enrollment complete
- [ ] System recognizing students

## 🎓 Next: Advanced

Once basic system works, you can:

1. **Auto-download**: Schedule `sync_firebase_dataset.py` to run daily
2. **Email notifications**: Get alerts when students upload
3. **Dashboard**: Build admin panel to track progress
4. **Retraining**: Add new students without full re-enrollment
5. **Analytics**: Track attendance patterns

## 🎉 You're Ready!

You now have a **modern, scalable facial attendance system** that:
- ✅ Works anywhere on any device
- ✅ Scales to 1000s of students
- ✅ Integrates with existing Python system
- ✅ Uses enterprise-grade Firebase

Happy deploying! 🚀
