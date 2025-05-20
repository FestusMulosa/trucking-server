const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * EmailRecipient model for storing company-specific email recipients
 * This model is linked to companies via companyId
 */
const EmailRecipient = sequelize.define('EmailRecipient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationTypes: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      maintenanceAlerts: true,
      statusChanges: true,
      dailyReports: false,
      fitnessExpiry: true
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'email_recipients',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['companyId', 'email']
    }
  ]
});

module.exports = EmailRecipient;
