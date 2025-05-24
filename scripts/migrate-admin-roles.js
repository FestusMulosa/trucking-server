const { sequelize } = require('../config/database');
const { User } = require('../models');

async function migrateAdminRoles() {
  try {
    // Check database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Find all users with 'admin' role
    const adminUsers = await User.findAll({
      where: { role: 'admin' }
    });

    console.log(`Found ${adminUsers.length} admin users to migrate`);

    if (adminUsers.length === 0) {
      console.log('No admin users found to migrate.');
      process.exit(0);
    }

    // Update all admin users to company_admin
    const updateResult = await User.update(
      { role: 'company_admin' },
      { 
        where: { role: 'admin' },
        returning: true // This will return the updated records (PostgreSQL only)
      }
    );

    console.log(`Successfully migrated ${updateResult[0]} admin users to company_admin role`);

    // Display the migrated users
    const migratedUsers = await User.findAll({
      where: { role: 'company_admin' },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'companyId']
    });

    console.log('\nMigrated users:');
    migratedUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Company ID: ${user.companyId}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('All existing admin users are now company_admin users.');
    console.log('They will only be able to access data from their assigned company.');

  } catch (error) {
    console.error('Error migrating admin roles:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Run the script
migrateAdminRoles();
