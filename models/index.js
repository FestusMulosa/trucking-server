const { sequelize } = require('../config/database');
const Company = require('./Company');
const User = require('./User');
const Truck = require('./Truck');
const Driver = require('./Driver');
const Maintenance = require('./Maintenance');

// Define associations
Company.hasMany(Truck, { foreignKey: 'companyId', as: 'trucks' });
Truck.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(Driver, { foreignKey: 'companyId', as: 'drivers' });
Driver.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Maintenance associations
Company.hasMany(Maintenance, { foreignKey: 'companyId', as: 'maintenanceRecords' });
Maintenance.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Truck.hasMany(Maintenance, { foreignKey: 'truckId', as: 'maintenanceRecords' });
Maintenance.belongsTo(Truck, { foreignKey: 'truckId', as: 'truck' });

// Export models
module.exports = {
  sequelize,
  Company,
  User,
  Truck,
  Driver,
  Maintenance
};
