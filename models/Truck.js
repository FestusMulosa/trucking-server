const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Truck = sequelize.define('Truck', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numberPlate: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  make: {
    type: DataTypes.STRING,
    allowNull: true
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    defaultValue: 'inactive'
  },
  route: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cargoType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastUpdate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  roadTaxDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  insuranceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fitnessDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  comesaExpiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  nextMaintenance: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  currentDriverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'drivers',
      key: 'id'
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
  tableName: 'trucks',
  timestamps: true
});

module.exports = Truck;
