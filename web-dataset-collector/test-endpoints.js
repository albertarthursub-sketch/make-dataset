#!/usr/bin/env node
/**
 * API Endpoint Testing Script
 * Tests all enrollment, attendance, and dashboard endpoints
 */

const BASE_URL = 'http://localhost:3000'; // Frontend running on port 3000
const BACKEND_URL = 'http://localhost:5000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

async function makeRequest(method, endpoint, body = null) {
  try {
    const url = `${BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      error: error.message
    };
  }
}

async function testHealthCheck() {
  console.log(`\n${colors.blue}${colors.bold}TEST 1: Health Check${colors.reset}`);
  const result = await makeRequest('GET', '/api/health');
  
  if (result.ok && result.status === 200) {
    console.log(`${colors.green}✓ PASS${colors.reset} - Health check working`);
    console.log(`  Status: ${result.status}, Service: ${result.data.service}`);
    return true;
  } else {
    console.log(`${colors.red}✗ FAIL${colors.reset} - Health check failed`);
    console.log(`  Error:`, result.error || result.data);
    return false;
  }
}

async function testStudentLookup() {
  console.log(`\n${colors.blue}${colors.bold}TEST 2: Student Lookup${colors.reset}`);
  
  // Test with a valid student ID (you may need to adjust this)
  const testStudentId = '30206054'; // Example student ID
  
  const result = await makeRequest('POST', '/api/student/lookup', {
    studentId: testStudentId
  });
  
  if (result.ok && result.status === 200) {
    console.log(`${colors.green}✓ PASS${colors.reset} - Student lookup working`);
    console.log(`  Student: ${result.data.name} (ID: ${result.data.id})`);
    console.log(`  Class: ${result.data.homeroom}`);
    return { success: true, data: result.data };
  } else {
    console.log(`${colors.yellow}⚠ WARN${colors.reset} - Student lookup returned error`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response:`, result.data || result.error);
    
    // This might fail if Binus API is unreachable, which is OK
    if (result.error && result.error.includes('Failed to authenticate')) {
      console.log(`  ${colors.yellow}Note: Binus API may be unreachable (OK for local testing)${colors.reset}`);
    }
    
    // Return mock data for continuation
    return {
      success: false,
      data: {
        id: testStudentId,
        name: 'Test Student',
        homeroom: '10-A',
        gradeCode: '10',
        gradeName: 'Grade 10'
      }
    };
  }
}

async function testStudentMetadata(studentData) {
  console.log(`\n${colors.blue}${colors.bold}TEST 3: Save Student Metadata${colors.reset}`);
  
  const result = await makeRequest('POST', '/api/student/metadata', {
    studentId: studentData.id,
    name: studentData.name,
    homeroom: studentData.homeroom,
    gradeCode: studentData.gradeCode,
    gradeName: studentData.gradeName
  });
  
  if (result.ok && result.status === 200) {
    console.log(`${colors.green}✓ PASS${colors.reset} - Metadata saved successfully`);
    console.log(`  Message: ${result.data.message}`);
    return true;
  } else {
    console.log(`${colors.red}✗ FAIL${colors.reset} - Metadata save failed`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response:`, result.data || result.error);
    return false;
  }
}

async function testAttendanceRecording(studentData) {
  console.log(`\n${colors.blue}${colors.bold}TEST 4: Record Attendance${colors.reset}`);
  
  const result = await makeRequest('POST', '/api/dashboard/attendance', {
    studentId: studentData.id,
    studentName: studentData.name,
    className: studentData.homeroom,
    gradeCode: studentData.gradeCode,
    gradeName: studentData.gradeName,
    accuracy: 95.5,
    method: 'face_recognition'
  });
  
  if (result.ok && result.status === 200) {
    console.log(`${colors.green}✓ PASS${colors.reset} - Attendance recorded successfully`);
    console.log(`  Record ID: ${result.data.id}`);
    console.log(`  Message: ${result.data.message}`);
    return true;
  } else {
    console.log(`${colors.red}✗ FAIL${colors.reset} - Attendance recording failed`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response:`, result.data || result.error);
    return false;
  }
}

async function testAttendanceRetrieval(studentData) {
  console.log(`\n${colors.blue}${colors.bold}TEST 5: Retrieve Attendance Records${colors.reset}`);
  
  const query = new URLSearchParams({
    studentId: studentData.id,
    limit: 10
  }).toString();
  
  const result = await makeRequest('GET', `/api/dashboard/attendance?${query}`);
  
  if (result.ok && result.status === 200) {
    console.log(`${colors.green}✓ PASS${colors.reset} - Attendance retrieval working`);
    console.log(`  Total records: ${result.data.records?.length || 0}`);
    if (result.data.records && result.data.records.length > 0) {
      console.log(`  Latest record: ${result.data.records[0].studentName} at ${result.data.records[0].time}`);
    }
    return true;
  } else {
    console.log(`${colors.yellow}⚠ WARN${colors.reset} - Attendance retrieval returned error`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response:`, result.data || result.error);
    return false;
  }
}

async function testAnalytics() {
  console.log(`\n${colors.blue}${colors.bold}TEST 6: Get Analytics${colors.reset}`);
  
  const result = await makeRequest('GET', '/api/dashboard/analytics?timeframe=24h');
  
  if (result.ok && result.status === 200) {
    console.log(`${colors.green}✓ PASS${colors.reset} - Analytics API working`);
    console.log(`  Total searches: ${result.data.metrics?.totalSearches || 0}`);
    console.log(`  Total captures: ${result.data.metrics?.totalCaptures || 0}`);
    console.log(`  Success rate: ${result.data.metrics?.successRate || 0}%`);
    return true;
  } else {
    console.log(`${colors.yellow}⚠ WARN${colors.reset} - Analytics retrieval returned error`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response:`, result.data || result.error);
    return false;
  }
}

async function testGenerateReport(studentData) {
  console.log(`\n${colors.blue}${colors.bold}TEST 7: Generate Claude Report${colors.reset}`);
  
  const result = await makeRequest('POST', '/api/dashboard/claude-report', {
    reportType: 'daily',
    date: new Date().toISOString().split('T')[0]
  });
  
  if (result.ok && result.status === 200) {
    console.log(`${colors.green}✓ PASS${colors.reset} - Report generation working`);
    console.log(`  Report ID: ${result.data.reportId}`);
    console.log(`  Type: ${result.data.reportType}`);
    if (result.data.report) {
      console.log(`  Report preview: ${result.data.report.substring(0, 100)}...`);
    }
    return true;
  } else {
    console.log(`${colors.yellow}⚠ WARN${colors.reset} - Report generation returned error`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Response:`, result.data || result.error);
    
    if (result.data?.error?.includes('Claude API key')) {
      console.log(`  ${colors.yellow}Note: Claude API key not configured (OK for now)${colors.reset}`);
    }
    
    return false;
  }
}

async function testBackendHealth() {
  console.log(`\n${colors.blue}${colors.bold}TEST 8: Backend Health Check${colors.reset}`);
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✓ PASS${colors.reset} - Backend service running`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Service: ${data.service}`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠ WARN${colors.reset} - Backend returned error`);
      console.log(`  Response:`, data);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ FAIL${colors.reset} - Cannot reach backend at ${BACKEND_URL}`);
    console.log(`  Error: ${error.message}`);
    console.log(`  ${colors.yellow}Make sure Flask backend is running with: python facial_recognition_backend.py${colors.reset}`);
    return false;
  }
}

async function runAllTests() {
  console.log(`\n${colors.bold}${colors.blue}════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}  API ENDPOINT TEST SUITE${colors.reset}`);
  console.log(`${colors.blue}════════════════════════════════════════════════${colors.reset}\n`);
  console.log(`Testing endpoints at: ${BASE_URL}`);
  console.log(`Testing backend at: ${BACKEND_URL}\n`);

  const results = {};

  // Test backend first
  results.backend = await testBackendHealth();

  // Test frontend API endpoints
  results.health = await testHealthCheck();
  
  const studentLookup = await testStudentLookup();
  results.studentLookup = studentLookup.success;
  
  results.metadata = await testStudentMetadata(studentLookup.data);
  results.attendanceRecord = await testAttendanceRecording(studentLookup.data);
  results.attendanceRetrieval = await testAttendanceRetrieval(studentLookup.data);
  results.analytics = await testAnalytics();
  results.report = await testGenerateReport(studentLookup.data);

  // Summary
  console.log(`\n${colors.bold}${colors.blue}════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bold}  TEST SUMMARY${colors.reset}`);
  console.log(`${colors.blue}════════════════════════════════════════════════${colors.reset}\n`);

  const passed = Object.values(results).filter(r => r === true).length;
  const failed = Object.values(results).filter(r => r === false).length;
  const total = Object.values(results).length;

  console.log(`Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${failed}${colors.reset}`);
  console.log(`Total:  ${total}\n`);

  // Detailed breakdown
  console.log(`${colors.bold}Endpoint Status:${colors.reset}`);
  console.log(`  Health Check:            ${results.health ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
  console.log(`  Student Lookup:          ${results.studentLookup ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
  console.log(`  Save Metadata:           ${results.metadata ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
  console.log(`  Record Attendance:       ${results.attendanceRecord ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
  console.log(`  Retrieve Attendance:     ${results.attendanceRetrieval ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
  console.log(`  Analytics:               ${results.analytics ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
  console.log(`  Report Generation:       ${results.report ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}`);
  console.log(`  Backend Service:         ${results.backend ? colors.green + '✓' : colors.red + '✗'} ${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}${colors.bold}✓ ALL TESTS PASSED!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠ Some tests failed or need attention${colors.reset}`);
  }

  console.log(`\n${colors.bold}Next Steps:${colors.reset}`);
  console.log(`1. Ensure frontend is running: ${colors.yellow}npm run dev${colors.reset} (port 3000)`);
  console.log(`2. Ensure backend is running: ${colors.yellow}python facial_recognition_backend.py${colors.reset} (port 5000)`);
  console.log(`3. Configure environment variables in .env.local`);
  console.log(`4. Test the enrollment flow at ${colors.yellow}${BASE_URL}${colors.reset}\n`);
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
