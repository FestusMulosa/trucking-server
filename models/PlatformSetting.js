const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * PlatformSetting model for storing company-specific settings
 * This model is linked to companies via companyId
 */
const PlatformSetting = sequelize.define('PlatformSetting', {
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
  settingKey: {
    type: DataTypes.STRING,
    allowNull: false
  },
  settingValue: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  settingType: {
    type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
    defaultValue: 'string'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'general'
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
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
  tableName: 'platform_settings',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['companyId', 'settingKey']
    }
  ]
});

module.exports = PlatformSetting;
