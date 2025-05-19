const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

// Import database and models
const { testConnection } = require('./config/database');
const { initializeDatabase } = require('./utils/initDb');
const { Company, User, Truck, Driver } = require('./models');

// Import controllers and middleware
const authController = require('./controllers/authController');
const { verifyToken, isAdmin, isManager, isSameCompanyOrAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Create a transporter object
let transporter = null;

// Initialize the transporter
const initTransporter = () => {
  const SMTP_HOST = process.env.REACT_APP_SMTP_HOST;
  const SMTP_PORT = process.env.REACT_APP_SMTP_PORT;
  const SMTP_USER = process.env.REACT_APP_SMTP_USER;
  const SMTP_PASS = process.env.REACT_APP_SMTP_PASS;

  console.log('SMTP Configuration:', {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER: SMTP_USER ? '(set)' : '(not set)',
    SMTP_PASS: SMTP_PASS ? '(set)' : '(not set)',
    SMTP_FROM: process.env.REACT_APP_SMTP_FROM,
    DEFAULT_RECIPIENT: process.env.REACT_APP_DEFAULT_RECIPIENT
  });

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.error('SMTP configuration is incomplete');

    // For demo purposes, create a mock transporter that logs emails instead of sending them
    console.log('Creating mock transporter for demo purposes');
    transporter = {
      sendMail: (mailOptions) => {
        console.log('MOCK EMAIL SENT:');
        console.log('From:', mailOptions.from);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('Text:', mailOptions.text);
        return Promise.resolve({ messageId: 'mock-email-id-' + Date.now() });
      }
    };
    return;
  }

  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log('Email transporter initialized');
  } catch (error) {
    console.error('Failed to initialize email transporter:', error);
  }
};

// Initialize the transporter when the server starts
initTransporter();

// API endpoint to send an email
app.post('/api/send-email', async (req, res) => {
  if (!transporter) {
    return res.status(500).json({ success: false, message: 'Email service is not available' });
  }

  const { to, subject, text, html } = req.body;

  if (!to || !subject || (!text && !html)) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const mailOptions = {
      from: process.env.REACT_APP_SMTP_FROM,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Failed to send email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to test the email service
app.get('/api/test-email', async (req, res) => {
  if (!transporter) {
    return res.status(500).json({ success: false, message: 'Email service is not available' });
  }

  try {
    const mailOptions = {
      from: process.env.REACT_APP_SMTP_FROM,
      to: process.env.REACT_APP_DEFAULT_RECIPIENT,
      subject: 'Test Email from Truck Fleet Tracker',
      text: 'This is a test email from the Truck Fleet Tracker system.',
      html: '<p>This is a test email from the Truck Fleet Tracker system.</p>',
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent:', info.messageId);
    return res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Failed to send test email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for fitness expiry notifications
app.post('/api/send-fitness-expiry', async (req, res) => {
  console.log('Received request to send fitness expiry notifications');

  if (!transporter) {
    return res.status(500).json({ success: false, message: 'Email service is not available' });
  }

  const { to, trucks } = req.body;

  if (!to || !trucks || !Array.isArray(trucks) || trucks.length === 0) {
    return res.status(400).json({ success: false, message: 'Missing required fields or no trucks provided' });
  }

  try {
    const title = 'Fitness Certificate Expiry Alert';

    // Create a list of trucks with their fitness expiry dates
    const trucksList = trucks.map(truck =>
      `<li style="margin-bottom: 10px;">
        <strong>${truck.name}</strong> (${truck.numberPlate}) - Fitness expires on <strong>${new Date(truck.fitnessDate).toLocaleDateString()}</strong>
      </li>`
    ).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="background-color: #FF9800; color: white; padding: 10px 15px; border-radius: 4px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 18px;">⚠️ ${title}</h2>
        </div>
        <div style="color: #333; line-height: 1.5;">
          <p>The following trucks have fitness certificates that are about to expire or have already expired:</p>
          <ul style="padding-left: 20px;">
            ${trucksList}
          </ul>
          <p>Please ensure these trucks are scheduled for fitness certificate renewal as soon as possible.</p>
        </div>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; color: #777; font-size: 12px;">
          <p>This is an automated message from the Truck Fleet Tracker system. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    const text = `${title}\n\nThe following trucks have fitness certificates that are about to expire or have already expired:\n\n${trucks.map(truck => `${truck.name} (${truck.numberPlate}) - Fitness expires on ${new Date(truck.fitnessDate).toLocaleDateString()}`).join('\n')}\n\nPlease ensure these trucks are scheduled for fitness certificate renewal as soon as possible.\n\nThis is an automated message from the Truck Fleet Tracker system. Please do not reply to this email.`;

    const mailOptions = {
      from: process.env.REACT_APP_SMTP_FROM || 'noreply@trucktracker.com',
      to,
      subject: `Truck Fleet Tracker: ${title}`,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Fitness expiry email sent:', info.messageId);
    return res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Failed to send fitness expiry email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    emailServiceAvailable: !!transporter
  });
});

// Authentication routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', verifyToken, authController.getProfile);

// API routes for database entities
// Companies
app.get('/api/companies', verifyToken, async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Trucks
app.get('/api/trucks', verifyToken, async (req, res) => {
  try {
    const trucks = await Truck.findAll({
      include: [
        { model: Company, as: 'company' }
      ]
    });
    res.json(trucks);
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({ error: 'Failed to fetch trucks' });
  }
});

// Drivers
app.get('/api/drivers', verifyToken, async (req, res) => {
  try {
    const drivers = await Driver.findAll({
      include: [
        { model: Company, as: 'company' }
      ]
    });
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Users
app.get('/api/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      include: [
        { model: Company, as: 'company' }
      ],
      attributes: { exclude: ['password'] } // Don't return passwords
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Initialize database and start the server
(async () => {
  try {
    // Test database connection
    const connected = await testConnection();

    if (connected) {
      // Initialize database (set force to true to recreate tables)
      const force = process.env.NODE_ENV === 'development' && process.env.RESET_DB === 'true';
      await initializeDatabase(force);

      // Start the server
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    } else {
      console.error('Failed to connect to the database. Server not started.');
    }
  } catch (error) {
    console.error('Error starting server:', error);
  }
})();
