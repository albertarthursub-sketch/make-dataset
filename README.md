Instructions:
1. Make dataset
2. Enroll local
3. Collect metrics (+ encodings)
4. RUn main file

Model assets (place beside the scripts or set env vars):
- `shape_predictor_68_face_landmarks.dat` (`DLIB_LANDMARK_MODEL`)
- `dlib_face_recognition_resnet_model_v1.dat` (`DLIB_FACE_REC_MODEL`)

The enrollment step now generates both 136-D landmark embeddings and 128-D CNN embeddings so the runtime can fuse them for better accuracy. If the CNN weights are missing, the pipeline gracefully falls back to landmark-only mode.

---

API lookup (Part C2) — ID → Name/Class

You can look up a student’s name and class by ID using the API.

Option A: Direct C2 (ID-only)
- Set environment variables per your API doc:
	- BSS_C2_URL: Full endpoint URL for the ID lookup
	- BSS_C2_BODY_KEY: Body key for the student ID (default: IdStudent)
	- BSS_C2_BODY_MODE: 'single' (default) to send {IdStudent: "..."} or 'list' to send {IdStudent: ["..."]}
- Then run:

	python3 main.py --lookup-id <STUDENT_ID>

This prints the Name and Class (if class/homeroom field is present in the response).

Option B: Class-based lookup (requires grade/homeroom)

	python3 main.py --lookup-id <STUDENT_ID> --grade <GRADE> --homeroom <HOMEROOM>

Notes
- Token retrieval is automatic.
- Detection pipeline is HOG-only with dlib 68-landmarks.
- Recognition uses hybrid CNN+landmark embeddings by default (`CONFIG["embedding_mode"]`). Set it to `"landmarks"` or `"cnn"` if you want to force one branch. Adjust fusion weights via `CONFIG["embedding_component_weights"]`.
- Ensemble distance weights can be left as "default" or customized in CONFIG.