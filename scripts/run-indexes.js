const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runIndexScript() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'add-performance-indexes.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('USE'));

    console.log(`Found ${statements.length} SQL statements to execute.`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.toLowerCase().includes('show index')) {
        console.log(`\nSkipping SHOW INDEX statement: ${statement}`);
        continue;
      }

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        await sequelize.query(statement);
        console.log('✓ Success');
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log('✓ Index already exists, skipping');
        } else {
          console.error(`✗ Error: ${error.message}`);
        }
      }
    }

    console.log('\n=== Index Creation Summary ===');
    
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
