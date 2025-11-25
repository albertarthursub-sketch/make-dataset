# Camera Capture Testing Guide

## Test Session: November 25, 2025

### Improvements Made

1. **Better Error Handling in captureImage()**
   - Added null checks for canvas and video references
   - Added check for canvas context availability
   - Added check for valid canvas dimensions (width/height > 0)
   - Added try-catch with meaningful error messages
   - Console errors logged for debugging

2. **Improved UI Feedback**
   - Camera status display: "✅ Camera Ready" when streaming
   - Button shows "⏳ Camera loading..." while waiting for camera
   - Button shows "📸 Capture" when ready
   - Button shows "✅ Ready to Upload" when 5 images captured
   - Button shows upload count during upload

3. **Fixed State Management**
   - Removed unused `quality` state variable
   - Fixed image count update to use newImages.length instead of images.length + 1
   - Better disable state logic

4. **Enhanced Button Styling**
   - Added inline opacity and cursor styles for better visual feedback
   - Button disabled state properly styled
   - Hover effects only on enabled state

### Testing Procedure

#### Step 1: Start the Application
```bash
cd web-dataset-collector
npm run dev
# Server runs on http://localhost:3001
```

#### Step 2: Manual Camera Test
1. Open http://localhost:3001 in browser
2. Enter a student ID (e.g., 2401234567)
3. Click "🔍 Lookup Student Info" button
4. Observe:
   - Student name and class auto-fill
   - Message shows "✅ Found: [Name] | Class: [Class]"
   - Button changes to "➜ Continue to Capture"

#### Step 3: Camera Capture Screen
1. Click "➜ Continue to Capture"
2. Observe:
   - Camera permission prompt appears
   - **Allow** camera access
   - Video feed shows in capture container
   - Button changes to "📸 Capture"
   - Status shows "✅ Camera Ready"

#### Step 4: Image Capture
1. Click "📸 Capture" button
2. Observe:
   - Captured image appears in preview grid
   - Image count increments: "1/5"
   - Message shows "✅ Captured image 1/5"
   - Button remains enabled for next capture

3. Repeat 4 more times to capture 5 images
4. After 5th image:
   - Button disabled and shows "✅ Ready to Upload"
   - All 5 images visible in preview grid

#### Step 5: Image Management
1. Click "✕" on any preview image
2. Observe:
   - Image removed from grid
   - Count decreases (e.g., 4/5)
   - Button re-enables to "📸 Capture"

#### Step 6: Upload
1. With 5 images captured, click "📤 Upload 5 Images"
2. Observe:
   - Button shows "⏳ Uploading..."
   - Progress message updates
   - After completion: "✅ Successfully uploaded 5/5 images!"
   - Redirected to success screen

#### Step 7: Success Confirmation
1. Success screen shows:
   - "✅ Upload Complete!"
   - "Successfully captured and uploaded 5 images"
   - "↻ Capture Another Student" button

### Expected Behavior

| Action | Expected Result |
|--------|-----------------|
| Page loads | Camera permission prompt |
| Camera denied | Error message + ability to retry |
| Camera allowed | Video feed displays, button enables |
| Click capture | Image captured, count increments |
| 5 images captured | Upload button enabled, capture disabled |
| Remove image | Count decreases, capture re-enabled |
| Click upload | Images upload, success message |
| Complete upload | Redirected to success page |

### Error Cases to Verify

1. **Camera Permission Denied**
   - Message: "❌ Camera access denied. Please enable camera permissions."
   - Button: Disabled with "⏳ Camera loading..."

2. **Capture Before Camera Ready**
   - Message: "❌ Video not loaded yet. Try again in a moment."

3. **Canvas Error**
   - Message: "❌ Canvas context not available"

4. **Upload Failure**
   - Message: "❌ Failed to upload any images. Please try again."

### Browser Console Checks

1. Open DevTools (F12)
2. Go to Console tab
3. During capture:
   - Should be NO red errors
   - May see warnings from Next.js (normal)
   - Camera capture events should log without errors

### Network Checks

1. Open DevTools (F12)
2. Go to Network tab
3. Capture and upload:
   - POST to `/api/face/upload` should return 200
   - Each image upload ~200-300 KB
   - Response: `{"success":true}`

### Performance Notes

- Video resolution: 1280x720
- JPEG quality: 95%
- Expected image size: 80-150 KB each
- Upload time: 1-2 seconds per image (depends on network)

### Known Limitations

1. **Canvas Drawing**
   - Requires getUserMedia access to video element
   - May have CORS issues if serving from different origins

2. **Mobile**
   - Camera works on mobile browsers
   - May need "facingMode: 'user'" for front camera

3. **File Size**
   - Large images may take longer to upload
   - GitHub warns about files > 50MB (not an issue for images)

### Success Criteria ✅

- [x] Camera permission prompt appears
- [x] Video feed displays when allowed
- [x] Capture button works and captures images
- [x] Images appear in preview grid
- [x] Image count updates correctly
- [x] Upload button works
- [x] Success message displays
- [x] No JavaScript errors in console
- [x] All API calls return 200 status
- [x] Images uploaded to Firebase Storage

### Rollout Checklist

- [x] Code reviewed
- [x] Build passed
- [x] No TypeScript errors
- [x] No console errors
- [x] Camera capture functional
- [x] Upload functional
- [x] Error handling in place
- [x] UI feedback clear
- [x] Documentation complete
