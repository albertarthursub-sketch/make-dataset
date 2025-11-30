#!/usr/bin/env node
/**
 * Quick API Status Check
 * Tests essential endpoints
 */

console.log('\n🔍 QUICK API ENDPOINT STATUS CHECK\n');

async function checkEndpoint(name, url, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const status = response.status;
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      name,
      url,
      status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      name,
      url,
      status: 'ERROR',
      ok: false,
      error: error.message
    };
  }
}

async function runChecks() {
  // Test backend directly
  console.log('📡 Testing Backend Service (Flask on port 5000):');
  const backendHealth = await checkEndpoint(
    'Backend Health',
    'http://127.0.0.1:5000/api/health'
  );
  console.log(`  Backend: ${backendHealth.ok ? '✅ WORKING' : '❌ FAILED'}`);
  if (backendHealth.ok) {
    console.log(`    Status: ${backendHealth.data.status}`);
    console.log(`    Service: ${backendHealth.data.service}`);
  } else {
    console.log(`    Error: ${backendHealth.error || backendHealth.status}`);
  }

  // Test frontend on both ports
  console.log('\n📡 Testing Frontend Service (Next.js):');
  const frontendPorts = [3000, 3001];
  
  for (const port of frontendPorts) {
    const url = `http://127.0.0.1:${port}/api/health`;
    const result = await checkEndpoint(`Frontend Port ${port}`, url);
    console.log(`  Port ${port}: ${result.ok ? '✅ WORKING' : '❌ NOT RESPONDING'}`);
  }

  // Test actual API endpoints on working frontend port
  console.log('\n📡 Testing API Endpoints:');
  
  const endpoints = [
    { name: 'Health Check', url: 'http://127.0.0.1:3001/api/health', method: 'GET' },
    { name: 'Student Lookup', url: 'http://127.0.0.1:3001/api/student/lookup', method: 'POST', body: { studentId: '30206054' } },
    { name: 'Analytics', url: 'http://127.0.0.1:3001/api/dashboard/analytics?timeframe=24h', method: 'GET' },
  ];

  for (const endpoint of endpoints) {
    const result = await checkEndpoint(
      endpoint.name,
      endpoint.url,
      endpoint.method,
      endpoint.body
    );
    console.log(`  ${endpoint.name}: ${result.ok ? '✅' : '⚠️'} (${result.status})`);
  }

  console.log('\n✅ Status Check Complete!\n');
}

runChecks();
