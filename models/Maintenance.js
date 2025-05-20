const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Maintenance model for storing truck maintenance records
 * This model is linked to trucks via truckId and companies via companyId
 */
const Maintenance = sequelize.define('Maintenance', {
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
  truckId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'trucks',
      key: 'id'
    }
  },
  maintenanceType: {
    type: DataTypes.ENUM('scheduled', 'repair', 'inspection', 'other'),
    defaultValue: 'scheduled'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  performedBy: {
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
  tableName: 'maintenance',
  timestamps: true
});

module.exports = Maintenance;
