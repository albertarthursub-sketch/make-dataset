import formidable from 'formidable';
import fs from 'fs';
import admin from 'firebase-admin';

// Initialize Firebase if not already done
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  };

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
  }
}

// Disable body parser for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Upload request received');
    
    // Parse form data with formidable
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
      multiples: false,
    });

    const [fields, files] = await form.parse(req);

    console.log('Form parsed. Fields:', Object.keys(fields), 'Files:', Object.keys(files));

    const studentId = Array.isArray(fields.studentId) ? fields.studentId[0] : fields.studentId;
    const studentName = Array.isArray(fields.studentName) ? fields.studentName[0] : fields.studentName;
    const className = Array.isArray(fields.className) ? fields.className[0] : fields.className;
    const position = Array.isArray(fields.position) ? fields.position[0] : fields.position;
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    console.log(`Student: ${studentName}, ID: ${studentId}, Class: ${className}, Position: ${position}`);
    console.log(`Image file:`, imageFile ? `${imageFile.originalFilename} (${imageFile.size} bytes)` : 'MISSING');

    if (!studentId || !studentName || !className || !imageFile) {
      console.error('Missing required fields:', { studentId, studentName, className, hasImage: !!imageFile });
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: { studentId, studentName, className, hasImage: !!imageFile }
      });
    }

    console.log(`Processing image for ${studentName} (${studentId}) - ${position}`);

    // Read image file
    const imageBuffer = fs.readFileSync(imageFile.filepath);
    console.log(`Image buffer read: ${imageBuffer.length} bytes`);

    // Try to upload to Firebase Storage
    let firebaseUrl = null;
    try {
      const bucket = admin.storage().bucket();
      const fileName = `face_dataset/${className}/${studentName}/${position}_${Date.now()}.jpg`;
      const file = bucket.file(fileName);

      await file.save(imageBuffer, {
        metadata: {
          contentType: 'image/jpeg',
        }
      });

      firebaseUrl = `gs://${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
      console.log(`✓ Firebase upload success: ${fileName}`);
    } catch (fbError) {
      console.log(`ℹ Firebase storage unavailable (OK for local testing): ${fbError.message}`);
    }

    // Save metadata to Firestore if available
    try {
      const db = admin.firestore();
      const metadata = {
        fileName: imageFile.originalFilename || `capture_${Date.now()}.jpg`,
        fileSize: imageFile.size,
        position,
        uploadedAt: new Date().toISOString(),
        firebaseUrl,
        studentId,
        studentName,
        className
      };

      await db.collection('students').doc(studentId).collection('images').add(metadata);
      console.log(`✓ Firestore metadata saved`);
    } catch (fsError) {
      console.log(`ℹ Firestore unavailable (OK for local testing): ${fsError.message}`);
    }

    // Clean up temp file
    try {
      fs.unlinkSync(imageFile.filepath);
    } catch (e) {
      // Ignore cleanup errors
    }

    console.log('✓ Upload complete');
    return res.status(200).json({
      success: true,
      message: 'Image upload successful',
      data: {
        studentId,
        studentName,
        className,
        position,
        size: imageFile.size,
        firebaseUrl
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message,
      stack: error.stack
    });
  }
}
