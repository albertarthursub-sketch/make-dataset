/**
 * Debug endpoint to verify Firebase configuration
 * Helps diagnose Firebase upload issues
 */

import { initializeFirebase, getFirebaseStorage, getFirestoreDB } from '../../../lib/firebase-admin';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('\n=== FIREBASE CONFIG DEBUG ===\n');

    // Check environment variables
    const envCheck = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? '✓ SET' : '❌ MISSING',
      FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID ? '✓ SET' : '❌ MISSING',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? '✓ SET' : '❌ MISSING',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? '✓ SET' : '❌ MISSING',
      FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID ? '✓ SET' : '❌ MISSING',
      FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET ? '✓ SET' : '❌ MISSING',
    };

    console.log('Environment Variables:');
    console.log(JSON.stringify(envCheck, null, 2));

    // Attempt to initialize Firebase
    let initStatus = 'Not attempted';
    let bucketInfo = null;
    let error = null;

    try {
      initializeFirebase();
      initStatus = '✓ Initialized successfully';

      // Try to connect to storage bucket
      try {
        const storage = getFirebaseStorage();
        const bucket = storage.bucket();
        
        // Get bucket name from environment
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
        
        console.log(`\nStorage Bucket Connection:`);
        console.log(`  Bucket Name: ${bucketName}`);
        console.log(`  Expected Pattern: project-id.appspot.com`);
        
        bucketInfo = {
          name: bucketName,
          status: '✓ Connected',
          pattern: bucketName?.includes('.appspot.com') ? 'Valid' : 'Invalid Pattern'
        };
      } catch (storageErr) {
        console.error(`Storage connection error: ${storageErr.message}`);
        bucketInfo = {
          status: '❌ Connection failed',
          error: storageErr.message
        };
      }

      // Try Firestore connection
      let firestoreStatus = 'Not checked';
      try {
        const db = getFirestoreDB();
        firestoreStatus = '✓ Connected';
      } catch (fsErr) {
        console.error(`Firestore error: ${fsErr.message}`);
        firestoreStatus = `❌ ${fsErr.message}`;
      }

      return res.status(200).json({
        status: 'success',
        firebase: {
          initialization: initStatus,
          storage: bucketInfo,
          firestore: firestoreStatus,
        },
        environment: envCheck,
        environmentValues: {
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
          FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
          FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (initErr) {
      console.error(`Firebase initialization failed: ${initErr.message}`);
      error = initErr.message;
      
      return res.status(200).json({
        status: 'error',
        firebase: {
          initialization: `❌ ${error}`,
          storage: null,
          firestore: null,
        },
        environment: envCheck,
        error: error,
        timestamp: new Date().toISOString(),
      });
    }

  } catch (err) {
    console.error('Debug endpoint error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
    });
  }
}
