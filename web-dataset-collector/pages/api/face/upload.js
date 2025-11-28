import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
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
    console.log('Initializing Firebase Admin...');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('✓ Firebase Admin initialized');
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
    console.log('\n=== UPLOAD REQUEST START ===');
    
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

    // Try local storage first (faster, no Firebase needed)
    let uploadSuccess = false;
    let storageUrl = null;
    
    try {
      console.log('Attempting local storage save...');
      const localDir = path.join(process.cwd(), 'public', 'uploads', className, studentName);
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      const localFileName = `${position}_${Date.now()}.jpg`;
      const localPath = path.join(localDir, localFileName);
      fs.writeFileSync(localPath, imageBuffer);
      storageUrl = `/uploads/${className}/${studentName}/${localFileName}`;
      uploadSuccess = true;
      console.log(`✓ Local storage success: ${storageUrl}`);
    } catch (localErr) {
      console.error(`✗ Local storage error: ${localErr.message}`);
    }

    // Try Firebase Storage as backup
    if (!uploadSuccess) {
      try {
        console.log('Attempting Firebase Storage upload...');
        const bucket = admin.storage().bucket();
        console.log('Bucket obtained:', bucket.name);
        
        const fileName = `face_dataset/${className}/${studentName}/${position}_${Date.now()}.jpg`;
        const file = bucket.file(fileName);

        console.log('Uploading to:', fileName);
        await file.save(imageBuffer, {
          metadata: {
            contentType: 'image/jpeg',
          }
        });

        storageUrl = `gs://${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
        uploadSuccess = true;
        console.log(`✓ Firebase upload success: ${fileName}`);
      } catch (fbError) {
        console.error(`✗ Firebase storage error: ${fbError.message}`);
        console.error('Firebase error details:', fbError);
      }
    }

    // Save metadata to Firestore if available
    try {
      const db = admin.firestore();
      const metadata = {
        fileName: imageFile.originalFilename || `capture_${Date.now()}.jpg`,
        fileSize: imageFile.size,
        position,
        uploadedAt: new Date().toISOString(),
        storageUrl,
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

    console.log('✓ Upload complete\n');
    
    if (!uploadSuccess) {
      return res.status(500).json({ 
        error: 'Upload failed - no storage available',
        message: 'Could not upload to Firebase or local storage'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Image upload successful',
      data: {
        studentId,
        studentName,
        className,
        position,
        size: imageFile.size,
        storageUrl
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({ 
      error: 'Upload failed',
      message: error.message,
      stack: error.stack
    });
  }
}
