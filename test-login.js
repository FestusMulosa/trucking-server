const fetch = require('node-fetch');

// Login credentials
const credentials = {
  email: 'admin@example.com',
  password: 'password123'
};

// API URLs
const loginUrl = 'http://localhost:3001/api/auth/login';
const healthUrl = 'http://localhost:3001/api/health';

async function testHealth() {
  try {
    console.log('Testing health endpoint...');

    const response = await fetch(healthUrl);
    const contentType = response.headers.get('content-type');
    console.log('Health Response Content-Type:', contentType);

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Health Response data:', data);
    } else {
      const text = await response.text();
      console.error('Received non-JSON response from health endpoint:', text.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('Error testing health endpoint:', error);
  }
}

async function testLogin() {
  try {
    console.log('Testing login API endpoint...');
    console.log('Credentials:', credentials);

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const contentType = response.headers.get('content-type');
    console.log('Response Content-Type:', contentType);

    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('Login failed:', data.message || 'Unknown error');
        return;
      }

      console.log('Login successful!');
      console.log('User:', data.user);
      console.log('Token:', data.token);
    } else {
      // If response is not JSON, get the text
      const text = await response.text();
      console.error('Received non-JSON response:', text.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

// Run the tests
async function runTests() {
  await testHealth();
  console.log('\n-----------------------------------\n');
  await testLogin();
}

runTests();
