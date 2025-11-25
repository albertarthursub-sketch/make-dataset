# enroll_local.py
# Run this script ONCE to create your metrics file.

import os
from pathlib import Path

import cv2
import pickle
import numpy as np
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")
load_dotenv()

try:
    import dlib  
    DLIB_AVAILABLE = True
except Exception:
    DLIB_AVAILABLE = False
DLIB_MODEL_PATH = os.environ.get('DLIB_LANDMARK_MODEL', 'shape_predictor_68_face_landmarks.dat')
DLIB_FACE_REC_MODEL_PATH = os.environ.get('DLIB_FACE_REC_MODEL', 'dlib_face_recognition_resnet_model_v1.dat')
_CNN_WARNING_EMITTED = False

# --- CONFIGURATION ---
# 1. SET THIS to the path of your local photo folder
# Default now points to the images saved by make_dataset.py
DATASET_PATH = "face_dataset"

# 2. SET THIS to the name of the metrics file you want to create
ENCODINGS_FILE = "encodings.pickle"
# --- ---

def _compute_landmark_embedding_from_bbox(rgb_image, bbox, predictor, shape=None):
    """Compute 136-d normalized embedding from dlib 68 landmarks."""
    try:
        top, right, bottom, left = bbox
        if shape is None:
            rect = dlib.rectangle(int(left), int(top), int(right), int(bottom))
            gray = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
            shape = predictor(gray, rect)
        pts = np.array([(shape.part(i).x, shape.part(i).y) for i in range(68)], dtype=np.float32)
        mean = pts.mean(axis=0)
        pts_c = pts - mean
        left_eye = pts[36:42].mean(axis=0)
        right_eye = pts[42:48].mean(axis=0)
        scale = float(np.linalg.norm(right_eye - left_eye))
        if scale <= 1e-6:
            w = max(1.0, right - left)
            h = max(1.0, bottom - top)
            scale = float(np.hypot(w, h))
        emb = (pts_c / scale).flatten().astype(np.float32)
        n = float(np.linalg.norm(emb))
        if n > 1e-6:
            emb /= n
        return emb
    except Exception:
        return None

def _compute_cnn_embedding_from_shape(rgb_image, shape, cnn_model):
    """Compute 128-d embedding from dlib face recognition model using an existing shape."""
    try:
        if cnn_model is None or shape is None:
            return None
        chip = dlib.get_face_chip(rgb_image, shape, size=150)
        descriptor = cnn_model.compute_face_descriptor(chip)
        vec = np.array(descriptor, dtype=np.float32)
        norm = float(np.linalg.norm(vec))
        if norm > 1e-6:
            vec /= norm
        return vec
    except Exception:
        return None

def enroll_local_students():
    """
    Scans the local dataset path, generates encodings for the
    single photo of each student, and saves them to a pickle file.
    """
    global _CNN_WARNING_EMITTED

    print(f"Starting enrollment from '{DATASET_PATH}'...")
    
    known_face_encodings = []
    known_face_names = []
    known_face_classes = []
    known_face_cnn_encodings = []
    
    # Walk through the directory structure
    # os.walk gives us:
    # dirpath (e.g., "local_dataset/10A/John_Doe")
    # dirnames (subfolders, e.g., [])
    # filenames (files in that folder, e.g., ["photo.jpg"])
    
    for dirpath, dirnames, filenames in os.walk(DATASET_PATH):
        # Check if we are in a student's folder (it will contain files)
        if not filenames:
            continue
            
        # We are in a student's folder. Let's get the name and class.
        # This is a bit of path magic
        parts = dirpath.split(os.path.sep)
        
        # Support two layouts:
        # 1) .../face_dataset/<BinusianID> (no class level)
        # 2) .../local_photo/<ClassName>/<StudentName>
        student_name = parts[-1]
        class_name = ""
        if len(parts) >= 3:
            # Heuristic: if the immediate parent is not the root dataset folder name,
            # treat it as class name (layout 2). Otherwise leave class_name empty.
            parent = parts[-2]
            dataset_folder = os.path.basename(os.path.abspath(DATASET_PATH))
            if parent and parent != dataset_folder:
                class_name = parent
        
        # Find the first valid image file
        for filename in filenames:
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                image_path = os.path.join(dirpath, filename)
                print(f"Processing: Class={class_name}, Student={student_name}, File={image_path}")

                try:
                    # Load the image
                    image = cv2.imread(image_path)
                    if image is None:
                        print(f"  ⚠️ Warning: Unable to read image {image_path}, skipping.")
                        continue

                    # Initialize predictor and HOG detector once
                    global _ENROLL_PREDICTOR, _ENROLL_HOG_DET
                    if '_ENROLL_PREDICTOR' not in globals():
                        _ENROLL_PREDICTOR = None
                    if '_ENROLL_HOG_DET' not in globals():
                        _ENROLL_HOG_DET = None
                    if '_ENROLL_CNN_MODEL' not in globals():
                        _ENROLL_CNN_MODEL = None

                    if DLIB_AVAILABLE and _ENROLL_PREDICTOR is None:
                        if os.path.exists(DLIB_MODEL_PATH):
                            _ENROLL_PREDICTOR = dlib.shape_predictor(DLIB_MODEL_PATH)
                        else:
                            print(f"  ❌ Missing dlib landmark model at '{DLIB_MODEL_PATH}'. Cannot compute embeddings.")

                    if DLIB_AVAILABLE and _ENROLL_HOG_DET is None:
                        try:
                            _ENROLL_HOG_DET = dlib.get_frontal_face_detector()
                        except Exception:
                            _ENROLL_HOG_DET = None

                    if DLIB_AVAILABLE and _ENROLL_CNN_MODEL is None:
                        if os.path.exists(DLIB_FACE_REC_MODEL_PATH):
                            try:
                                _ENROLL_CNN_MODEL = dlib.face_recognition_model_v1(DLIB_FACE_REC_MODEL_PATH)
                            except Exception as cnn_ex:
                                print(f"  ⚠️ Unable to load face recognition model: {cnn_ex}")
                                _ENROLL_CNN_MODEL = None
                        else:
                            if not _CNN_WARNING_EMITTED:
                                print(f"  ⚠️ Face recognition model not found at '{DLIB_FACE_REC_MODEL_PATH}'. CNN embeddings will be skipped.")
                                _CNN_WARNING_EMITTED = True

                    # Detect faces using HOG only
                    face_locations = []
                    if _ENROLL_HOG_DET is not None:
                        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                        dets = _ENROLL_HOG_DET(gray, 0)
                        for r in dets:
                            face_locations.append((r.top(), r.right(), r.bottom(), r.left()))
                    else:
                        print("  ❌ No dlib HOG detector available. Install dlib to proceed.")

                    if len(face_locations) == 1 and _ENROLL_PREDICTOR is not None:
                        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                        top, right, bottom, left = face_locations[0]
                        rect = dlib.rectangle(int(left), int(top), int(right), int(bottom))
                        shape = _ENROLL_PREDICTOR(gray, rect)

                        encoding = _compute_landmark_embedding_from_bbox(rgb, face_locations[0], _ENROLL_PREDICTOR, shape)
                        if encoding is None:
                            print("  ⚠️ Could not compute landmark embedding. Skipping.")
                            continue

                        cnn_encoding = _compute_cnn_embedding_from_shape(rgb, shape, _ENROLL_CNN_MODEL)

                        known_face_encodings.append(encoding)
                        known_face_cnn_encodings.append(cnn_encoding)
                        known_face_names.append(student_name)
                        known_face_classes.append(class_name)
                        print(f"  ✅ Successfully encoded {student_name}.")
                    elif len(face_locations) > 1:
                        print(f"  ⚠️ Warning: Found {len(face_locations)} faces. Only use photos with ONE face. Skipping.")
                    else:
                        print(f"  ⚠️ Warning: No faces detected or landmark model missing for {image_path}. Skipping.")
                except Exception as e:
                    print(f"  ❌ Error processing {image_path}: {e}")
                
                # Since multiple images may exist, we use only the first valid one per student
                break 

    # --- Save the metrics to the pickle file ---
    print(f"\nEnrollment complete. Found {len(known_face_encodings)} students.")
    print(f"Saving metrics to '{ENCODINGS_FILE}'...")
    
    # Ensure cnn list aligns with others
    if len(known_face_cnn_encodings) < len(known_face_encodings):
        known_face_cnn_encodings.extend([None] * (len(known_face_encodings) - len(known_face_cnn_encodings)))

    data = {
        "encodings": known_face_encodings,  # Legacy key
        "landmark_encodings": known_face_encodings,
        "cnn_encodings": known_face_cnn_encodings,
        "names": known_face_names,
        "classes": known_face_classes
    }
    
    with open(ENCODINGS_FILE, 'wb') as f:
        pickle.dump(data, f)
        
    print("✅ Done. You can now run your main application.")

if __name__ == "__main__":
    enroll_local_students()