#!/usr/bin/env python3
"""
Firebase Integration Verification Script
Tests the Firebase integration for make_dataset.py
"""

import os
import sys
import requests
import json
from pathlib import Path

def check_env_vars():
    """Check if environment variables are configured"""
    print("\n🔍 Checking Environment Configuration...")
    print("=" * 50)
    
    required_vars = {
        'UPLOAD_API_URL': 'http://localhost:3000/api/face/upload',
    }
    
    fb_vars = {
        'FIREBASE_PROJECT_ID': 'Firebase Project ID',
        'FIREBASE_PRIVATE_KEY_ID': 'Firebase Private Key ID',
        'FIREBASE_PRIVATE_KEY': 'Firebase Private Key',
        'FIREBASE_CLIENT_EMAIL': 'Firebase Client Email',
        'FIREBASE_CLIENT_ID': 'Firebase Client ID',
        'FIREBASE_STORAGE_BUCKET': 'Firebase Storage Bucket',
    }
    
    # Check optional vars
    upload_url = os.getenv('UPLOAD_API_URL', 'http://localhost:3000/api/face/upload')
    print(f"✓ UPLOAD_API_URL: {upload_url}")
    
    # Check Firebase vars
    print("\nFirebase Configuration (for web server):")
    all_fb_present = True
    for var, desc in fb_vars.items():
        value = os.getenv(var)
        if value:
            if len(value) > 50:
                print(f"  ✓ {var}: [SET - {len(value)} chars]")
            else:
                print(f"  ✓ {var}: {value}")
        else:
            print(f"  ✗ {var}: NOT SET")
            all_fb_present = False
    
    if all_fb_present:
        print("\n✅ All Firebase variables configured")
    else:
        print("\n⚠️  Some Firebase variables missing")
        print("   Check .env.local in web-dataset-collector/")
    
    return upload_url, all_fb_present

def test_web_server():
    """Test if web server is running"""
    print("\n🌐 Testing Web Server Connection...")
    print("=" * 50)
    
    api_url = os.getenv('UPLOAD_API_URL', 'http://localhost:3000/api/face/upload')
    base_url = api_url.rsplit('/api', 1)[0]
    health_url = f"{base_url}/api/health"
    
    try:
        print(f"Testing: {health_url}")
        response = requests.get(health_url, timeout=5)
        
        if response.status_code == 200:
            print(f"✅ Web server is running and responding")
            print(f"   Status: {response.json()}")
            return True
        else:
            print(f"⚠️  Web server responded with status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Could not connect to web server at {base_url}")
        print(f"   Make sure to run: cd web-dataset-collector && npm run dev")
        return False
    except Exception as e:
        print(f"❌ Error testing web server: {e}")
        return False

def test_local_storage():
    """Test if local storage is available"""
    print("\n💾 Testing Local Storage...")
    print("=" * 50)
    
    test_dir = "face_dataset"
    test_file = os.path.join(test_dir, ".test")
    
    try:
        os.makedirs(test_dir, exist_ok=True)
        with open(test_file, 'w') as f:
            f.write("test")
        os.remove(test_file)
        print(f"✅ Local storage available at: {os.path.abspath(test_dir)}")
        return True
    except Exception as e:
        print(f"❌ Local storage error: {e}")
        return False

def test_dependencies():
    """Test if required Python packages are installed"""
    print("\n📦 Testing Python Dependencies...")
    print("=" * 50)
    
    packages = {
        'cv2': 'OpenCV',
        'requests': 'Requests',
        'numpy': 'NumPy',
    }
    
    all_present = True
    for module, name in packages.items():
        try:
            __import__(module)
            print(f"✅ {name} ({module}): installed")
        except ImportError:
            print(f"❌ {name} ({module}): NOT INSTALLED")
            all_present = False
    
    return all_present

def test_make_dataset_file():
    """Check if make_dataset.py has Firebase integration"""
    print("\n📄 Checking make_dataset.py Integration...")
    print("=" * 50)
    
    try:
        with open('make_dataset.py', 'r') as f:
            content = f.read()
        
        checks = {
            'upload_face_image_to_firebase': 'Firebase upload function',
            'UPLOAD_API_URL': 'Environment variable check',
            'firebase': 'Firebase references',
        }
        
        all_found = True
        for check, desc in checks.items():
            if check.lower() in content.lower():
                print(f"✅ {desc}: Found")
            else:
                print(f"❌ {desc}: NOT found")
                all_found = False
        
        return all_found
        
    except Exception as e:
        print(f"❌ Error reading make_dataset.py: {e}")
        return False

def test_web_api_upload():
    """Test the actual upload endpoint"""
    print("\n🚀 Testing Upload Endpoint...")
    print("=" * 50)
    
    api_url = os.getenv('UPLOAD_API_URL', 'http://localhost:3000/api/face/upload')
    
    try:
        # Create a minimal test image
        import cv2
        import numpy as np
        
        # Create a simple test image
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        test_image[:, :] = [0, 255, 0]  # Green image
        
        # Encode to JPEG
        success, jpeg_data = cv2.imencode('.jpg', test_image, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if not success:
            print("❌ Failed to create test image")
            return False
        
        import io
        files = {
            'image': ('test_face.jpg', io.BytesIO(jpeg_data.tobytes()), 'image/jpeg')
        }
        data = {
            'studentId': '99999',
            'studentName': 'Test Student',
            'className': 'TEST',
            'position': '0'
        }
        
        print(f"Sending test upload to: {api_url}")
        response = requests.post(api_url, files=files, data=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ Upload endpoint working correctly")
                print(f"   Response: {result.get('message', 'Success')}")
                print(f"   Storage URL: {result.get('data', {}).get('storageUrl', 'N/A')}")
                return True
            else:
                print(f"⚠️  Upload failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Server error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Could not connect to upload endpoint")
        print(f"   Make sure web server is running: npm run dev")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "=" * 50)
    print("Firebase Integration Verification")
    print("=" * 50)
    
    results = {
        'Environment Variables': check_env_vars()[1],
        'Web Server Running': test_web_server(),
        'Local Storage': test_local_storage(),
        'Python Dependencies': test_dependencies(),
        'Make Dataset File': test_make_dataset_file(),
    }
    
    # Only test endpoint if web server is running
    if results['Web Server Running']:
        results['Upload Endpoint'] = test_web_api_upload()
    else:
        print("\n⏭️  Skipping upload endpoint test (web server not running)")
    
    # Summary
    print("\n" + "=" * 50)
    print("VERIFICATION SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "=" * 50)
    
    if passed == total:
        print(f"✅ All {total} tests passed! Ready to use make_dataset.py")
        return 0
    elif passed >= total - 1:
        print(f"⚠️  {passed}/{total} tests passed")
        print("   The system is mostly ready. Check failures above.")
        return 1
    else:
        print(f"❌ {passed}/{total} tests passed")
        print("   Please fix the failures above before using make_dataset.py")
        return 1

if __name__ == '__main__':
    sys.exit(main())
