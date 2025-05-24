const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const { User } = require('../models');

// Super admin user details - you can modify these as needed
const superAdminDetails = {
  firstName: 'Super',
  lastName: 'Admin',
  email: 'superadmin@truckapp.com',
  password: 'superadmin123', // This will be hashed before saving
  role: 'super_admin',
  companyId: null // Super admins are not tied to any specific company
};

async function createSuperAdmin() {
  try {
    // Check database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if super admin user already exists
    const existingUser = await User.findOne({
      where: { email: superAdminDetails.email }
    });

    if (existingUser) {
      console.log('Super admin user already exists:', existingUser.email);
      console.log('Current role:', existingUser.role);
      
      // If user exists but is not super admin, update their role
      if (existingUser.role !== 'super_admin') {
        await existingUser.update({ 
          role: 'super_admin',
          companyId: null 
        });
        console.log('Updated existing user to super admin role');
      }
      
      process.exit(0);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(superAdminDetails.password, salt);

    // Create the super admin user
    const superAdmin = await User.create({
      ...superAdminDetails,
      password: hashedPassword
    });

    console.log('Super admin user created successfully:');
    console.log({
      id: superAdmin.id,
      email: superAdmin.email,
      firstName: superAdmin.firstName,
      lastName: superAdmin.lastName,
      role: superAdmin.role,
      companyId: superAdmin.companyId
    });

    console.log('\nYou can now log in with:');
    console.log('Email:', superAdminDetails.email);
    console.log('Password:', superAdminDetails.password);
    console.log('\n⚠️ IMPORTANT: Change this password immediately after first login!');

  } catch (error) {
    console.error('Error creating super admin user:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the script
createSuperAdmin();
