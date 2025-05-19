const { sequelize } = require('../config/database');
const Company = require('./Company');
const User = require('./User');
const Truck = require('./Truck');
const Driver = require('./Driver');

// Define associations
Company.hasMany(Truck, { foreignKey: 'companyId', as: 'trucks' });
Truck.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(Driver, { foreignKey: 'companyId', as: 'drivers' });
Driver.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Export models
module.exports = {
  sequelize,
  Company,
  User,
  Truck,
  Driver
};
