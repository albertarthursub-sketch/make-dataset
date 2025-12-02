# Attendance API - Postman Testing Guide

## 📋 Setup in Postman

### 1. Create New Environment

1. Click **Environments** (left sidebar)
2. Click **"+"** to create new
3. Name it: `Attendance API Test`
4. Add these variables:

| Variable | Value | Type |
|----------|-------|------|
| `backend_url` | `http://localhost:5000` | string |
| `api_key` | `DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE` | string |
| `api_secret` | `73a1e2bdeb0e1ac3552620c7f283fc335f3a83fe3144f22435d760e299c7e0355e5e73c009df07479fdaa130c06c65bcb2da85dbaede70b58d5fa68f28918656` | string |

5. Click **Save**
6. Select this environment

---

## 🔐 HMAC Signature Generation

For each request, you need to generate an HMAC-SHA256 signature:

```python
import hmac
import hashlib
import json

# Request data
api_key = "DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE"
api_secret = "73a1e2bdeb0e1ac3552620c7f283fc335f3a83fe3144f22435d760e299c7e0355e5e73c009df07479fdaa130c06c65bcb2da85dbaede70b58d5fa68f28918656"

# Data to sign (without signature field)
data = {
    "studentId": "12345",
    "studentName": "John Doe",
    "className": "10-A",
    "attendanceStatus": "present",
    "detectionResult": {
        "facesDetected": 1,
        "confidence": 0.95,
        "matchScore": 0.92,
        "position": "front",
        "processingTimeMs": 250
    },
    "accuracy": {
        "detectionAccuracy": 0.95,
        "recognitionAccuracy": 0.92,
        "overallAccuracy": 0.93
    },
    "performance": {
        "processingTimeMs": 250,
        "modelLoadTimeMs": 100,
        "totalTimeMs": 350
    },
    "timestamp": "2025-12-02T01:50:00Z"
}

# Create signature
data_str = json.dumps(data, sort_keys=True)
signature = hmac.new(
    api_secret.encode(),
    data_str.encode(),
    hashlib.sha256
).hexdigest()

print(f"Signature: {signature}")
```

---

## 📝 Test Requests

### 1. Health Check (No Signature Required)

**Request:**
```
GET http://localhost:5000/api/attendance/health
```

**Headers:**
```
Content-Type: application/json
X-API-Key: DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE
```

**Expected Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2025-12-02T01:50:00Z",
  "uptime_seconds": 1234
}
```

---

### 2. Record Single Attendance

**Request:**
```
POST http://localhost:5000/api/attendance/record
```

**Headers:**
```
Content-Type: application/json
X-API-Key: DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE
X-Signature: <GENERATED_SIGNATURE_HERE>
```

**Body (raw JSON):**
```json
{
  "studentId": "12345",
  "studentName": "John Doe",
  "className": "10-A",
  "attendanceStatus": "present",
  "detectionResult": {
    "facesDetected": 1,
    "confidence": 0.95,
    "matchScore": 0.92,
    "position": "front",
    "processingTimeMs": 250,
    "detectionMethod": "haar_cascade",
    "imageQuality": "good"
  },
  "accuracy": {
    "detectionAccuracy": 0.95,
    "recognitionAccuracy": 0.92,
    "overallAccuracy": 0.93
  },
  "performance": {
    "processingTimeMs": 250,
    "modelLoadTimeMs": 100,
    "totalTimeMs": 350
  },
  "timestamp": "2025-12-02T01:50:00Z"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "record_id": "attendance_12345_20251202_015000",
  "remaining_requests": 199
}
```

---

### 3. Batch Attendance Records

**Request:**
```
POST http://localhost:5000/api/attendance/batch
```

**Headers:**
```
Content-Type: application/json
X-API-Key: DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE
X-Signature: <GENERATED_SIGNATURE_HERE>
```

**Body (raw JSON):**
```json
{
  "attendanceRecords": [
    {
      "studentId": "12345",
      "studentName": "John Doe",
      "className": "10-A",
      "attendanceStatus": "present",
      "detectionResult": {
        "facesDetected": 1,
        "confidence": 0.95,
        "matchScore": 0.92,
        "position": "front",
        "processingTimeMs": 250,
        "detectionMethod": "haar_cascade",
        "imageQuality": "good"
      },
      "accuracy": {
        "detectionAccuracy": 0.95,
        "recognitionAccuracy": 0.92,
        "overallAccuracy": 0.93
      },
      "performance": {
        "processingTimeMs": 250,
        "modelLoadTimeMs": 100,
        "totalTimeMs": 350
      },
      "timestamp": "2025-12-02T01:50:00Z"
    },
    {
      "studentId": "12346",
      "studentName": "Jane Smith",
      "className": "10-A",
      "attendanceStatus": "present",
      "detectionResult": {
        "facesDetected": 1,
        "confidence": 0.93,
        "matchScore": 0.90,
        "position": "left",
        "processingTimeMs": 280,
        "detectionMethod": "haar_cascade",
        "imageQuality": "fair"
      },
      "accuracy": {
        "detectionAccuracy": 0.93,
        "recognitionAccuracy": 0.90,
        "overallAccuracy": 0.91
      },
      "performance": {
        "processingTimeMs": 280,
        "modelLoadTimeMs": 100,
        "totalTimeMs": 380
      },
      "timestamp": "2025-12-02T01:50:05Z"
    }
  ]
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Batch attendance recorded successfully",
  "records_processed": 2,
  "successful_records": 2,
  "failed_records": 0,
  "record_ids": [
    "attendance_12345_20251202_015000",
    "attendance_12346_20251202_015005"
  ],
  "remaining_requests": 49
}
```

---

### 4. Get Statistics

**Request:**
```
GET http://localhost:5000/api/attendance/stats
```

**Headers:**
```
Content-Type: application/json
X-API-Key: DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE
```

**Optional Query Parameters:**
```
?date=2025-12-02&class=10-A&limit=50
```

**Expected Response (200):**
```json
{
  "success": true,
  "statistics": {
    "total_records": 150,
    "total_present": 145,
    "total_absent": 5,
    "total_late": 0,
    "average_detection_accuracy": 0.942,
    "average_recognition_accuracy": 0.918,
    "average_processing_time_ms": 265,
    "total_students": 45,
    "unique_dates": 12
  },
  "records": [
    {
      "recordId": "attendance_12345_20251202_015000",
      "studentId": "12345",
      "studentName": "John Doe",
      "className": "10-A",
      "attendanceStatus": "present",
      "overallAccuracy": 0.93,
      "processingTimeMs": 250,
      "timestamp": "2025-12-02T01:50:00Z"
    }
  ]
}
```

---

## 🔑 Testing Credentials

| Credential | Value |
|-----------|-------|
| **API Key 1** | `DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE` |
| **API Key 2** | `DETECT_XPNGSXJZ703K19mZxkjrgQqPEjlygISu` |
| **API Key 3** | `DETECT_PBca6DT5mPz9msjWBhJ7OzTWRHRqKqOd` |
| **API Secret** | `73a1e2bdeb0e1ac3552620c7f283fc335f3a83fe3144f22435d760e299c7e0355e5e73c009df07479fdaa130c06c65bcb2da85dbaede70b58d5fa68f28918656` |

---

## ⚠️ Common Errors

### 401 - Invalid Signature
**Problem:** Signature doesn't match
**Solution:**
1. Ensure data is sorted by key (JSON.dumps with sort_keys=True)
2. Use correct API secret from .env
3. Don't include the "signature" field in the data being signed

### 401 - Missing API Key
**Problem:** X-API-Key header not provided
**Solution:** Add header: `X-API-Key: DETECT_HmqeWeA1wVJsK9E3oQuNPhBAHQDfbpaE`

### 429 - Rate Limited
**Problem:** Too many requests
**Solution:**
- Single record: Max 200/hour (1 every 18 seconds)
- Batch records: Max 50/hour (1 every 72 seconds)
- Stats: Max 1000/hour
- Wait before retrying

### 422 - Validation Error
**Problem:** Invalid data
**Solution:** Check response for detailed validation errors, ensure all required fields are present and correct type

---

## 🧪 Testing Workflow

1. ✅ **Health Check** - Verify backend is running
2. ✅ **Single Record** - Test basic attendance recording
3. ✅ **Batch Records** - Test batch processing
4. ✅ **Statistics** - Verify data is stored
5. ✅ **Rate Limiting** - Test limits (optional)

---

## 📊 Dashboard Testing

After API tests pass, use the test dashboard to:
1. Submit attendance records via UI
2. View real-time statistics
3. Monitor accuracy metrics
4. Check performance data

See `test-dashboard.html` for simple testing interface.
