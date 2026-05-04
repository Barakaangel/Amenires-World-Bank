/**
 * Quick Server Test Script
 * Run this to verify the server is working correctly
 */

const http = require('http');

console.log('🔍 Testing Amenires World Bank Server...\n');

const tests = [
  {
    name: 'Server Homepage',
    url: 'http://localhost:3000',
    expectedStatus: 200
  },
  {
    name: 'API Health Check',
    url: 'http://localhost:3000/api/health',
    expectedStatus: 200
  },
  {
    name: 'Login Endpoint',
    url: 'http://localhost:3000/api/auth/login',
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@bank.com',
      password: 'password123'
    }),
    expectedStatus: 200
  }
];

let completed = 0;
let passed = 0;

function runTest(test) {
  const url = new URL(test.url);
  const options = {
    hostname: url.hostname,
    port: url.port || 3000,
    path: url.pathname + url.search,
    method: test.method || 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      const success = res.statusCode === test.expectedStatus;
      if (success) passed++;
      completed++;

      const status = success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}`);
      console.log(`   Status: ${res.statusCode} (expected ${test.expectedStatus})`);

      if (!success) {
        console.log(`   Response: ${data.substring(0, 100)}...`);
      }
      console.log('');

      if (completed === tests.length) {
        showSummary();
      }
    });
  });

  req.on('error', (err) => {
    completed++;
    console.log(`❌ FAIL ${test.name}`);
    console.log(`   Error: ${err.message}`);
    console.log('');

    if (completed === tests.length) {
      showSummary();
    }
  });

  if (test.body) {
    req.write(test.body);
  }

  req.end();
}

function showSummary() {
  console.log('─────────────────────────────────────');
  console.log('📊 TEST SUMMARY');
  console.log('─────────────────────────────────────');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${tests.length - passed}`);
  console.log('');

  if (passed === tests.length) {
    console.log('🎉 ALL TESTS PASSED! Server is working correctly.');
    console.log('\n📱 Open your browser and visit: http://localhost:3000');
    console.log('🔑 Login with: admin@bank.com / password123');
  } else {
    console.log('⚠️  Some tests failed. Make sure the server is running.');
    console.log('\n💡 To start the server, double-click: START_PRO_SERVER.bat');
  }

  console.log('\n─────────────────────────────────────');
  process.exit(passed === tests.length ? 0 : 1);
}

// Run all tests
console.log('Running tests...\n');
tests.forEach((test, index) => {
  setTimeout(() => runTest(test), index * 500);
});
