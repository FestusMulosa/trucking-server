const { sequelize } = require('../config/database');
const { Company, User, Truck, Driver } = require('../models');
const bcrypt = require('bcrypt');

// Function to initialize the database
const initializeDatabase = async (force = false) => {
  try {
    // Sync all models with the database
    // force: true will drop the table if it already exists
    await sequelize.sync({ force });
    console.log('Database synchronized successfully');

    // If force is true, seed the database with initial data
    if (force) {
      console.log('Seeding database with initial data...');
      await seedDatabase();
    }

    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

// Function to seed the database with initial data
const seedDatabase = async () => {
  try {
    // Create a default company
    const defaultCompany = await Company.create({
      name: 'Default Company',
      address: '123 Main Street',
      city: 'Lusaka',
      country: 'Zambia',
      phone: '+260 123 456789',
      email: 'info@defaultcompany.com'
    });

    // Create an admin user with hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await User.create({
      companyId: defaultCompany.id,
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });

    // Create some sample trucks
    await Truck.create({
      companyId: defaultCompany.id,
      name: 'Truck 001',
      numberPlate: 'ABC 123 ZM',
      make: 'Volvo',
      model: 'FH16',
      year: 2022,
      status: 'active',
      route: 'Lusaka-Solwezi',
      cargoType: 'Fuel',
      roadTaxDate: '2023-12-15',
      insuranceDate: '2024-01-20',
      fitnessDate: '2023-11-30',
      comesaExpiryDate: '2023-12-10',
      nextMaintenance: '2023-06-15'
    });

    await Truck.create({
      companyId: defaultCompany.id,
      name: 'Truck 002',
      numberPlate: 'DEF 456 ZM',
      make: 'Scania',
      model: 'R500',
      year: 2021,
      status: 'maintenance',
      route: 'Service Center',
      cargoType: 'Construction',
      roadTaxDate: '2023-10-05',
      insuranceDate: '2023-11-15',
      fitnessDate: '2023-09-20',
      comesaExpiryDate: '2023-10-15',
      nextMaintenance: '2023-05-20'
    });

    // Create some sample drivers
    await Driver.create({
      companyId: defaultCompany.id,
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '+260 987 654321',
      licenseNumber: 'DL12345678',
      licenseExpiry: '2025-06-30',
      dateOfBirth: '1985-03-15',
      status: 'active'
    });

    await Driver.create({
      companyId: defaultCompany.id,
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily.johnson@example.com',
      phone: '+260 765 432109',
      licenseNumber: 'DL87654321',
      licenseExpiry: '2024-08-22',
      dateOfBirth: '1990-11-08',
      status: 'active'
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

module.exports = {
  initializeDatabase
};
