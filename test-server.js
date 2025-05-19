const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test server is running'
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // Check credentials (for testing purposes)
  if (email === 'admin@example.com' && password === 'password123') {
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: 1,
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        role: 'admin',
        companyId: 1
      },
      token: 'test-jwt-token'
    });
  }
  
  // Invalid credentials
  return res.status(401).json({
    success: false,
    message: 'Invalid email or password'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
});
