const fetch = require('node-fetch');

// Login credentials
const credentials = {
  email: 'admin@example.com',
  password: 'password123'
};

// API URL
const apiUrl = 'http://localhost:3001/api/auth/login';

async function testLogin() {
  try {
    console.log('Testing login API endpoint...');
    console.log('Credentials:', credentials);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Login failed:', data.message || 'Unknown error');
      return;
    }

    console.log('Login successful!');
    console.log('User:', {
      id: data.user.id,
      name: `${data.user.firstName} ${data.user.lastName}`,
      email: data.user.email,
      role: data.user.role,
      companyId: data.user.companyId
    });
    console.log('Token:', data.token);
  } catch (error) {
    console.error('Error testing login:', error.message);
  }
}

// Run the test
testLogin();
