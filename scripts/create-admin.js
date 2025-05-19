const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const { Company, User } = require('../models');

// Admin user details - you can modify these as needed
const adminDetails = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  password: 'password123', // This will be hashed before saving
  role: 'admin'
};

// Company details
const companyDetails = {
  name: 'Default Company',
  address: '123 Main Street',
  city: 'Lusaka',
  country: 'Zambia',
  phone: '+260 123 456789',
  email: 'info@defaultcompany.com'
};

async function createAdmin() {
  try {
    // Check database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Find or create the company
    const [company, companyCreated] = await Company.findOrCreate({
      where: { name: companyDetails.name },
      defaults: companyDetails
    });

    if (companyCreated) {
      console.log('Default company created successfully.');
    } else {
      console.log('Using existing company:', company.name);
    }

    // Check if admin user already exists
    const existingUser = await User.findOne({
      where: { email: adminDetails.email }
    });

    if (existingUser) {
      console.log('Admin user already exists:', existingUser.email);
      process.exit(0);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminDetails.password, salt);

    // Create the admin user
    const admin = await User.create({
      ...adminDetails,
      password: hashedPassword,
      companyId: company.id
    });

    console.log('Admin user created successfully:');
    console.log({
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      companyId: admin.companyId
    });

    console.log('\nYou can now log in with:');
    console.log('Email:', adminDetails.email);
    console.log('Password:', adminDetails.password);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the function
createAdmin();
