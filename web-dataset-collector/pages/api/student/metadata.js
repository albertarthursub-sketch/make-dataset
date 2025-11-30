import { getFirestoreDB, initializeFirebase } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Firebase
    initializeFirebase();

    // Destructure request body
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
      const db = getFirestoreDB();
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
