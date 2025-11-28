#!/bin/bash

# Facial Attendance System - Quick Test Script
# This script verifies all components are in place

echo "🔍 Facial Attendance System - Component Verification"
echo "======================================================"
echo ""

# Check 1: Required files exist
echo "1️⃣  Checking files..."
files_ok=true

if [ -f "web-dataset-collector/pages/index.js" ]; then
  echo "   ✅ Main page component exists"
else
  echo "   ❌ Missing: web-dataset-collector/pages/index.js"
  files_ok=false
fi

if [ -f "web-dataset-collector/api/index.js" ]; then
  echo "   ✅ API endpoint exists"
else
  echo "   ❌ Missing: web-dataset-collector/api/index.js"
  files_ok=false
fi

if [ -f "web-dataset-collector/styles/index.module.css" ]; then
  echo "   ✅ Stylesheet exists"
else
  echo "   ❌ Missing: web-dataset-collector/styles/index.module.css"
  files_ok=false
fi

echo ""

# Check 2: Code contains required functions
echo "2️⃣  Checking functions..."
functions_ok=true

if grep -q "detectAndCropFace" "web-dataset-collector/pages/index.js"; then
  echo "   ✅ detectAndCropFace function found"
else
  echo "   ❌ Missing: detectAndCropFace function"
  functions_ok=false
fi

if grep -q "uploadAll" "web-dataset-collector/pages/index.js"; then
  echo "   ✅ uploadAll function found"
else
  echo "   ❌ Missing: uploadAll function"
  functions_ok=false
fi

if grep -q "Bounding box drawn on canvas overlay" "web-dataset-collector/pages/index.js"; then
  echo "   ✅ Bounding box logging found"
else
  echo "   ❌ Missing: Bounding box logging"
  functions_ok=false
fi

if grep -q "Upload response status:" "web-dataset-collector/pages/index.js"; then
  echo "   ✅ Upload status logging found"
else
  echo "   ❌ Missing: Upload status logging"
  functions_ok=false
fi

echo ""

# Check 3: CSS styles for canvas overlay
echo "3️⃣  Checking CSS styles..."
styles_ok=true

if grep -q "video_overlay" "web-dataset-collector/styles/index.module.css"; then
  echo "   ✅ Canvas overlay CSS found"
else
  echo "   ❌ Missing: Canvas overlay CSS"
  styles_ok=false
fi

if grep -q "position: absolute" "web-dataset-collector/styles/index.module.css"; then
  echo "   ✅ Canvas positioning CSS found"
else
  echo "   ❌ Missing: Canvas positioning CSS"
  styles_ok=false
fi

echo ""

# Check 4: Dependencies installed
echo "4️⃣  Checking dependencies..."
deps_ok=true

if [ -d "web-dataset-collector/node_modules/@mediapipe" ]; then
  echo "   ✅ MediaPipe installed"
else
  echo "   ⚠️  MediaPipe not installed (run: cd web-dataset-collector && npm install)"
  deps_ok=false
fi

echo ""

# Summary
echo "======================================================"
echo "📊 Verification Summary"
echo ""

if [ "$files_ok" = true ] && [ "$functions_ok" = true ] && [ "$styles_ok" = true ]; then
  echo "✅ All components are in place!"
  echo ""
  echo "Next steps:"
  echo "1. cd web-dataset-collector"
  echo "2. npm run dev"
  echo "3. Open browser to http://localhost:3000"
  echo "4. Check browser console (F12) for debug logs"
  echo "5. Test bounding box: Should see green rectangle"
  echo "6. Test upload: Check for 'Upload response status: 200'"
else
  echo "❌ Some components are missing. Review errors above."
fi

echo ""
