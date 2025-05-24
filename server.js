const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const compression = require('compression');

// Load environment variables
dotenv.config();

// Import database and models
const { testConnection } = require('./config/database');
const { initializeDatabase } = require('./utils/initDb');
const { Company, User, Truck, Driver, Maintenance, PlatformSetting, EmailRecipient, CompanyEmail } = require('./models');

// Import controllers and middleware
const authController = require('./controllers/authController');
const maintenanceController = require('./controllers/maintenanceController');
const settingsController = require('./controllers/settingsController');
const companyEmailController = require('./controllers/companyEmailController');
const { verifyToken, verifyTokenFast, isAdmin, isManager, isSameCompanyOrAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(compression()); // Enable gzip compression
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' })); // Increase limit for large payloads
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

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

// Performance monitoring endpoint
app.get('/api/performance', verifyToken, (req, res) => {
  const { getCacheStats } = require('./middleware/auth');

  res.json({
    status: 'ok',
    message: 'Performance statistics',
    authCache: getCacheStats(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
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
    const { page = 1, limit = 50, active } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (active !== undefined) {
      whereClause.active = active === 'true';
    }

    const { count, rows: companies } = await Company.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      companies,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Trucks
app.get('/api/trucks', verifyTokenFast, async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const { page = 1, limit = 50, status, includeCompany = 'false' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause - filter by company for non-admin users
    const whereClause = {};
    if (role !== 'admin') {
      whereClause.companyId = companyId;
    }
    if (status) {
      whereClause.status = status;
    }

    // Build include array conditionally
    const includeArray = [];
    if (includeCompany === 'true') {
      includeArray.push({
        model: Company,
        as: 'company',
        attributes: ['id', 'name'] // Only fetch necessary fields
      });
    }

    const { count, rows: trucks } = await Truck.findAndCountAll({
      where: whereClause,
      include: includeArray,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['updatedAt', 'DESC']],
      attributes: { exclude: ['createdAt'] } // Exclude unnecessary fields
    });

    res.json({
      trucks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({ error: 'Failed to fetch trucks' });
  }
});

// Create a new truck
app.post('/api/trucks', verifyToken, async (req, res) => {
  try {
    // Extract truck data from request body
    const {
      companyId,
      name,
      numberPlate,
      make,
      model,
      year,
      status,
      route,
      cargoType,
      roadTaxDate,
      insuranceDate,
      fitnessDate,
      comesaExpiryDate,
      nextMaintenance,
      currentDriverId
    } = req.body;

    // Validate required fields
    if (!companyId || !name || !numberPlate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: companyId, name, and numberPlate are required'
      });
    }

    // Check if a truck with the same number plate already exists
    const existingTruck = await Truck.findOne({ where: { numberPlate } });
    if (existingTruck) {
      return res.status(409).json({
        success: false,
        error: 'A truck with this number plate already exists'
      });
    }

    // Create the truck
    const newTruck = await Truck.create({
      companyId,
      name,
      numberPlate,
      make,
      model,
      year,
      status: status || 'inactive', // Default to inactive if not provided
      route,
      cargoType,
      lastUpdate: new Date(),
      roadTaxDate,
      insuranceDate,
      fitnessDate,
      comesaExpiryDate,
      nextMaintenance,
      currentDriverId
    });

    // Fetch the created truck with its company information
    const truckWithCompany = await Truck.findByPk(newTruck.id, {
      include: [{ model: Company, as: 'company' }]
    });

    // Return the created truck
    res.status(201).json(truckWithCompany);
  } catch (error) {
    console.error('Error creating truck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create truck',
      details: error.message
    });
  }
});

// Get a single truck by ID
app.get('/api/trucks/:id', verifyTokenFast, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the truck by ID
    const truck = await Truck.findByPk(id, {
      include: [{ model: Company, as: 'company' }]
    });

    // If truck not found, return 404
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Truck not found'
      });
    }

    // Return the truck
    res.json(truck);
  } catch (error) {
    console.error('Error fetching truck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch truck',
      details: error.message
    });
  }
});

// Update a truck
app.put('/api/trucks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the truck by ID
    const truck = await Truck.findByPk(id);

    // If truck not found, return 404
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Truck not found'
      });
    }

    // Extract truck data from request body
    const {
      companyId,
      name,
      numberPlate,
      make,
      model,
      year,
      status,
      route,
      cargoType,
      roadTaxDate,
      insuranceDate,
      fitnessDate,
      comesaExpiryDate,
      nextMaintenance,
      currentDriverId
    } = req.body;

    // Validate required fields
    if (!companyId || !name || !numberPlate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: companyId, name, and numberPlate are required'
      });
    }

    // If number plate is changed, check if it already exists
    if (numberPlate !== truck.numberPlate) {
      const existingTruck = await Truck.findOne({ where: { numberPlate } });
      if (existingTruck) {
        return res.status(409).json({
          success: false,
          error: 'A truck with this number plate already exists'
        });
      }
    }

    // Update the truck
    await truck.update({
      companyId,
      name,
      numberPlate,
      make,
      model,
      year,
      status,
      route,
      cargoType,
      lastUpdate: new Date(),
      roadTaxDate,
      insuranceDate,
      fitnessDate,
      comesaExpiryDate,
      nextMaintenance,
      currentDriverId
    });

    // Fetch the updated truck with its company information
    const updatedTruck = await Truck.findByPk(id, {
      include: [{ model: Company, as: 'company' }]
    });

    // Return the updated truck
    res.json(updatedTruck);
  } catch (error) {
    console.error('Error updating truck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update truck',
      details: error.message
    });
  }
});

// Delete a truck
app.delete('/api/trucks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the truck by ID
    const truck = await Truck.findByPk(id);

    // If truck not found, return 404
    if (!truck) {
      return res.status(404).json({
        success: false,
        error: 'Truck not found'
      });
    }

    // Delete the truck
    await truck.destroy();

    // Return success message
    res.json({
      success: true,
      message: 'Truck deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting truck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete truck',
      details: error.message
    });
  }
});

// Drivers
app.get('/api/drivers', verifyTokenFast, async (req, res) => {
  try {
    const { companyId, role } = req.user;
    const { page = 1, limit = 50, status, includeCompany = 'false' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause - filter by company for non-admin users
    const whereClause = {};
    if (role !== 'admin') {
      whereClause.companyId = companyId;
    }
    if (status) {
      whereClause.status = status;
    }

    // Build include array conditionally
    const includeArray = [];
    if (includeCompany === 'true') {
      includeArray.push({
        model: Company,
        as: 'company',
        attributes: ['id', 'name'] // Only fetch necessary fields
      });
    }

    const { count, rows: drivers } = await Driver.findAndCountAll({
      where: whereClause,
      include: includeArray,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
      attributes: { exclude: ['createdAt'] } // Exclude unnecessary fields
    });

    res.json({
      drivers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// Get a single driver by ID
app.get('/api/drivers/:id', verifyTokenFast, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the driver by ID
    const driver = await Driver.findByPk(id, {
      include: [{ model: Company, as: 'company' }]
    });

    // If driver not found, return 404
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    // Return the driver
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch driver',
      details: error.message
    });
  }
});

// Create a new driver
app.post('/api/drivers', verifyToken, async (req, res) => {
  try {
    // Extract driver data from request body
    const {
      companyId,
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      dateOfBirth,
      address,
      city,
      state,
      country,
      postalCode,
      emergencyContactName,
      emergencyContactPhone,
      status,
      notes
    } = req.body;

    // Validate required fields
    if (!companyId || !firstName || !lastName || !licenseNumber || !licenseExpiry) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: companyId, firstName, lastName, licenseNumber, and licenseExpiry are required'
      });
    }

    // Check if a driver with the same license number already exists
    const existingDriver = await Driver.findOne({ where: { licenseNumber } });
    if (existingDriver) {
      return res.status(409).json({
        success: false,
        error: 'A driver with this license number already exists'
      });
    }

    // Create the driver
    const newDriver = await Driver.create({
      companyId,
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      dateOfBirth,
      address,
      city,
      state,
      country,
      postalCode,
      emergencyContactName,
      emergencyContactPhone,
      status: status || 'inactive', // Default to inactive if not provided
      notes
    });

    // Fetch the created driver with its company information
    const driverWithCompany = await Driver.findByPk(newDriver.id, {
      include: [{ model: Company, as: 'company' }]
    });

    // Return the created driver
    res.status(201).json(driverWithCompany);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create driver',
      details: error.message
    });
  }
});

// Update a driver
app.put('/api/drivers/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the driver by ID
    const driver = await Driver.findByPk(id);

    // If driver not found, return 404
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    // Extract driver data from request body
    const {
      companyId,
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      dateOfBirth,
      address,
      city,
      state,
      country,
      postalCode,
      emergencyContactName,
      emergencyContactPhone,
      status,
      notes
    } = req.body;

    // Validate required fields
    if (!companyId || !firstName || !lastName || !licenseNumber || !licenseExpiry) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: companyId, firstName, lastName, licenseNumber, and licenseExpiry are required'
      });
    }

    // If license number is changed, check if it already exists
    if (licenseNumber !== driver.licenseNumber) {
      const existingDriver = await Driver.findOne({ where: { licenseNumber } });
      if (existingDriver) {
        return res.status(409).json({
          success: false,
          error: 'A driver with this license number already exists'
        });
      }
    }

    // Update the driver
    await driver.update({
      companyId,
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      dateOfBirth,
      address,
      city,
      state,
      country,
      postalCode,
      emergencyContactName,
      emergencyContactPhone,
      status,
      notes
    });

    // Fetch the updated driver with its company information
    const updatedDriver = await Driver.findByPk(id, {
      include: [{ model: Company, as: 'company' }]
    });

    // Return the updated driver
    res.json(updatedDriver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driver',
      details: error.message
    });
  }
});

// Delete a driver
app.delete('/api/drivers/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the driver by ID
    const driver = await Driver.findByPk(id);

    // If driver not found, return 404
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }

    // Delete the driver
    await driver.destroy();

    // Return success message
    res.json({
      success: true,
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete driver',
      details: error.message
    });
  }
});

// Users
app.get('/api/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, role, active, companyId: filterCompanyId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (role) {
      whereClause.role = role;
    }
    if (active !== undefined) {
      whereClause.active = active === 'true';
    }
    if (filterCompanyId) {
      whereClause.companyId = filterCompanyId;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name'] // Only fetch necessary fields
        }
      ],
      attributes: { exclude: ['password', 'createdAt'] }, // Don't return passwords and createdAt
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Maintenance Records
// Get all maintenance records for a company
app.get('/api/maintenance', verifyToken, maintenanceController.getMaintenanceRecords);

// Get a single maintenance record by ID
app.get('/api/maintenance/:id', verifyToken, maintenanceController.getMaintenanceRecord);

// Create a new maintenance record
app.post('/api/maintenance', verifyToken, maintenanceController.createMaintenanceRecord);

// Update a maintenance record
app.put('/api/maintenance/:id', verifyToken, maintenanceController.updateMaintenanceRecord);

// Delete a maintenance record
app.delete('/api/maintenance/:id', verifyToken, maintenanceController.deleteMaintenanceRecord);

// Settings routes
app.get('/api/settings', verifyToken, settingsController.getSettings);
app.put('/api/settings', verifyToken, settingsController.updateSettings);

// Email recipients routes (legacy)
app.get('/api/email-recipients', verifyToken, settingsController.getEmailRecipients);
app.post('/api/email-recipients', verifyToken, settingsController.addEmailRecipient);
app.put('/api/email-recipients/:id', verifyToken, settingsController.updateEmailRecipient);
app.delete('/api/email-recipients/:id', verifyToken, settingsController.deleteEmailRecipient);

// Company emails routes (new system)
app.get('/api/companies/:companyId/emails', verifyToken, companyEmailController.getCompanyEmails);
app.post('/api/companies/:companyId/emails', verifyToken, companyEmailController.addCompanyEmail);
app.put('/api/companies/:companyId/emails/:emailId', verifyToken, companyEmailController.updateCompanyEmail);
app.delete('/api/companies/:companyId/emails/:emailId', verifyToken, companyEmailController.deleteCompanyEmail);

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
