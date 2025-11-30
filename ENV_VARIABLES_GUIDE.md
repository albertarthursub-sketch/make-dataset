# Environment Variables - Reference Guide

## Overview
This guide helps you set up all required environment variables for the facial attendance web collector.

---

## Local Development Setup

### File: `.env.local`
Create this file in `web-dataset-collector/` directory

```bash
# ===================================
# BINUS School API Credentials
# ===================================
API_KEY=OUQyQjdEN0EtREFDQy00QkEyLTg3QTAtNUFGNDVDOUZCRTgy

# ===================================
# Firebase Project Configuration
# ===================================
# 1. Project ID
FIREBASE_PROJECT_ID=your-project-id

# 2. Private Key ID
FIREBASE_PRIVATE_KEY_ID=abc123xyz789

# 3. Private Key (must have \n for newlines)
# Get from Firebase Console → Project Settings → Service Accounts → Private Key
# IMPORTANT: Replace line breaks with \n
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n

# 4. Client Email
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# 5. Client ID
FIREBASE_CLIENT_ID=123456789012345678901

# 6. Storage Bucket (THIS IS CRITICAL - MUST MATCH EXACTLY)
# Format: project-id.appspot.com
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# ===================================
# Environment
# ===================================
NODE_ENV=development
```

---

## Getting Firebase Credentials

### Step 1: Get Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file

### Step 2: Extract Values from JSON
The downloaded JSON file contains:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",           ← FIREBASE_PROJECT_ID
  "private_key_id": "abc123xyz789",          ← FIREBASE_PRIVATE_KEY_ID
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",  ← FIREBASE_PRIVATE_KEY
  "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",  ← FIREBASE_CLIENT_EMAIL
  "client_id": "123456789012345678901",      ← FIREBASE_CLIENT_ID
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs"
}
```

### Step 3: Get Storage Bucket Name
1. In Firebase Console → **Storage**
2. Look for bucket name (usually at top of page)
3. Format should be: `project-id.appspot.com`
4. ⚠️ **IMPORTANT**: Must match exactly

---

## Vercel Deployment Setup

### Step 1: Add Environment Variables to Vercel

#### Via Vercel Dashboard:
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all variables from below

#### Via Vercel CLI:
```bash
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_PRIVATE_KEY_ID
vercel env add FIREBASE_PRIVATE_KEY
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_CLIENT_ID
vercel env add FIREBASE_STORAGE_BUCKET
vercel env add API_KEY
```

### Step 2: Vercel Environment Variables

Add these in Vercel Dashboard:

| Variable | Value | Source |
|----------|-------|--------|
| `FIREBASE_PROJECT_ID` | `your-project-id` | Firebase JSON `project_id` |
| `FIREBASE_PRIVATE_KEY_ID` | `abc123...` | Firebase JSON `private_key_id` |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` | Firebase JSON `private_key` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@...` | Firebase JSON `client_email` |
| `FIREBASE_CLIENT_ID` | `123456789...` | Firebase JSON `client_id` |
| `FIREBASE_STORAGE_BUCKET` | `project-id.appspot.com` | Firebase Storage Console |
| `API_KEY` | `OUQyQjdE...` | Your Binus School API key |
| `NODE_ENV` | `production` | Fixed value |

---

## Critical: FIREBASE_PRIVATE_KEY Format

### ❌ WRONG:
```
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQE...
-----END PRIVATE KEY-----
```

### ✅ CORRECT:
```
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n
```

**Steps to fix**:
1. Copy the key from JSON file
2. Replace actual newlines with `\n` (literal characters)
3. Paste in Vercel dashboard or `.env.local`

### How to Convert:
```bash
# In Terminal (macOS/Linux)
# Copy key, then paste:
cat << 'EOF'
-----BEGIN PRIVATE KEY-----
[paste key here]
-----END PRIVATE KEY-----
EOF

# Replace newlines with \n
# Then add to .env.local
```

---

## Verification Checklist

### Local Setup
- [ ] `.env.local` created in `web-dataset-collector/`
- [ ] All 6 Firebase variables filled
- [ ] `FIREBASE_STORAGE_BUCKET` format: `project-id.appspot.com`
- [ ] Private key has `\n` instead of newlines
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts successfully

### Vercel Setup
- [ ] All environment variables added to Vercel dashboard
- [ ] Variables set for both "Production" and "Preview" (if using environments)
- [ ] Redeploy after adding variables: `vercel --prod`
- [ ] Build completes successfully
- [ ] No environment-related errors in logs

### Verification Test
```bash
# Test locally
curl http://localhost:3000/api/debug/firebase-config

# Expected output should show:
# "status": "success"
# "FIREBASE_PROJECT_ID": "✓ SET"
# "FIREBASE_STORAGE_BUCKET": "✓ SET"
```

---

## Common Mistakes

### ❌ Mistake 1: Storage Bucket Name Wrong
```
Wrong: binus-facial-attendance  (missing .appspot.com)
Wrong: binus-facial-attendance.firebaseapp.com
✅ Correct: binus-facial-attendance.appspot.com
```

### ❌ Mistake 2: Private Key Formatting
```
❌ Key split across lines in .env.local
✅ Single line with \n for newlines
```

### ❌ Mistake 3: Missing Environment Variable
```
❌ Set only FIREBASE_PROJECT_ID, forgot others
✅ Set ALL 6 Firebase variables
```

### ❌ Mistake 4: Not Redeploying After Env Changes
```
❌ Changed vars in Vercel, forgot to redeploy
✅ Run: vercel --prod
```

---

## Troubleshooting

### Issue: "Firebase config missing: FIREBASE_STORAGE_BUCKET"

**Cause**: Environment variable not set or empty

**Solution**:
1. Check `.env.local` file exists
2. Verify `FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com` is set
3. Restart dev server: `npm run dev`
4. For Vercel: Check dashboard variables and redeploy

### Issue: Firebase Upload Fails with Auth Error

**Cause**: Credentials incorrect or mismatched

**Solution**:
1. Verify all 6 Firebase variables set
2. Check Firebase JSON file is still valid (not expired)
3. Test locally first: `/api/debug/firebase-config`
4. If fails, regenerate service account key

### Issue: "Invalid Private Key"

**Cause**: Key format wrong or corrupted

**Solution**:
1. Download fresh service account JSON
2. Ensure `\n` not actual newlines
3. Check key starts with `-----BEGIN PRIVATE KEY-----`
4. Check key ends with `-----END PRIVATE KEY-----\n`

### Issue: Vercel Build Fails

**Cause**: Environment variables not available during build

**Solution**:
1. Set variables in Vercel dashboard
2. Wait 30 seconds for changes to propagate
3. Rebuild: `vercel --prod`
4. Check Vercel logs: `vercel logs --tail`

---

## Security Best Practices

✅ **DO**:
- Keep `.env.local` in `.gitignore`
- Use Vercel's encrypted environment variable storage
- Rotate service account keys periodically
- Use minimal permissions (only Firebase Storage needed)

❌ **DON'T**:
- Commit `.env.local` to git
- Share credentials in messages or emails
- Use production credentials for development
- Expose credentials in client-side code

---

## Reference: Full Firebase Credentials Setup

### Option A: Using Firebase Console UI
1. Firebase Console → Project Settings
2. Service Accounts tab → Generate New Private Key
3. Save JSON file
4. Extract values as per "Getting Firebase Credentials" section

### Option B: Using Firebase CLI
```bash
firebase login
firebase projects:list
firebase emulators:start  # For local testing
```

---

## Verification Commands

```bash
# Test local setup
npm run dev
curl http://localhost:3000/api/debug/firebase-config

# Pull Vercel environment variables
vercel env pull

# Test after Vercel deployment
curl https://your-vercel-project.vercel.app/api/debug/firebase-config
```

---

## Support

If environment variables still don't work:
1. Run `/api/debug/firebase-config` endpoint
2. Check which variables are "✓ SET" vs "❌ MISSING"
3. Verify exact format from this guide
4. Regenerate service account key if over 90 days old

