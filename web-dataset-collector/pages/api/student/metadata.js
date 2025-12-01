// Note: Metadata saving is handled by the Flask backend on Railway
// This endpoint is kept for compatibility but returns a success response

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

    // Metadata is saved by the backend (Railway) during image upload
    // This endpoint just acknowledges the request
    return res.status(200).json({
      success: true,
      message: 'Metadata received (saved by backend)',
      metadata: metadata
    });

  } catch (error) {
    console.error('Error processing metadata:', error);
    return res.status(500).json({ 
      error: 'Failed to process metadata',
      message: error.message 
    });
  }
}
