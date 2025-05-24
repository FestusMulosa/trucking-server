const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * CompanyEmail model for storing company-specific email addresses
 * This model is linked to companies via companyId
 * Supports up to 5 email addresses per company with different types
 */
const CompanyEmail = sequelize.define('CompanyEmail', {
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
  emailAddress: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  emailType: {
    type: DataTypes.ENUM('primary', 'billing', 'support', 'notifications', 'alerts'),
    allowNull: false,
    defaultValue: 'notifications'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
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
  tableName: 'company_emails',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['companyId', 'emailAddress']
    },
    {
      fields: ['companyId', 'emailType']
    },
    {
      fields: ['companyId', 'isActive']
    }
  ],
  validate: {
    // Custom validation to ensure max 5 active emails per company
    async maxEmailsPerCompany() {
      if (this.isActive) {
        const count = await CompanyEmail.count({
          where: {
            companyId: this.companyId,
            isActive: true,
            id: { [require('sequelize').Op.ne]: this.id || 0 }
          }
        });
        
        if (count >= 5) {
          throw new Error('A company can have maximum 5 active email addresses');
        }
      }
    }
  }
});

module.exports = CompanyEmail;
