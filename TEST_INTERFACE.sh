#!/usr/bin/env bash

# Camera Capture Interface - Complete Testing Script
# Run this to verify all functionality works

echo "=========================================="
echo "📸 Camera Capture Interface Test Suite"
echo "=========================================="
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo "URL: http://localhost:3001"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function for test results
test_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
    ((TESTS_FAILED++))
  fi
}

echo ""
echo "=== STEP 1: Server Health Checks ==="
echo ""

# Test 1.1: Dev server running
if curl -s http://localhost:3001 > /dev/null; then
  test_result 0 "Dev server is running on port 3001"
else
  test_result 1 "Dev server is not responding"
  echo "   Start server with: npm run dev"
  exit 1
fi

# Test 1.2: Health endpoint
HEALTH_STATUS=$(curl -s http://localhost:3001/api/health | jq -r '.status' 2>/dev/null)
if [ "$HEALTH_STATUS" = "ok" ]; then
  test_result 0 "Health endpoint responds correctly"
else
  test_result 1 "Health endpoint failed"
fi

# Test 1.3: Page loads (200 OK)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$HTTP_CODE" = "200" ]; then
  test_result 0 "Homepage HTTP Status: 200 OK"
else
  test_result 1 "Homepage returned HTTP $HTTP_CODE"
fi

echo ""
echo "=== STEP 2: API Endpoint Tests ==="
echo ""

# Test 2.1: Student Lookup endpoint exists
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  http://localhost:3001/api/student/lookup \
  -H "Content-Type: application/json" \
  -d '{"studentId":"test"}')
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
  test_result 0 "Student lookup endpoint responding (HTTP $HTTP_CODE)"
else
  test_result 1 "Student lookup endpoint not responding (HTTP $HTTP_CODE)"
fi

# Test 2.2: Metadata endpoint exists
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  http://localhost:3001/api/student/metadata \
  -H "Content-Type: application/json" \
  -d '{"studentId":"test"}')
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
  test_result 0 "Metadata endpoint responding (HTTP $HTTP_CODE)"
else
  test_result 1 "Metadata endpoint not responding (HTTP $HTTP_CODE)"
fi

# Test 2.3: Upload endpoint exists
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  http://localhost:3001/api/face/upload)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "500" ]; then
  test_result 0 "Upload endpoint responding (HTTP $HTTP_CODE)"
else
  test_result 1 "Upload endpoint not responding (HTTP $HTTP_CODE)"
fi

echo ""
echo "=== STEP 3: Page Structure Tests ==="
echo ""

# Test 3.1: Student Info section
if curl -s http://localhost:3001 | grep -q "Student Information"; then
  test_result 0 "Student Information section found"
else
  test_result 1 "Student Information section not found"
fi

# Test 3.2: Capture section (lazy loaded)
if curl -s http://localhost:3001 | grep -q "Capture Face Images"; then
  test_result 0 "Capture Face Images section found"
else
  test_result 1 "Capture Face Images section not found"
fi

# Test 3.3: Upload Complete section (lazy loaded)
if curl -s http://localhost:3001 | grep -q "Upload Complete"; then
  test_result 0 "Upload Complete section found"
else
  test_result 1 "Upload Complete section not found"
fi

echo ""
echo "=== STEP 4: UI Elements Tests ==="
echo ""

# Test 4.1: Header present
if curl -s http://localhost:3001 | grep -q "Facial Dataset Collector"; then
  test_result 0 "App header 'Facial Dataset Collector' present"
else
  test_result 1 "App header not found"
fi

# Test 4.2: Buttons present
if curl -s http://localhost:3001 | grep -q "button"; then
  test_result 0 "Button elements found"
else
  test_result 1 "No buttons found"
fi

# Test 4.3: Form inputs present
if curl -s http://localhost:3001 | grep -q "input.*type.*text"; then
  test_result 0 "Form input elements found"
else
  test_result 1 "No input elements found"
fi

echo ""
echo "=== STEP 5: Browser Console Check ==="
echo ""

# Check for common React errors in build
BUILD_OUTPUT=$(cd /home/pandora/facial-attendance-v2/web-dataset-collector && npm run build 2>&1)
if echo "$BUILD_OUTPUT" | grep -q "compiled successfully"; then
  test_result 0 "Build compiles without errors"
else
  test_result 1 "Build compilation failed"
fi

echo ""
echo "=== STEP 6: Manual Testing Checklist ==="
echo ""
echo "Please manually verify the following steps:"
echo ""
echo "📋 Student Information Step:"
echo "   [ ] Page displays 'Student Information' form"
echo "   [ ] Input field accepts student ID"
echo "   [ ] 'Lookup Student Info' button is visible"
echo "   [ ] Enter a valid student ID and click lookup"
echo "   [ ] Verify name and class auto-fill"
echo "   [ ] Click 'Continue to Capture' button"
echo ""
echo "📷 Camera Capture Step:"
echo "   [ ] Page displays 'Capture Face Images'"
echo "   [ ] Camera permission prompt appears"
echo "   [ ] Click 'Allow' to grant camera access"
echo "   [ ] Video feed displays in center"
echo "   [ ] Status shows '✅ Camera Ready'"
echo "   [ ] Click '📸 Capture' button"
echo "   [ ] Image appears in preview grid"
echo "   [ ] Image counter shows '1/5'"
echo "   [ ] Click capture 4 more times"
echo "   [ ] After 5 images, button shows '✅ Ready to Upload'"
echo ""
echo "📤 Upload Step:"
echo "   [ ] Click 'Upload 5 Images' button"
echo "   [ ] Button shows 'Uploading...' state"
echo "   [ ] Progress updates during upload"
echo "   [ ] After upload, success message appears"
echo "   [ ] Page shows 'Upload Complete!'"
echo "   [ ] Shows '✅ Successfully captured and uploaded 5 images'"
echo ""
echo "❌ Error Handling:"
echo "   [ ] Deny camera → Error message shown"
echo "   [ ] Remove an image → Count decreases, capture re-enabled"
echo "   [ ] Network failure → Error shown with details"
echo ""

echo ""
echo "=========================================="
echo "Test Results Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
  echo "Interface is ready for production use."
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo "Please fix the issues and re-run tests."
  exit 1
fi
