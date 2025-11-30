#!/usr/bin/env python3
"""
Simple Firebase Image Upload Tester
Captures image from camera and uploads to Firebase Storage
"""

import cv2
import os
import sys
import json
import base64
from datetime import datetime
from pathlib import Path
import firebase_admin
from firebase_admin import credentials, storage, firestore
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

class FirebaseImageUploader:
    def __init__(self):
        self.firebase_initialized = False
        self.bucket = None
        self.db = None
        self.init_firebase()
    
    def init_firebase(self):
        """Initialize Firebase Admin SDK"""
        try:
            logger.info("=" * 60)
            logger.info("FIREBASE INITIALIZATION")
            logger.info("=" * 60)
            
            # Check environment variables
            project_id = os.getenv('FIREBASE_PROJECT_ID')
            private_key_id = os.getenv('FIREBASE_PRIVATE_KEY_ID')
            private_key = os.getenv('FIREBASE_PRIVATE_KEY')
            client_email = os.getenv('FIREBASE_CLIENT_EMAIL')
            client_id = os.getenv('FIREBASE_CLIENT_ID')
            storage_bucket = os.getenv('FIREBASE_STORAGE_BUCKET')
            
            logger.info(f"✓ FIREBASE_PROJECT_ID: {project_id}")
            logger.info(f"✓ FIREBASE_PRIVATE_KEY_ID: {private_key_id[:10]}...")
            logger.info(f"✓ FIREBASE_PRIVATE_KEY: {private_key[:50]}..." if private_key else "✗ MISSING")
            logger.info(f"✓ FIREBASE_CLIENT_EMAIL: {client_email}")
            logger.info(f"✓ FIREBASE_CLIENT_ID: {client_id}")
            logger.info(f"✓ FIREBASE_STORAGE_BUCKET: {storage_bucket}")
            
            # Validate all required variables
            if not all([project_id, private_key_id, private_key, client_email, client_id, storage_bucket]):
                logger.error("❌ Missing required Firebase environment variables!")
                return False
            
            # Create service account dictionary
            service_account = {
                "type": "service_account",
                "project_id": project_id,
                "private_key_id": private_key_id,
                "private_key": private_key.replace('\\n', '\n'),  # Handle escaped newlines
                "client_email": client_email,
                "client_id": client_id,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{client_email}"
            }
            
            logger.info("✓ Service account dictionary created")
            
            # Initialize Firebase
            cred = credentials.Certificate(service_account)
            firebase_admin.initialize_app(cred, {
                'storageBucket': storage_bucket,
            })
            
            logger.info("✓ Firebase Admin SDK initialized")
            
            # Get storage bucket and firestore references
            self.bucket = storage.bucket()
            self.db = firestore.client()
            
            logger.info(f"✓ Storage bucket connected: {self.bucket.name}")
            logger.info("✓ Firestore connected")
            
            self.firebase_initialized = True
            logger.info("✅ Firebase initialization successful!\n")
            return True
            
        except Exception as e:
            logger.error(f"❌ Firebase initialization failed: {e}", exc_info=True)
            return False
    
    def capture_image(self, output_path="test_capture.jpg"):
        """Capture image from camera"""
        try:
            logger.info("=" * 60)
            logger.info("IMAGE CAPTURE")
            logger.info("=" * 60)
            logger.info("📷 Opening camera...")
            
            cap = cv2.VideoCapture(0)
            
            if not cap.isOpened():
                logger.error("❌ Cannot open camera")
                return None
            
            logger.info("✓ Camera opened successfully")
            logger.info("📸 Capturing image in 3 seconds... Press 'SPACE' to capture or wait...")
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    logger.error("❌ Failed to read frame")
                    break
                
                # Add text to frame
                cv2.putText(frame, "Press SPACE to capture, ESC to skip", (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.imshow("Camera Feed - Press SPACE to capture", frame)
                
                key = cv2.waitKey(1) & 0xFF
                if key == ord(' '):  # Space bar
                    logger.info("✓ Image captured")
                    cv2.imwrite(output_path, frame)
                    logger.info(f"✓ Image saved to: {output_path}")
                    cap.release()
                    cv2.destroyAllWindows()
                    return output_path
                elif key == 27:  # ESC
                    logger.warning("⚠ Capture skipped by user")
                    cap.release()
                    cv2.destroyAllWindows()
                    return None
            
            cap.release()
            cv2.destroyAllWindows()
            return None
            
        except Exception as e:
            logger.error(f"❌ Image capture failed: {e}", exc_info=True)
            return None
    
    def upload_to_firebase(self, image_path, student_name="Test Student", student_id="TEST001"):
        """Upload image to Firebase Storage"""
        try:
            logger.info("=" * 60)
            logger.info("FIREBASE UPLOAD")
            logger.info("=" * 60)
            
            if not self.firebase_initialized:
                logger.error("❌ Firebase not initialized")
                return False
            
            if not os.path.exists(image_path):
                logger.error(f"❌ Image file not found: {image_path}")
                return False
            
            logger.info(f"📁 Image path: {image_path}")
            logger.info(f"📊 File size: {os.path.getsize(image_path)} bytes")
            
            # Create unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            blob_path = f"face_dataset/{student_name}/{student_id}_{timestamp}.jpg"
            
            logger.info(f"📤 Uploading to: gs://{self.bucket.name}/{blob_path}")
            
            # Upload file
            blob = self.bucket.blob(blob_path)
            blob.upload_from_filename(image_path, content_type='image/jpeg')
            
            logger.info("✓ File uploaded to Storage")
            logger.info(f"✓ Blob URL: gs://{self.bucket.name}/{blob_path}")
            
            # Save metadata to Firestore
            try:
                doc_ref = self.db.collection('students').document(student_id)
                doc_ref.set({
                    'name': student_name,
                    'studentId': student_id,
                    'imageUploaded': True,
                    'imagePath': blob_path,
                    'uploadedAt': datetime.now(),
                    'fileSize': os.path.getsize(image_path)
                }, merge=True)
                
                logger.info("✓ Metadata saved to Firestore")
            except Exception as fs_e:
                logger.warning(f"⚠ Firestore metadata save failed: {fs_e}")
            
            logger.info("✅ Upload successful!\n")
            return True
            
        except Exception as e:
            logger.error(f"❌ Upload failed: {e}", exc_info=True)
            return False
    
    def test_connection(self):
        """Test Firebase connection"""
        try:
            logger.info("=" * 60)
            logger.info("CONNECTION TEST")
            logger.info("=" * 60)
            
            if not self.firebase_initialized:
                logger.error("❌ Firebase not initialized")
                return False
            
            # Test storage
            logger.info("🔗 Testing Storage connection...")
            try:
                blobs = list(self.bucket.list_blobs(max_results=1))
                logger.info(f"✓ Storage connected (bucket: {self.bucket.name})")
            except Exception as e:
                logger.error(f"❌ Storage connection failed: {e}")
                return False
            
            # Test Firestore
            logger.info("🔗 Testing Firestore connection...")
            try:
                docs = self.db.collection('students').limit(1).stream()
                count = sum(1 for _ in docs)
                logger.info(f"✓ Firestore connected (students collection exists)")
            except Exception as e:
                logger.error(f"❌ Firestore connection failed: {e}")
                return False
            
            logger.info("✅ All connections successful!\n")
            return True
            
        except Exception as e:
            logger.error(f"❌ Connection test failed: {e}", exc_info=True)
            return False


def main():
    """Main function"""
    print("\n" + "=" * 60)
    print("FIREBASE IMAGE UPLOAD TESTER")
    print("=" * 60 + "\n")
    
    # Create uploader instance
    uploader = FirebaseImageUploader()
    
    if not uploader.firebase_initialized:
        logger.error("Cannot proceed without Firebase initialization")
        sys.exit(1)
    
    # Test connection
    if not uploader.test_connection():
        logger.error("Firebase connection test failed")
        sys.exit(1)
    
    # Capture image
    image_path = uploader.capture_image("test_capture.jpg")
    
    if image_path:
        # Upload to Firebase
        success = uploader.upload_to_firebase(
            image_path,
            student_name="Test Student",
            student_id="TEST001"
        )
        
        if success:
            logger.info("🎉 Complete workflow successful!")
            logger.info(f"Image saved locally at: {image_path}")
            logger.info("Check your Firebase Console -> Storage -> face_dataset/Test Student/")
            print("\n" + "=" * 60)
            print("✅ TEST COMPLETE - IMAGE UPLOADED SUCCESSFULLY")
            print("=" * 60)
        else:
            logger.error("Upload workflow failed")
            print("\n" + "=" * 60)
            print("❌ TEST FAILED - CHECK LOGS ABOVE")
            print("=" * 60)
    else:
        logger.info("No image captured")


if __name__ == "__main__":
    main()
