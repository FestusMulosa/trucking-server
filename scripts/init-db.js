const { initializeDatabase } = require('../utils/initDb');

// Pass true to force recreate tables
initializeDatabase(true)
  .then(() => {
    console.log('Database initialized successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
