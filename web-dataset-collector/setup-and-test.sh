#!/bin/bash
# Quick test script for camera and Firebase functionality

echo "🚀 Web Camera & Firebase Verification Script"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  echo "Please run this script from the web-dataset-collector directory"
  exit 1
fi

echo "📦 Step 1: Install Dependencies"
echo "================================"
npm install
if [ $? -ne 0 ]; then
  echo "❌ npm install failed"
  exit 1
fi
echo "✅ Dependencies installed"
echo ""

echo "🏗️ Step 2: Build Project"
echo "========================"
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi
echo "✅ Build successful"
echo ""

echo "✅ All checks passed!"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Local Development:"
echo "   npm run dev"
echo "   Open: http://localhost:3000"
echo ""
echo "2. Test Firebase Config:"
echo "   curl http://localhost:3000/api/debug/firebase-config"
echo ""
echo "3. Deploy to Vercel:"
echo "   git add ."
echo "   git commit -m 'Add face detection and Firebase fixes'"
echo "   git push origin main"
echo ""
echo "4. Verify on Vercel:"
echo "   Check: https://your-vercel-url/api/debug/firebase-config"
echo ""
