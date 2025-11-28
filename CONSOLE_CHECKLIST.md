# 🖥️ Browser Console Checklist

## Open Console: Press `F12` → Click "Console" tab

---

## ✅ WHEN STARTING CAPTURE

You should see one of these:

### **Good - Face Detected**
```
Face predictions: [
  { 
    boundingBox: {originX: 0.25, originY: 0.1, width: 0.4, height: 0.5},
    ...
  }
]
Detections count: 1
Bounding box: {originX: 0.25, originY: 0.1, width: 0.4, height: 0.5}
Video dimensions: 1280x720
Raw crop area: x=320, y=72, width=512, height=576
Adjusted crop: cropX=300, cropY=52, cropWidth=512, cropHeight=576
Bounding box drawn on canvas overlay ✓✓✓
```

### **Bad - No Face Detected**
```
Face predictions: []
Detections count: 0
❌ No face detected. Please ensure your face is clearly visible.
```

---

## ✅ WHEN CAPTURING IMAGES

You should see:

### **Good - Image Cropped**
```
Cropped image created: 256 x 256
```
(Or similar size between 50-400px)

### **Bad - Crop Too Small**
```
❌ Face too small. Please move closer to the camera.
```

### **Bad - Crop Too Large**
```
❌ Face too large. Please move further from the camera.
```

---

## ✅ WHEN UPLOADING IMAGES

Watch for upload messages. Should see one per image:

### **Good - Upload Successful (Status 200)**
```
Starting upload for image 1/5
Base64 data length: 12345
Binary string length: 9234
Blob size: 2464 bytes
Uploading image 1 to /api/face/upload
Upload response status: 200 ✓✓✓
Upload successful for image 1: {
  success: true, 
  filename: "student_1.jpg",
  url: "https://storage.googleapis.com/...",
  ...
}
```

### **Bad - Upload Failed (Status 400)**
```
Upload response status: 400 ❌
Response: {"error":"Invalid image data"}
```

### **Bad - Upload Failed (Status 413)**
```
Upload response status: 413 ❌
Response: {"error":"Payload too large"}
```

### **Bad - Upload Failed (Status 500)**
```
Upload response status: 500 ❌
Response: {"error":"Internal server error"}
```

---

## �� WHAT EACH LOG MEANS

| Log Message | Meaning |
|---|---|
| `Face predictions: [...]` | Face detected successfully |
| `Detections count: 0` | No face found in frame |
| `Bounding box drawn on canvas overlay` | Green rectangle drawn |
| `Cropped image created: 200 x 200` | Image successfully cropped to this size |
| `Base64 data length: 12345` | Image converted to base64 (good sign) |
| `Blob size: 2464 bytes` | Final image blob ready (should be 1-10KB) |
| `Upload response status: 200` | ✅ Upload successful |
| `Upload response status: 400` | ❌ Bad data sent to server |
| `Upload response status: 413` | ❌ Image too large |
| `Upload response status: 500` | ❌ Server error |

---

## 🚨 RED FLAGS - Stop & Debug If You See

| Error | Fix |
|---|---|
| `No faces detected` | Check lighting, position face better |
| `Face too small` | Move closer to camera |
| `Face too large` | Move further from camera |
| `Upload response status: 400` | Image data corrupted, try again |
| `Upload response status: 500` | Server error, check API logs |
| Red error text in console | JavaScript error, refresh page |
| No messages at all | Browser console not working, reload page |

---

## ✨ SUCCESS - YOU'LL SEE

When everything works:

1. **On screen**: Green rectangle around face
2. **Console**: `Bounding box drawn on canvas overlay`
3. **On screen**: Cropped face image below camera
4. **Console**: `Cropped image created: 200 x 200`
5. **On screen**: 5 thumbnail images in grid
6. **Console**: (After upload) `Upload response status: 200` × 5
7. **On screen**: ✅ Success message with 5 uploaded

---

## 🔧 TESTING FLOWCHART

```
Start App
    ↓
Camera Working?
    ├─ YES → Continue
    └─ NO → Check permissions, refresh
    ↓
Click "Start Capture"
    ↓
See Green Rectangle?
    ├─ YES → Continue
    └─ NO → Check console for "No faces detected"
    ↓
Console shows "Bounding box drawn on canvas overlay"?
    ├─ YES → Continue
    └─ NO → Face too small/dim, adjust
    ↓
Click "📷 Capture Image"
    ↓
Image appears below camera?
    ├─ YES → Continue
    └─ NO → Check cropped image size in console
    ↓
Preview shows cropped face (not full frame)?
    ├─ YES → Continue
    └─ NO → Size issue, adjust distance
    ↓
Repeat 4 more times (5 total)
    ↓
Click "📤 Upload All Images"
    ↓
Console shows "Upload response status: 200" × 5?
    ├─ YES → ✅ SUCCESS!
    └─ NO → Check error codes, see DEBUGGING_GUIDE.md
```

---

## 📱 MOBILE TESTING

If testing on phone:
1. Open DevTools: Different on each browser
   - **Chrome**: Long-press → "Inspect" (or connect to PC DevTools)
   - **Safari iOS**: Settings → Advanced → Web Inspector
   - **Firefox**: Remote debugging needed

2. Same console messages should appear
3. Green rectangle should work on phone too

---

## 💡 TIPS

- **Keep console open** (F12) while testing
- **Don't close DevTools** - it might disable some features
- **Refresh page** (Ctrl+R) if console becomes unresponsive
- **Look for errors** - Red text means something failed
- **Check timing** - Some logs appear after a delay

---

**Bookmark this checklist while testing!**

