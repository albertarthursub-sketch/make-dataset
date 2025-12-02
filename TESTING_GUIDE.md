# 🧪 Complete Testing Guide - API Keys & Dashboard

## ✅ What You Have

### Generated API Keys (Live)
```
API Key 1: DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE
API Key 2: DETECT_XPNGSXJZ703K19mZxkjrgQqPEjlygISu
API Key 3: DETECT_PBca6DT5mPz9msjWBhJ7OzTWRHRqKqOd

API Secret: 73a1e2bdeb0e1ac3552620c7f283fc335f3a83fe3144f22435d760e299c7e0355e5e73c009df07479fdaa130c06c65bcb2da85dbaede70b58d5fa68f28918656
```

### Testing Tools Created
1. **`POSTMAN_TESTING_GUIDE.md`** - Complete Postman setup & examples
2. **`test-dashboard.html`** - Interactive web dashboard for testing
3. **API Keys in `.env`** - Ready to use

---

## 🧪 Testing Options

### Option 1: Postman (Desktop/Web)

**Fastest for API testing**

1. Download [Postman](https://www.postman.com/downloads/)
2. Open Postman
3. Read: `attendance-api-module/POSTMAN_TESTING_GUIDE.md`
4. Create environment with keys above
5. Test each endpoint

**Pros:** Professional, detailed logs, easy to save
**Cons:** Need to install app

---

### Option 2: Test Dashboard (Browser)

**Easiest, no installation**

1. Open: `attendance-api-module/test-dashboard.html` in browser
2. Dashboard automatically tests:
   - Health check
   - Single records
   - Batch processing
   - Statistics retrieval
3. See real-time responses

**Pros:** No setup, visual, interactive
**Cons:** Browser-based limitations

---

### Option 3: Command Line (cURL)

**For automation & scripts**

```bash
# Health check
curl -X GET http://localhost:5000/api/attendance/health \
  -H "X-API-Key: DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE"

# Record attendance (requires signature - see guide for details)
curl -X POST http://localhost:5000/api/attendance/record \
  -H "Content-Type: application/json" \
  -H "X-API-Key: DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE" \
  -H "X-Signature: <generated-signature>" \
  -d '{...}'
```

---

## 📋 Quick Start Testing

### Prerequisites
```bash
# 1. Backend running
cd make-dataset-1
python facial_recognition_backend.py

# 2. Keys in .env (already done ✓)
```

### Step 1: Health Check (Verify Backend)

**Using cURL:**
```bash
curl -X GET http://localhost:5000/api/attendance/health \
  -H "X-API-Key: DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE"
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T01:50:00Z",
  "uptime_seconds": 1234
}
```

### Step 2: Test with Dashboard

```bash
# Open in browser
attendance-api-module/test-dashboard.html
```

You'll see:
- ✅ Health status
- ✅ Request counter
- ✅ Success/failure tracking
- ✅ Real-time responses

### Step 3: Submit Records

**Single Record:**
1. Click "Record Attendance" card
2. Fill in student info
3. Click "Submit Record"
4. See response in dashboard

**Batch Records:**
1. Click "Batch Records" card
2. Set count (1-50)
3. Click "Generate Form"
4. Fill in multiple records
5. Click "Submit Batch"

### Step 4: Check Statistics

1. Click "Statistics" card
2. (Optional) Filter by date/class
3. Click "Get Statistics"
4. See all stored attendance records

---

## 🔑 API Key Details

| Property | Value |
|----------|-------|
| **Format** | `DETECT_` prefix + 32 random characters |
| **Security** | Uses HMAC-SHA256 signing |
| **Rotation** | Every 90 days recommended |
| **Storage** | `.env` file (never in git) |

### How Authentication Works

1. **Client** sends request with `X-API-Key` header
2. **Server** validates key exists in `DETECTION_API_KEYS`
3. **Client** signs request body with `DETECTION_API_SECRET`
4. **Server** verifies signature matches
5. **Request** processed only if both valid

---

## 📊 Dashboard Features

### Real-Time Monitoring
- Backend health status indicator
- Request counter (total sent)
- Success/failure tracking
- Rate limit information

### Testing Capabilities
- ✅ Health checks
- ✅ Single attendance records
- ✅ Batch processing (1-50 records)
- ✅ Statistics queries with filters
- ✅ Response visualization

### Configuration Section
- Backend URL (changeable)
- API Key display
- Secret key (shown on demand)
- Rate limit reference

---

## 🚀 Workflow for Production

### 1. **Test Locally**
```bash
# Start backend
python facial_recognition_backend.py

# Test with dashboard or Postman
# Use DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE
```

### 2. **Deploy to Railway**
```bash
# Backend auto-deploys
# Environment variables set in Railway dashboard:
# - DETECTION_API_KEY_1
# - DETECTION_API_KEY_2
# - DETECTION_API_KEY_3
# - DETECTION_API_SECRET
# - ATTENDANCE_DB_ENABLED=true
```

### 3. **Test Production**
```bash
# Update dashboard/Postman
backend_url = "https://web-production-c65a6.up.railway.app"

# Test again with same API keys
```

### 4. **Share with Detection Team**
```
Give them:
- API Key (one of the 3)
- API Secret
- Backend URL
- POSTMAN_TESTING_GUIDE.md
- Example client code (detection_client_example.py/.js)
```

---

## 📁 Files Overview

```
attendance-api-module/
├── test-dashboard.html              ← Open in browser to test ✨
├── POSTMAN_TESTING_GUIDE.md         ← Postman setup guide
├── ATTENDANCE_API_README.md         ← Full documentation
├── detection_client_example.py      ← Python client code
├── detection_client_example.js      ← JavaScript client code
├── attendance_api.py                ← Backend API (in Flask)
├── generate_api_keys.py             ← Key generator utility
├── api_keys_20251202_084212.json    ← Backup of generated keys
└── README.md                        ← Quick start guide
```

---

## ✅ Testing Checklist

- [ ] Backend running locally (`python facial_recognition_backend.py`)
- [ ] `.env` has API keys loaded
- [ ] Health check returns 200 OK
- [ ] Can submit single attendance record
- [ ] Can submit batch records (2+ records)
- [ ] Can retrieve statistics
- [ ] Dashboard shows all responses
- [ ] Rate limiting working (429 errors after limit)
- [ ] Signatures validate correctly
- [ ] Data appears in Firebase Firestore

---

## 🐛 Troubleshooting

### "Connection refused"
- Backend not running
- Wrong backend URL in config
- Firewall blocking port 5000

### "Invalid signature"
- Check API secret in .env
- Ensure JSON keys are sorted
- Don't include signature in data being signed

### "401 - Unauthorized"
- Missing X-API-Key header
- API key not in DETECTION_API_KEYS list
- Signature doesn't match

### "429 - Rate Limited"
- Exceeded quota for endpoint
- Single record: max 200/hour
- Batch: max 50/hour
- Wait and retry

### Dashboard not updating
- Backend may be down (check health)
- CORS issue (should be configured)
- Browser console for errors (F12)

---

## 📞 Next Steps

1. **Test with dashboard** - Quick visual testing ✨
2. **Test with Postman** - Professional testing
3. **Share with team** - Give them API keys & guide
4. **Monitor in production** - Check Firebase for records

---

## 🎯 Success Criteria

When everything works:
- ✅ Dashboard connects to backend
- ✅ Records save to Firebase
- ✅ Statistics show in dashboard
- ✅ Rate limits enforced
- ✅ Signatures validate
- ✅ Data persists across requests

**You're ready for production!** 🚀

---

**Files Created:**
- ✅ API Keys generated (3 keys + 1 secret)
- ✅ POSTMAN_TESTING_GUIDE.md (complete guide)
- ✅ test-dashboard.html (interactive testing)
- ✅ .env updated with credentials
- ✅ All committed to GitHub

**Status: READY TO TEST** 🧪
