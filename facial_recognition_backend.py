#!/usr/bin/env python3
"""
Facial Recognition Backend API
- Face detection using OpenCV
- Face cropping and enhancement
- Firebase upload
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import base64
import os
from datetime import datetime
from io import BytesIO
import json
import logging
from dotenv import load_dotenv

# Firebase imports
import firebase_admin
from firebase_admin import credentials, storage, firestore

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize Firebase
def init_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if app already exists
        try:
            firebase_admin.get_app()
            logger.info('✓ Firebase app already initialized')
            return True
        except ValueError:
            # App doesn't exist, initialize it
            pass
        
        project_id = os.getenv('FIREBASE_PROJECT_ID')
        private_key_id = os.getenv('FIREBASE_PRIVATE_KEY_ID')
        private_key = os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')
        client_email = os.getenv('FIREBASE_CLIENT_EMAIL')
        client_id = os.getenv('FIREBASE_CLIENT_ID')
        storage_bucket = os.getenv('FIREBASE_STORAGE_BUCKET')
        
        if not all([project_id, private_key_id, private_key, client_email, client_id, storage_bucket]):
            logger.error('Missing Firebase environment variables')
            return False
        
        service_account = {
            "type": "service_account",
            "project_id": project_id,
            "private_key_id": private_key_id,
            "private_key": private_key,
            "client_email": client_email,
            "client_id": client_id,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        }
        
        cred = credentials.Certificate(service_account)
        firebase_admin.initialize_app(cred, {
            'storageBucket': storage_bucket,
        })
        
        logger.info('✓ Firebase initialized successfully')
        return True
    except Exception as e:
        logger.error(f'Firebase initialization failed: {e}')
        return False

# Initialize face cascade classifier
def init_cascade():
    """Load Haar Cascade classifier for face detection"""
    cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    cascade = cv2.CascadeClassifier(cascade_path)
    if cascade.empty():
        logger.error('Failed to load cascade classifier')
        return None
    logger.info('✓ Cascade classifier loaded')
    return cascade

# Global instances
cascade = init_cascade()
firebase_initialized = init_firebase()


class FaceProcessor:
    """Handle face detection, cropping, and enhancement"""
    
    def __init__(self, cascade_classifier):
        self.cascade = cascade_classifier
        self.face_size = (224, 224)  # Standard size for face recognition models
    
    def detect_faces(self, image_array):
        """Detect faces in image using Haar Cascade with optimized parameters"""
        gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
        
        # Apply histogram equalization to improve detection in poor lighting
        gray_eq = cv2.equalizeHist(gray)
        
        # Try detection with equalized image first
        faces = self.cascade.detectMultiScale(
            gray_eq, 
            scaleFactor=1.1,      # More sensitive
            minNeighbors=4,        # More sensitive
            minSize=(30, 30),      # Allow smaller faces
            maxSize=(400, 400)     # Reasonable max
        )
        
        # If no faces found, try original gray image with even more sensitivity
        if len(faces) == 0:
            faces = self.cascade.detectMultiScale(
                gray,
                scaleFactor=1.05,    # Even more sensitive
                minNeighbors=3,      # Less strict
                minSize=(20, 20),    # Allow very small faces
                maxSize=(500, 500)   # Larger max
            )
        
        return faces
    
    def crop_face(self, image_array, face_rect):
        """Crop and enhance face region with better padding"""
        x, y, w, h = face_rect
        
        # Add padding (20% on sides, 30% on top for better framing)
        pad_width = int(0.2 * w)   # 20% padding on sides
        pad_height_top = int(0.3 * h)   # 30% on top (for forehead)
        pad_height_bottom = int(0.15 * h)  # 15% on bottom
        
        x1 = max(0, x - pad_width)
        y1 = max(0, y - pad_height_top)
        x2 = min(image_array.shape[1], x + w + pad_width)
        y2 = min(image_array.shape[0], y + h + pad_height_bottom)
        
        # Crop face region
        face_crop = image_array[y1:y2, x1:x2]
        
        # Check if crop is valid
        if face_crop.shape[0] <= 0 or face_crop.shape[1] <= 0:
            raise ValueError("Invalid face crop dimensions")
        
        # Resize to standard size with high quality
        face_resized = cv2.resize(face_crop, self.face_size, interpolation=cv2.INTER_CUBIC)
        
        # Enhance contrast with histogram equalization (better than lab)
        # Convert to LAB color space for better equalization
        lab = cv2.cvtColor(face_resized, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        lab = cv2.merge([l, a, b])
        enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        return enhanced, (x1, y1, x2, y2)
    
    def draw_bounding_box(self, image_array, faces):
        """Draw bounding boxes on image for visualization"""
        image_copy = image_array.copy()
        
        for (x, y, w, h) in faces:
            # Draw green rectangle (same as frontend style)
            cv2.rectangle(image_copy, (x, y), (x + w, y + h), (0, 255, 136), 2)
            
            # Draw corner markers
            corner_size = 20
            cv2.rectangle(image_copy, (x, y), (x + corner_size, y + 3), (0, 255, 136), -1)
            cv2.rectangle(image_copy, (x, y), (x + 3, y + corner_size), (0, 255, 136), -1)
            
            cv2.rectangle(image_copy, (x + w - corner_size, y), (x + w, y + 3), (0, 255, 136), -1)
            cv2.rectangle(image_copy, (x + w - 3, y), (x + w, y + corner_size), (0, 255, 136), -1)
            
            cv2.rectangle(image_copy, (x, y + h - 3), (x + corner_size, y + h), (0, 255, 136), -1)
            cv2.rectangle(image_copy, (x, y + h - corner_size), (x + 3, y + h), (0, 255, 136), -1)
            
            cv2.rectangle(image_copy, (x + w - corner_size, y + h - 3), (x + w, y + h), (0, 255, 136), -1)
            cv2.rectangle(image_copy, (x + w - 3, y + h - corner_size), (x + w, y + h), (0, 255, 136), -1)
            
            # Add label
            cv2.putText(image_copy, 'Face Detected', (x + 10, y - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 136), 2)
        
        return image_copy


# Initialize face processor
face_processor = FaceProcessor(cascade) if cascade else None


def upload_to_firebase(image_data, student_name, student_id, position):
    """Upload processed image to Firebase Storage"""
    try:
        if not firebase_initialized:
            logger.warning('Firebase not initialized, skipping upload')
            return None
        
        bucket = storage.bucket()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        blob_path = f"face_dataset/{student_name}/{student_id}_{position}_{timestamp}.jpg"
        
        blob = bucket.blob(blob_path)
        blob.upload_from_string(image_data, content_type='image/jpeg')
        
        logger.info(f'✓ Uploaded to Firebase: {blob_path}')
        
        # Save metadata to Firestore
        db = firestore.client()
        db.collection('students').document(student_id).collection('images').add({
            'fileName': f'{student_id}_{position}_{timestamp}.jpg',
            'position': position,
            'uploadedAt': datetime.now(),
            'path': blob_path,
            'studentName': student_name,
            'studentId': student_id
        })
        
        logger.info('✓ Metadata saved to Firestore')
        return blob_path
        
    except Exception as e:
        logger.error(f'Firebase upload failed: {e}')
        return None


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'firebase': firebase_initialized,
        'cascade': cascade is not None,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/process-image', methods=['POST'])
def process_image():
    """
    Process image: detect faces, crop, enhance
    
    Request:
    {
        "image": "base64_encoded_image",
        "studentId": "123456",
        "studentName": "John Doe",
        "className": "10A",
        "position": "front"  # or "side", "angle", etc.
    }
    
    Response:
    {
        "success": true,
        "faces_detected": 1,
        "processed_image": "base64_encoded_cropped_face",
        "cropped_face": "base64_encoded_cropped_face",
        "visualization": "base64_encoded_with_bounding_boxes",
        "firebase_path": "gs://bucket/..."
    }
    """
    try:
        data = request.json
        
        # Extract request data
        image_base64 = data.get('image')
        student_id = data.get('studentId')
        student_name = data.get('studentName')
        class_name = data.get('className')
        position = data.get('position', 'front')
        
        if not all([image_base64, student_id, student_name, class_name]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        # Decode base64 image
        logger.info(f'Processing image for {student_name} (ID: {student_id}, Pos: {position})')
        
        image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({
                'success': False,
                'error': 'Failed to decode image'
            }), 400
        
        logger.info(f'Image decoded: {image.shape}')
        
        # Optimize image for faster processing (resize to max 720p)
        height, width = image.shape[:2]
        max_dim = 720
        if max(height, width) > max_dim:
            scale = max_dim / max(height, width)
            image = cv2.resize(image, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LINEAR)
            logger.info(f'Image resized to: {image.shape}')
        
        # Detect faces
        faces = face_processor.detect_faces(image)
        logger.info(f'Faces detected: {len(faces)}')
        
        # Fallback: if no faces detected, try with histogram equalization
        if len(faces) == 0:
            logger.info('No faces detected, applying histogram equalization...')
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            gray_eq = cv2.equalizeHist(gray)
            image_eq = cv2.cvtColor(gray_eq, cv2.COLOR_GRAY2BGR)
            
            faces = face_processor.detect_faces(image_eq)
            if len(faces) > 0:
                image = image_eq  # Use equalized image for subsequent processing
                logger.info(f'Faces detected after equalization: {len(faces)}')
        
        # Final fallback: try more aggressive detection parameters directly
        if len(faces) == 0:
            logger.info('Still no faces, trying aggressive detection...')
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = face_processor.cascade.detectMultiScale(
                gray,
                scaleFactor=1.05,    # Maximum sensitivity
                minNeighbors=2,      # Minimum threshold
                minSize=(15, 15),    # Very small faces
                maxSize=(700, 700)   # Large faces
            )
            logger.info(f'Aggressive detection result: {len(faces)} faces')
        
        if len(faces) == 0:
            return jsonify({
                'success': False,
                'error': 'No faces detected. Try: better lighting, closer face, or face straight to camera',
                'faces_detected': 0,
                'suggestion': 'Ensure good lighting and position face clearly in frame'
            }), 400
        
        # Get largest face (main subject)
        largest_face = max(faces, key=lambda f: f[2] * f[3])
        
        try:
            # Crop and enhance face
            cropped_face, coords = face_processor.crop_face(image, largest_face)
        except Exception as e:
            logger.error(f'Cropping error: {e}')
            return jsonify({
                'success': False,
                'error': f'Failed to crop face: {str(e)}'
            }), 400
        
        # Encode cropped face to base64 with lower quality for speed
        _, cropped_encoded = cv2.imencode('.jpg', cropped_face, [cv2.IMWRITE_JPEG_QUALITY, 85])
        cropped_base64 = base64.b64encode(cropped_encoded).decode()
        
        # Create visualization with bounding boxes
        visualization = face_processor.draw_bounding_box(image, faces)
        _, viz_encoded = cv2.imencode('.jpg', visualization)
        viz_base64 = base64.b64encode(viz_encoded).decode()
        
        # DON'T upload to Firebase here - only process and return
        # Upload happens when user clicks "Upload" button
        
        logger.info(f'✓ Image processing complete for {student_name}')
        
        return jsonify({
            'success': True,
            'faces_detected': len(faces),
            'processed_image': f'data:image/jpeg;base64,{cropped_base64}',
            'visualization': f'data:image/jpeg;base64,{viz_base64}',
            'message': f'✓ Detected and processed {len(faces)} face(s). Main subject cropped and enhanced.'
        }), 200
        
    except Exception as e:
        logger.error(f'Image processing error: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/batch-process', methods=['POST'])
def batch_process():
    """
    Process multiple images in batch
    
    Request:
    {
        "images": [
            {
                "image": "base64_encoded",
                "position": "front"
            },
            {
                "image": "base64_encoded",
                "position": "side"
            }
        ],
        "studentId": "123456",
        "studentName": "John Doe",
        "className": "10A"
    }
    """
    try:
        data = request.json
        images = data.get('images', [])
        student_id = data.get('studentId')
        student_name = data.get('studentName')
        class_name = data.get('className')
        
        if not images or not all([student_id, student_name, class_name]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        results = []
        
        for idx, img_data in enumerate(images):
            try:
                image_base64 = img_data.get('image')
                position = img_data.get('position', f'pos_{idx}')
                
                # Create synthetic request for process_image
                synthetic_request = {
                    'image': image_base64,
                    'studentId': student_id,
                    'studentName': student_name,
                    'className': class_name,
                    'position': position
                }
                
                # Mock request context
                with app.test_request_context(
                    json=synthetic_request,
                    method='POST'
                ):
                    response = process_image()
                    results.append({
                        'position': position,
                        'status': 'success' if response[1] == 200 else 'failed',
                        'data': response[0].json if hasattr(response[0], 'json') else response[0]
                    })
                    
            except Exception as e:
                results.append({
                    'position': position,
                    'status': 'failed',
                    'error': str(e)
                })
        
        successful = sum(1 for r in results if r['status'] == 'success')
        
        return jsonify({
            'success': True,
            'total_processed': len(images),
            'successful': successful,
            'failed': len(images) - successful,
            'results': results
        }), 200
        
    except Exception as e:
        logger.error(f'Batch processing error: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    """
    Upload a single image to Firebase Storage
    
    Request:
    {
        "image": "base64_encoded_image",
        "studentId": "123456",
        "studentName": "John Doe",
        "className": "10A",
        "position": "front"
    }
    
    Response:
    {
        "success": true,
        "firebase_path": "gs://bucket/...",
        "message": "Image uploaded successfully"
    }
    """
    try:
        data = request.json
        
        image_base64 = data.get('image')
        student_id = data.get('studentId')
        student_name = data.get('studentName')
        position = data.get('position', 'unknown')
        
        if not all([image_base64, student_id, student_name]):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
        
        # Decode base64 image
        logger.info(f'Uploading image for {student_name} (ID: {student_id}, Pos: {position})')
        
        # Handle data URL format
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        image_data = base64.b64decode(image_base64)
        
        # Upload to Firebase
        firebase_path = upload_to_firebase(image_data, student_name, student_id, position)
        
        if not firebase_path:
            return jsonify({
                'success': False,
                'error': 'Failed to upload image to Firebase'
            }), 500
        
        logger.info(f'✓ Successfully uploaded: {firebase_path}')
        
        return jsonify({
            'success': True,
            'firebase_path': firebase_path,
            'message': f'Image uploaded successfully to {firebase_path}'
        }), 200
        
    except Exception as e:
        logger.error(f'Upload image error: {str(e)}', exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/detect-faces', methods=['POST'])
def detect_faces():
    """
    Real-time face detection endpoint
    Returns face coordinates without processing/cropping
    Used for live camera overlay
    
    Request:
    {
        "image": "base64_encoded_image"
    }
    
    Response:
    {
        "success": true,
        "faces_detected": 1,
        "faces": [
            {"x": 100, "y": 150, "w": 200, "h": 250}
        ]
    }
    """
    try:
        data = request.json
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify({
                'success': False,
                'faces': [],
                'faces_detected': 0
            }), 400
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
        nparr = np.frombuffer(image_data, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({
                'success': False,
                'faces': [],
                'faces_detected': 0
            }), 400
        
        # Optimize: resize if too large
        height, width = image.shape[:2]
        if max(height, width) > 720:
            scale = 720 / max(height, width)
            image = cv2.resize(image, (int(width * scale), int(height * scale)), interpolation=cv2.INTER_LINEAR)
        
        # Detect faces
        faces = face_processor.detect_faces(image)
        
        # Convert to coordinates format
        face_coords = [
            {'x': int(x), 'y': int(y), 'w': int(w), 'h': int(h)}
            for x, y, w, h in faces
        ]
        
        logger.debug(f'Detected {len(faces)} faces for real-time display')
        
        return jsonify({
            'success': True,
            'faces_detected': len(faces),
            'faces': face_coords
        }), 200
        
    except Exception as e:
        logger.error(f'Face detection error: {str(e)}')
        return jsonify({
            'success': False,
            'faces': [],
            'faces_detected': 0
        }), 500


if __name__ == '__main__':
    logger.info('🚀 Starting Facial Recognition Backend API')
    logger.info(f'Firebase: {"✓ Initialized" if firebase_initialized else "✗ Not initialized"}')
    logger.info(f'Face Detection: {"✓ Ready" if cascade else "✗ Not available"}')
    
    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
