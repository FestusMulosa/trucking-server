const { sequelize } = require('../config/database');
const Company = require('./Company');
const User = require('./User');
const Truck = require('./Truck');
const Driver = require('./Driver');
const Maintenance = require('./Maintenance');
const PlatformSetting = require('./PlatformSetting');
const EmailRecipient = require('./EmailRecipient');
const CompanyEmail = require('./CompanyEmail');

// Define associations
Company.hasMany(Truck, { foreignKey: 'companyId', as: 'trucks' });
Truck.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(Driver, { foreignKey: 'companyId', as: 'drivers' });
Driver.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Driver-Truck relationship
Truck.belongsTo(Driver, { foreignKey: 'currentDriverId', as: 'currentDriver' });
Driver.hasOne(Truck, { foreignKey: 'currentDriverId', as: 'assignedTruck' });

Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Maintenance associations
Company.hasMany(Maintenance, { foreignKey: 'companyId', as: 'maintenanceRecords' });
Maintenance.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Truck.hasMany(Maintenance, { foreignKey: 'truckId', as: 'maintenanceRecords' });
Maintenance.belongsTo(Truck, { foreignKey: 'truckId', as: 'truck' });

// Settings associations
Company.hasMany(PlatformSetting, { foreignKey: 'companyId', as: 'settings' });
PlatformSetting.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(EmailRecipient, { foreignKey: 'companyId', as: 'emailRecipients' });
EmailRecipient.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Company emails associations
Company.hasMany(CompanyEmail, { foreignKey: 'companyId', as: 'emails' });
CompanyEmail.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Export models
module.exports = {
  sequelize,
  Company,
  User,
  Truck,
  Driver,
  Maintenance,
  PlatformSetting,
  EmailRecipient,
  CompanyEmail
};
