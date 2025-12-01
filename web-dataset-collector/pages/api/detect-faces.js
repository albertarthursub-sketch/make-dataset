/**
 * Real-time Face Detection API
 * Detects faces in image without processing/cropping
 * Used for live camera overlay feedback
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    // Forward to Python backend for detection only
    const response = await fetch('http://localhost:5000/api/detect-faces', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }),
      timeout: 5000, // Quick response for real-time
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        faces: [],
        message: 'Detection failed',
      });
    }

    const result = await response.json();

    return res.status(200).json({
      success: result.success || false,
      faces: result.faces || [],
      faces_detected: result.faces_detected || 0,
    });
  } catch (error) {
    console.error('Face detection error:', error.message);
    return res.status(200).json({
      success: false,
      faces: [],
      faces_detected: 0,
    });
  }
}
