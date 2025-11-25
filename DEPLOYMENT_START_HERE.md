# 🚀 START HERE - Deployment Guide

## What You Need (3 things)

1. **Binus API Key** ✅ You have this (in `.env`)
2. **Firebase Account** 🔗 Create free at firebase.google.com  
3. **Vercel Account** 🔗 Create free at vercel.com (GitHub login)

---

## In 5 Steps

### 1. Create Firebase Project (2 min)
```
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name: "binus-facial-attendance"
4. Click "Create"
```

### 2. Enable Storage (1 min)
```
1. Click "Storage" in left menu
2. Click "Create bucket"
3. Choose location near you
4. Click "Create"
```

### 3. Get Credentials (1 min)
```
1. Click ⚙️ Settings → "Project settings"
2. Click "Service accounts" tab
3. Click "Generate New Private Key"
4. Save the JSON somewhere
```

### 4. Configure Web Collector (1 min)
```bash
cd web-dataset-collector
cp .env.example .env.local
# Edit .env.local and paste:
# - API_KEY (from your .env)
# - Firebase stuff (from step 3)
```

### 5. Deploy to Vercel (1 min)
```bash
npm install -g vercel
vercel
# Follow prompts
# You get a live URL!
```

---

## Share with Students

Send them:
```
📸 Facial Recognition Dataset Collection
Link: https://your-vercel-app.vercel.app

Step 1: Enter your ID, name, class
Step 2: Allow camera access
Step 3: Capture 3-5 photos from different angles  
Step 4: Upload

Takes ~5 minutes!
```

---

## After Students Upload (Next Day)

```bash
# Download all images
python3 sync_firebase_dataset.py

# Process them
python3 make_dataset.py
python3 enroll_local.py

# Run system
python3 main.py
```

---

## Done! 

You now have a **working facial attendance system** deployed live! 🎉

---

## Detailed Docs

- Want step-by-step? → Read `GETTING_STARTED.md`
- Web collector questions? → See `web-dataset-collector/QUICKSTART.md`
- How it all works? → Check `SYSTEM_SUMMARY.md`

---

**Questions?** Check the documentation files above.
**Ready?** Start with Step 1 above!
