const { sequelize } = require('../config/database');

async function runIndexScript() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Define indexes to create
    const indexes = [
      // Companies table indexes
      { table: 'companies', name: 'idx_companies_active', columns: ['active'] },
      { table: 'companies', name: 'idx_companies_name', columns: ['name'] },
      
      // Users table indexes
      { table: 'users', name: 'idx_users_company_id', columns: ['companyId'] },
      { table: 'users', name: 'idx_users_role', columns: ['role'] },
      { table: 'users', name: 'idx_users_active', columns: ['active'] },
      { table: 'users', name: 'idx_users_company_role', columns: ['companyId', 'role'] },
      { table: 'users', name: 'idx_users_company_active', columns: ['companyId', 'active'] },
      
      // Drivers table indexes
      { table: 'drivers', name: 'idx_drivers_company_id', columns: ['companyId'] },
      { table: 'drivers', name: 'idx_drivers_status', columns: ['status'] },
      { table: 'drivers', name: 'idx_drivers_company_status', columns: ['companyId', 'status'] },
      { table: 'drivers', name: 'idx_drivers_license_expiry', columns: ['licenseExpiry'] },
      { table: 'drivers', name: 'idx_drivers_email', columns: ['email'] },
      
      // Trucks table indexes
      { table: 'trucks', name: 'idx_trucks_company_id', columns: ['companyId'] },
      { table: 'trucks', name: 'idx_trucks_status', columns: ['status'] },
      { table: 'trucks', name: 'idx_trucks_company_status', columns: ['companyId', 'status'] },
      { table: 'trucks', name: 'idx_trucks_next_maintenance', columns: ['nextMaintenance'] },
      { table: 'trucks', name: 'idx_trucks_road_tax_date', columns: ['roadTaxDate'] },
      { table: 'trucks', name: 'idx_trucks_insurance_date', columns: ['insuranceDate'] },
      { table: 'trucks', name: 'idx_trucks_fitness_date', columns: ['fitnessDate'] },
      { table: 'trucks', name: 'idx_trucks_comesa_expiry_date', columns: ['comesaExpiryDate'] },
    ];

    console.log(`Creating ${indexes.length} indexes...`);

    let created = 0;
    let skipped = 0;

    for (const index of indexes) {
      try {
        const columnList = index.columns.join(', ');
        const sql = `CREATE INDEX ${index.name} ON ${index.table}(${columnList})`;
        
        console.log(`Creating index ${index.name} on ${index.table}(${columnList})...`);
        await sequelize.query(sql);
        console.log('✓ Created');
        created++;
      } catch (error) {
        if (error.message.includes('Duplicate key name') || error.message.includes('already exists')) {
          console.log('✓ Already exists, skipping');
          skipped++;
        } else {
          console.error(`✗ Error: ${error.message}`);
        }
      }
    }

    console.log('\n=== Index Creation Summary ===');
    console.log(`Created: ${created} indexes`);
    console.log(`Skipped: ${skipped} indexes (already existed)`);
    
    // Show indexes for each table
    const tables = ['companies', 'users', 'drivers', 'trucks'];
    
    for (const table of tables) {
      try {
        console.log(`\nIndexes for ${table} table:`);
        const [results] = await sequelize.query(`SHOW INDEX FROM ${table}`);
        results.forEach(index => {
          if (index.Key_name !== 'PRIMARY') {
            console.log(`  - ${index.Key_name} on ${index.Column_name}`);
          }
        });
      } catch (error) {
        console.log(`  Table ${table} not found or error: ${error.message}`);
      }
    }

    console.log('\n✓ Database optimization completed successfully!');
    
  } catch (error) {
    console.error('Error running index script:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the script
runIndexScript();
