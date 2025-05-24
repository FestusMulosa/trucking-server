const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create a new Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'truckapp',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 15,           // Increased from 5 to handle more concurrent requests
      min: 2,            // Keep minimum connections alive
      acquire: 10000,    // Reduced from 30000ms to 10000ms
      idle: 10000,       // Keep idle timeout the same
      evict: 1000,       // Check for idle connections every second
      handleDisconnects: true
    },
    dialectOptions: {
      connectTimeout: 10000,  // 10 seconds connection timeout
      acquireTimeout: 10000,  // 10 seconds acquire timeout
      timeout: 10000,         // 10 seconds query timeout
      charset: 'utf8mb4'
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ETIMEDOUT/,
        /ESOCKETTIMEDOUT/,
        /EHOSTUNREACH/,
        /EPIPE/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 3
    }
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
};
