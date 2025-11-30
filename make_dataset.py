"""
Face Dataset Creation Tool - Optimized Edition with Firebase Integration
------------------------------------------------------------------------
This tool captures face images for the facial recognition system and
stores them both locally AND to Firebase Storage.
Features intelligent face detection and optimized image processing.
"""

import cv2
import os
import time
import shutil
import json
import re
import numpy as np
import requests
import base64
import io

def upload_face_image_to_firebase(image_data, student_id, student_name, class_name, position_num):
    """
    Upload a cropped and enhanced face image to Firebase Storage via the web API.
    
    Args:
        image_data: numpy array of image data
        student_id: Binusian ID
        student_name: Full name of student
        class_name: Homeroom/class name
        position_num: Image position/number (e.g., 0, 1, 2)
    
    Returns:
        dict: Response with status and details
    """
    try:
        # Check if we have the web API available
        api_url = os.getenv("UPLOAD_API_URL", "http://localhost:3000/api/face/upload")
        
        # Convert image to JPEG bytes
        if image_data is None:
            print(f"⚠️ No image data to upload for {student_name} position {position_num}")
            return {"success": False, "error": "No image data"}
        
        success, jpeg_data = cv2.imencode('.jpg', image_data, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if not success:
            print(f"❌ Failed to encode image for {student_name}")
            return {"success": False, "error": "Image encoding failed"}
        
        jpeg_bytes = jpeg_data.tobytes()
        
        # Prepare multipart form data
        files = {
            'image': ('face.jpg', io.BytesIO(jpeg_bytes), 'image/jpeg')
        }
        data = {
            'studentId': str(student_id),
            'studentName': str(student_name),
            'className': str(class_name),
            'position': str(position_num)
        }
        
        print(f"  📤 Uploading to Firebase: {api_url}")
        print(f"     Student: {student_name} ({student_id})")
        print(f"     Class: {class_name}, Position: {position_num}")
        
        # Send request to web API endpoint
        response = requests.post(api_url, files=files, data=data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"  ✅ Firebase upload successful: {result.get('data', {}).get('storageUrl', 'N/A')}")
                return {"success": True, "url": result.get('data', {}).get('storageUrl')}
            else:
                print(f"  ❌ Upload API error: {result.get('error', 'Unknown error')}")
                return {"success": False, "error": result.get('error', 'Unknown error')}
        else:
            print(f"  ❌ Upload failed with status {response.status_code}: {response.text[:200]}")
            return {"success": False, "error": f"HTTP {response.status_code}"}
            
    except requests.exceptions.ConnectionError:
        print(f"  ⚠️ Could not connect to upload API at {api_url}")
        print(f"     Make sure the web server is running (npm run dev or similar)")
        return {"success": False, "error": "Could not connect to upload API"}
    except Exception as e:
        print(f"  ❌ Firebase upload error: {e}")
        return {"success": False, "error": str(e)}

def main():
    dataset_path = "face_dataset"

    # Open camera with optimized settings
    camera = cv2.VideoCapture(0)
    
    if not camera.isOpened():
        print("❌ Error: Unable to access the camera.")
        return
    
    # Optimize camera settings
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    camera.set(cv2.CAP_PROP_FPS, 30)
    camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    # Load face detection model
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    if face_cascade.empty():
        print("❌ Error: Failed to load face detection model.")
        camera.release()
        return

    # Ask for the person's information
    studentid = input("Enter the Binusian ID: ").strip()
    
    if not studentid:
        print("❌ Error: ID Can't be empty")
        camera.release()
        return
    
    # Resolve student name and class via API (Part C2) or prompt fallback
    student_name = None
    class_name = None
    try:
        try:
            import api_integrate  # type: ignore
        except Exception:
            api_integrate = None
        if api_integrate and hasattr(api_integrate, 'get_student_by_id_c2'):
            record = api_integrate.get_student_by_id_c2(studentid)
            if isinstance(record, dict):
                # Try common fields from API
                student_name = record.get('studentName') or record.get('name') or record.get('fullName') or record.get('studentFullName') or record.get('nama')
                class_name = record.get('homeroom') or record.get('class') or record.get('className')
    except Exception as e:
        print(f"⚠️ API lookup failed: {e}")

    # Fallback prompts if missing
    if not student_name:
        student_name = input("Enter the student's full name: ").strip()
    if not class_name:
        class_name = input("Enter the homeroom/class (e.g., 1A): ").strip()

    # Basic sanitization for folder names
    def _sanitize(name: str) -> str:
        name = name.strip()
        name = re.sub(r"[\\/]+", "_", name)  # replace path separators
        name = re.sub(r"[^\w\-\s]", "", name)  # keep alnum, underscore, dash, space
        name = re.sub(r"\s+", " ", name).strip()
        return name or "unknown"

    safe_class = _sanitize(class_name)
    safe_name = _sanitize(student_name)

    # Create folder hierarchy face_dataset/<Class>/<Name>/
    person_folder = os.path.join(dataset_path, safe_class, safe_name)
    os.makedirs(person_folder, exist_ok=True)

    # Write metadata for traceability
    try:
        meta = {
            "id": studentid,
            "name": student_name,
            "class": class_name,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%S")
        }
        with open(os.path.join(person_folder, "metadata.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Could not write metadata.json: {e}")
    
    

    # Configuration
    images_to_capture = 3  # Increased for better recognition
    countdown_time = 2
    count = 0
    quality_threshold = 100  # Minimum face area for quality check
    
    print(f"\n📸 We'll capture {images_to_capture} high-quality images for facial recognition.")
    print(f"👤 Student: {student_name}  🏫 Class: {class_name}")
    print("Position yourself in front of the camera with good lighting.")
    print("Try different angles and expressions for better recognition.")
    print("Press 'c' to capture an image when ready, or 'q' to quit.")
    
    # Main loop with enhanced quality control
    capturing = False
    countdown = 0
    last_capture_time = 0
    captured_positions = []  # Track face positions to encourage variety
    
    while count < images_to_capture:
        success, frame = camera.read()
        if not success:
            print("❌ Error: Failed to capture frame.")
            break
            
        # Flip frame for mirror effect
        frame = cv2.flip(frame, 1)
        display_frame = frame.copy()
        
        # Detect faces with enhanced parameters
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(100, 100),  # Larger minimum size for better quality
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        # Enhanced face quality assessment
        best_face = None
        best_quality = 0
        
        for (x, y, w, h) in faces:
            # Calculate face quality score
            face_area = w * h
            center_x = x + w // 2
            center_y = y + h // 2
            frame_center_x = frame.shape[1] // 2
            frame_center_y = frame.shape[0] // 2
            
            # Distance from center (prefer centered faces)
            center_distance = np.sqrt((center_x - frame_center_x)**2 + (center_y - frame_center_y)**2)
            max_distance = np.sqrt(frame_center_x**2 + frame_center_y**2)
            center_score = 1 - (center_distance / max_distance)
            
            # Size score (prefer larger faces)
            max_area = frame.shape[0] * frame.shape[1] * 0.25  # 25% of frame
            size_score = min(face_area / max_area, 1.0)
            
            # Overall quality score
            quality_score = (face_area * 0.4) + (center_score * 100) + (size_score * 100)
            
            if quality_score > best_quality and face_area > quality_threshold:
                best_quality = quality_score
                best_face = (x, y, w, h)
        
        # Draw rectangle around best face
        face_detected = False
        if best_face is not None:
            x, y, w, h = best_face
            
            # Color based on quality
            if best_quality > 200:
                color = (0, 255, 0)  # Green for excellent quality
                quality_text = "Excellent"
            elif best_quality > 150:
                color = (0, 255, 255)  # Yellow for good quality
                quality_text = "Good"
            else:
                color = (0, 165, 255)  # Orange for acceptable quality
                quality_text = "Acceptable"
            
            cv2.rectangle(display_frame, (x, y), (x + w, y + h), color, 2)
            cv2.putText(display_frame, f"Quality: {quality_text}", 
                       (x, y - 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            face_detected = True
        
        # Progress and status information
        cv2.putText(display_frame, f"Progress: {count}/{images_to_capture}", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
        
        cv2.putText(display_frame, f"Unique positions: {len(set(captured_positions))}", 
                   (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 1)
                   
        # Status messages
        if not face_detected:
            cv2.putText(display_frame, "No quality face detected! Position yourself properly.", 
                       (10, display_frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        elif capturing and countdown > 0:
            cv2.putText(display_frame, f"Capturing in: {countdown}", 
                       (10, display_frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 255), 2)
        else:
            cv2.putText(display_frame, "Press 'c' to capture or 'q' to quit", 
                       (10, display_frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        
        # Display the frame
        cv2.imshow("High-Quality Face Capture", display_frame)
        
        # Handle countdown for automatic capture
        if capturing:
            current_time = time.time()
            if current_time - last_capture_time >= 1.0:
                countdown -= 1
                last_capture_time = current_time
                
                if countdown <= 0:
                    capturing = False
                    
                    if best_face is not None:
                        x, y, w, h = best_face
                        
                        # Add some padding around the face
                        padding = 20
                        x_start = max(0, x - padding)
                        y_start = max(0, y - padding)
                        x_end = min(frame.shape[1], x + w + padding)
                        y_end = min(frame.shape[0], y + h + padding)
                        
                        # Crop and enhance face image
                        face = frame[y_start:y_end, x_start:x_end]
                        
                        # Resize to consistent size with high quality
                        face_resized = cv2.resize(face, (224, 224), interpolation=cv2.INTER_CUBIC)
                        
                        # Enhance image quality
                        # Histogram equalization for better contrast
                        face_gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
                        face_eq = cv2.equalizeHist(face_gray)
                        face_enhanced = cv2.cvtColor(face_eq, cv2.COLOR_GRAY2BGR)
                        
                        # Blend original and enhanced
                        face_final = cv2.addWeighted(face_resized, 0.7, face_enhanced, 0.3, 0)
                        
                        # Save locally
                        img_path = os.path.join(person_folder, f"{count:03d}.jpg")
                        cv2.imwrite(img_path, face_final, [cv2.IMWRITE_JPEG_QUALITY, 95])
                        
                        # Track position for variety
                        center_x = x + w // 2
                        center_y = y + h // 2
                        position_key = f"{center_x//50}_{center_y//50}"  # Grid-based position
                        captured_positions.append(position_key)
                        
                        print(f"✅ Saved high-quality image {count+1}/{images_to_capture} -> {img_path}")
                        print(f"   Quality score: {best_quality:.1f}, Position: {position_key}")
                        
                        # Upload to Firebase
                        print(f"📤 Uploading to Firebase...")
                        upload_result = upload_face_image_to_firebase(
                            face_final, 
                            studentid, 
                            student_name, 
                            safe_class, 
                            count
                        )
                        
                        if upload_result.get("success"):
                            print(f"   ✅ Firebase: {upload_result.get('url', 'Success')}")
                        else:
                            print(f"   ⚠️ Firebase failed: {upload_result.get('error', 'Unknown error')}")
                            print(f"   ℹ️ Image saved locally at {img_path}")
                        
                        count += 1
                    else:
                        print("❌ No suitable face detected during capture!")
        
        # Check for key presses
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q'):
            print("⛔ Capture canceled by user.")
            break
            
        elif key == ord('c') and not capturing and face_detected:
            capturing = True
            countdown = countdown_time
            last_capture_time = time.time()
            print(f"📸 Capturing high-quality image in {countdown} seconds...")
        
        # Auto-capture mode
        elif key == ord('a') and not capturing and face_detected:
            print("🔄 Auto-capture mode enabled. Press 'q' to stop.")
            capturing = True
            countdown = countdown_time
            last_capture_time = time.time()

    # Clean up
    camera.release()
    cv2.destroyAllWindows()
    
    # Report status
    if count >= images_to_capture:
        unique_positions = len(set(captured_positions))
        print(f"✅ Successfully captured all {count} high-quality images for {student_name} ({class_name})!")
        print(f"📊 Image variety: {unique_positions} unique positions captured")
        
        # Quality assessment
        if unique_positions >= images_to_capture * 0.7:
            print("🎯 Excellent variety! This should provide very good recognition accuracy.")
        elif unique_positions >= images_to_capture * 0.5:
            print("👍 Good variety! Recognition should work well.")
        else:
            print("⚠️ Consider adding more images from different angles for better accuracy.")
    else:
        print(f"⚠️ Captured {count}/{images_to_capture} images for {student_name} ({class_name}).")
    
    # Final note
    print(f"📂 Images saved in: {os.path.abspath(person_folder)}")
    
    # Instructions for next steps
    print("\n📋 Next steps:")
    print("1. Check Firebase Storage to verify uploads completed successfully")
    print("2. Run enroll_local.py to rebuild local encodings (encodings.pickle).")
    print("3. Run the main facial recognition system.")
    print("4. The system will automatically detect and recognize the newly added face.")
    print("5. If recognition doesn't work well, try adding more images with different poses and lighting")
    print("\n💡 NOTE: Images are being uploaded to Firebase Storage in real-time.")
    print("   If Firebase upload fails, images are still saved locally and can be synced later.")

if __name__ == "__main__":
    main()

