import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { getFirebaseStorage, getFirestoreDB, initializeFirebase } from '../../../lib/firebase-admin';

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
    // Initialize Firebase
    initializeFirebase();

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

    // Try Firebase Storage first
    let uploadSuccess = false;
    let storageUrl = null;
    let uploadMethod = null;
    
    try {
      console.log('\n--- Attempting Firebase Storage upload ---');
      
      const storage = getFirebaseStorage();
      const bucket = storage.bucket();
      console.log('✓ Storage bucket connected:', bucket.name);
      
      const fileName = `face_dataset/${className}/${studentName}/${position}_${Date.now()}.jpg`;
      console.log('Uploading file:', fileName);
      
      const file = bucket.file(fileName);
      const saveResult = await file.save(imageBuffer, {
        metadata: {
          contentType: 'image/jpeg',
        }
      });

      storageUrl = `gs://${process.env.FIREBASE_STORAGE_BUCKET}/${fileName}`;
      uploadSuccess = true;
      uploadMethod = 'Firebase Storage';
      console.log(`✓ Firebase upload successful: ${fileName}`);
      console.log('Save result:', saveResult);
    } catch (fbError) {
      console.error(`✗ Firebase Storage error: ${fbError.message}`);
      console.error('Error name:', fbError.name);
      console.error('Error code:', fbError.code);
      console.error('Full error:', JSON.stringify(fbError, null, 2));
      console.error('Stack:', fbError.stack);
      
      // Fallback to local storage
      try {
        console.log('\n--- Fallback to local storage ---');
        const localDir = path.join(process.cwd(), 'public', 'uploads', className, studentName);
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
          console.log('Created directory:', localDir);
        }
        const localFileName = `${position}_${Date.now()}.jpg`;
        const localPath = path.join(localDir, localFileName);
        fs.writeFileSync(localPath, imageBuffer);
        storageUrl = `/uploads/${className}/${studentName}/${localFileName}`;
        uploadSuccess = true;
        uploadMethod = 'Local Storage (Firebase unavailable)';
        console.log(`✓ Local storage success: ${storageUrl}`);
      } catch (localErr) {
        console.error(`✗ Local storage error: ${localErr.message}`);
        console.error('Stack:', localErr.stack);
      }
    }

    // Save metadata to Firestore if available
    try {
      const db = getFirestoreDB();
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
      console.error('❌ UPLOAD FAILED - No storage available');
      return res.status(500).json({ 
        error: 'Upload failed - no storage available',
        message: 'Could not upload to Firebase or local storage'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Image upload successful',
      uploadMethod,
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
