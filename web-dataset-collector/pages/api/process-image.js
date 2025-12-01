export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { image, studentId, studentName, className, position } = req.body;

    if (!image || !studentId || !studentName || !className || !position) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    // Forward request to Python backend
    const response = await fetch(`${backendUrl}/api/process-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image,
        studentId,
        studentName,
        className,
        position,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Process image error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process image',
    });
  }
}
