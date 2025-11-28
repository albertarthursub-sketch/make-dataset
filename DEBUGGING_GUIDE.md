# Facial Attendance System - Debugging Guide

## ✅ Changes Made (Latest Commit: eb228dc)

### 1. **Bounding Box Visualization** 🎯
- Added canvas overlay on top of video element
- Green rectangle shows **exact crop area** before capture
- Updates in real-time as face moves
- CSS class: `video_overlay` with position: absolute

### 2. **Enhanced Face Detection Logging**
Every step is now logged to browser console:
```
Detection result: {...}
Detections count: 1
Bounding box: {originX: 0.25, originY: 0.1, width: 0.4, height: 0.5}
Video dimensions: 1280x720
Raw crop area: x=320, y=72, width=512, height=576
Adjusted crop: cropX=300, cropY=52, cropWidth=512, cropHeight=576
Bounding box drawn on canvas overlay
Cropped image created: 256 x 256
```

### 3. **Improved Upload Error Handling**
Every upload step is now logged:
```
Starting upload for image 1/5
Base64 data length: 12345
Binary string length: 9234
Blob size: 3078 bytes
Uploading image 1 to /api/face/upload
Upload response status: 200
Upload successful for image 1: {success: true, filename: "...", url: "..."}
```

---

## 🔍 Debugging Steps

### **Problem 1: No Bounding Box Visible**

1. **Open Browser DevTools** (Press `F12`)
2. Go to **Console** tab
3. Position your face in front of the camera
4. Look for this message:
   ```
   ✓ Bounding box drawn on canvas overlay
   ```
5. If you see it but no green rectangle appears:
   - Check CSS: canvas should have `display: block` and `position: absolute`
   - Verify video is playing (should show live feed)
   - Try refreshing page with `Ctrl+R`

6. If you **don't** see the message:
   - Check for: `No faces detected. Please ensure your face is clearly visible.`
   - Ensure good lighting
   - Move closer to camera (face should fill more of frame)
   - Ensure face is not covered (no masks, sunglasses)

---

### **Problem 2: Images Not Uploading**

1. **Open Browser Console** (`F12` → Console tab)
2. Try uploading images
3. Look for `Upload response status:` messages:

#### **Status 200** ✅
- Upload successful! Check the URL in response
- Image should appear in Firebase Storage at:
  ```
  face_dataset/{className}/{studentName}/{timestamp}_capture_1.jpg
  ```

#### **Status 400** ❌
- Blob data is malformed
- Check: `Blob size: XXX bytes` 
- If size < 100 bytes: Image data corrupt
- If size > 5MB: Image too large
- Solution: Refresh and retry

#### **Status 413** ❌
- Payload too large
- The base64 conversion might be creating huge data
- Check: `Base64 data length:` in console
- Solution: Make sure cropped image is 50-400px (not larger)

#### **Status 500** ❌
- Server error on `/api/face/upload`
- Check server logs
- Verify Firebase credentials in `.env.local`
- Solution: Check API backend logs

#### **No Network Request at all** ❌
- FormData construction failing silently
- Check console for JavaScript errors (red text)
- Look for exception in uploadAll() function
- Solution: Check browser console for actual error

---

### **Problem 3: Preview Shows Wrong Image**

Each captured image should show:
- **✓ Good**: Just the cropped face (200x200 pixels, roughly)
- **✗ Bad**: Full camera frame or blurry face
- **✗ Bad**: Black/empty image

**Solution**:
1. Check cropped image size in console: `Cropped image created: XXX x XXX`
2. Should be between 50px and 400px
3. If showing full frame:
   - Canvas cropping might not be working
   - Check for errors in `detectAndCropFace()` 
   - Look for: "Face detection error:" in console

---

## 📊 Console Output Examples

### **✅ Successful Capture & Upload**
```javascript
// Capture
Face predictions: [...]
Detections count: 1
Bounding box: {originX: 0.28, originY: 0.15, width: 0.35, height: 0.45}
Video dimensions: 1280x720
Raw crop area: x=358, y=108, width=448, height=576
Adjusted crop: cropX=338, cropY=88, cropWidth=448, cropHeight=576
Bounding box drawn on canvas overlay ✓
Cropped image created: 256 x 256

// Upload
Starting upload for image 1/5
Base64 data length: 9856
Binary string length: 7392
Blob size: 2464 bytes
Uploading image 1 to /api/face/upload
Upload response status: 200 ✓
Upload successful for image 1: {success: true, filename: "student_1.jpg", ...}
```

### **❌ Failed Capture - No Face Detected**
```javascript
Face predictions: [] // Empty array
Detections count: 0
No faces detected. Please ensure your face is clearly visible.
// No bounding box drawn
```

### **❌ Failed Upload - Status 400**
```javascript
Upload response status: 400
Response: {"error":"Missing required fields"}
```

---

## 🔧 Configuration & Limits

| Setting | Value | Meaning |
|---------|-------|---------|
| Min Crop Size | 50px | Face must be large enough |
| Max Crop Size | 400px | Face must be close enough |
| JPEG Quality | 0.95 | Compression level (0-1) |
| Target Images | 5 | Number of images to capture |
| Canvas Padding | 20px | Extra space around face |

---

## 🎬 Step-by-Step Testing

### **Test 1: Verify Bounding Box**
1. Load page
2. Enter student info and click "Start Capture"
3. Position face in camera
4. **Expected**: See green rectangle around face, updates as you move
5. **Check console**: "Bounding box drawn on canvas overlay" appears

### **Test 2: Verify Image Capture**
1. Click "📷 Capture Image" button
2. **Expected**: Green rectangle shows, image appears below camera
3. **Check console**: "Cropped image created: X x Y" (e.g., "200 x 200")
4. **Check preview**: Image shows only your face, not full frame

### **Test 3: Verify Upload**
1. Capture 5 images
2. Click "📤 Upload All Images"
3. **Check console**: Watch upload progress
4. **Expected**: All 5 upload successfully (status 200)
5. **Check database**: Images appear in Firebase Storage path

---

## 🛠️ Quick Fixes

| Issue | Fix |
|-------|-----|
| No bounding box | Refresh page (Ctrl+R), check lighting |
| Upload failing | Check console status code, look at error message |
| Preview wrong | Verify crop size: 50-400px |
| Slow capture | Check internet connection, browser console for errors |
| Camera frozen | Refresh page, check browser permissions |

---

## 📝 Related Files

- **Main Code**: `/web-dataset-collector/pages/index.js`
  - Lines 1-30: This debugging guide (in code comments)
  - Lines 421-500: detectAndCropFace() function
  - Lines 560-620: uploadAll() function
  - Lines 640-680: UI rendering with canvas overlay

- **Styling**: `/web-dataset-collector/styles/index.module.css`
  - `.video_overlay`: Canvas positioning and styling
  - `.capture_container`: Container for video + overlay

- **API Endpoint**: `/web-dataset-collector/api/index.js`
  - Lines 165-210: POST /api/face/upload handler
  - Uploads to: `face_dataset/{className}/{studentName}/`

---

## 🚀 Next Steps

1. **Test in Browser**: Open page, test bounding box and uploads
2. **Check Logs**: Monitor console while using the app
3. **Deploy to Vercel**: Push to production once working locally
4. **Monitor**: Use browser DevTools to watch network requests

---

**Last Updated**: Commit eb228dc  
**Status**: ✅ Ready for Testing
