export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { studentId, studentName, className, images } = req.body;

    if (!studentId || !studentName || !className || !images || Object.keys(images).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields or no images',
      });
    }

    // Forward upload request to backend for Firebase storage
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    
    const uploadPromises = Object.entries(images).map(([position, imageData]) => {
      return fetch(`${backendUrl}/api/upload-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          studentId,
          studentName,
          className,
          position,
        }),
      }).then(res => res.json());
    });

    const uploadResults = await Promise.all(uploadPromises);
    
    // Check if all uploads succeeded
    const allSuccess = uploadResults.every(result => result.success);
    const uploadedCount = uploadResults.filter(result => result.success).length;

    if (!allSuccess) {
      console.error('Some uploads failed:', uploadResults);
      return res.status(500).json({
        success: false,
        error: `Only ${uploadedCount}/${uploadResults.length} images uploaded successfully`,
        details: uploadResults,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All images successfully uploaded to Firebase',
      uploaded: uploadedCount,
      student: {
        id: studentId,
        name: studentName,
        class: className,
      },
      paths: uploadResults.map(r => r.firebase_path).filter(Boolean),
    });
  } catch (error) {
    console.error('Upload images error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process upload: ' + error.message,
    });
  }
}
