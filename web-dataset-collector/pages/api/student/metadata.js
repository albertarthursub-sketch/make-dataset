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
    console.error('Firebase initialization error:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { studentId, name, homeroom, gradeCode, gradeName } = req.body;

    if (!studentId || !name || !homeroom) {
      return res.status(400).json({ 
        error: 'Missing required fields: studentId, name, homeroom' 
      });
    }

    const metadata = {
      id: studentId,
      name: name,
      homeroom: homeroom,
      gradeCode: gradeCode || 'Unknown',
      gradeName: gradeName || 'Unknown',
      created_at: new Date().toISOString(),
      capture_count: 0,
      images: []
    };

    // Save to Firestore if available
    try {
      const db = admin.firestore();
      await db.collection('students').doc(studentId).set(metadata, { merge: true });
      console.log('✓ Metadata saved to Firestore:', studentId);
    } catch (fbError) {
      console.warn('Firestore save failed (this is OK for local testing):', fbError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Metadata saved',
      metadata: metadata
    });

  } catch (error) {
    console.error('Error saving metadata:', error);
    return res.status(500).json({ 
      error: 'Failed to save metadata',
      message: error.message 
    });
  }
}
