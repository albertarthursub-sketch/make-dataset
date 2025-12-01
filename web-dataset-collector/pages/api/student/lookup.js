// BINUS API Configuration
const BINUS_AUTH_HEADER = 'Basic OUQyQjdEN0EtREFDQy00QkEyLTg3QTAtNUFGNDVDOUZCRTgy';
const BINUS_TOKEN_URL = 'http://binusian.ws/binusschool/auth/token';
const BINUS_ENROLLMENT_URL = 'http://binusian.ws/binusschool/bss-student-enrollment';

let cachedToken = null;
let tokenExpireTime = null;

// Get token from BINUS API
async function getBINUSToken() {
  try {
    // Return cached token if still valid
    if (cachedToken && tokenExpireTime && Date.now() < tokenExpireTime) {
      return cachedToken;
    }

    const response = await fetch(BINUS_TOKEN_URL, {
      method: 'GET',
      headers: {
        'Authorization': BINUS_AUTH_HEADER,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Token API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.resultCode !== 200) {
      throw new Error(`Token API error: ${data.errorMessage}`);
    }

    // Cache token with 50-second expiry (token lasts 60 seconds)
    cachedToken = data.data.token;
    tokenExpireTime = Date.now() + (data.data.duration * 1000 * 0.8);

    console.log('✓ BINUS Token obtained successfully');
    return cachedToken;
  } catch (error) {
    console.error('Failed to get BINUS token:', error.message);
    throw error;
  }
}

// Get student enrollment data from BINUS API
async function getStudentEnrollment(studentId, token) {
  try {
    const response = await fetch(BINUS_ENROLLMENT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        IdStudent: studentId.toString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Enrollment API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.resultCode !== 200) {
      throw new Error(`Enrollment API error: ${data.errorMessage}`);
    }

    return data.studentDataResponse;
  } catch (error) {
    console.error('Failed to get student enrollment:', error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    // Get token
    console.log(`Looking up student: ${studentId}`);
    const token = await getBINUSToken();

    // Get student enrollment data
    const enrollment = await getStudentEnrollment(studentId, token);

    return res.status(200).json({
      success: true,
      student: {
        name: enrollment.studentName,
        class: enrollment.class,
        grade: enrollment.gradeName,
        studentId: studentId.toString(),
      },
    });
  } catch (error) {
    console.error('Student lookup error:', error.message);
    return res.status(404).json({
      success: false,
      message: `Student ID ${req.body?.studentId} not found or API error: ${error.message}`,
    });
  }
}
