const { CompanyEmail, Company } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all email addresses for a company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCompanyEmails = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userCompanyId = req.user.companyId;
    const userRole = req.user.role;

    // Check authorization - user can only access their own company's emails unless admin
    if (userRole !== 'admin' && parseInt(companyId) !== userCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own company\'s email addresses.'
      });
    }

    const emails = await CompanyEmail.findAll({
      where: { companyId: parseInt(companyId) },
      order: [['emailType', 'ASC'], ['createdAt', 'ASC']]
    });

    res.json({
      success: true,
      emails
    });
  } catch (error) {
    console.error('Error fetching company emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch company emails',
      error: error.message
    });
  }
};

/**
 * Add a new email address for a company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addCompanyEmail = async (req, res) => {
  try {
    const { companyId } = req.params;
    const userCompanyId = req.user.companyId;
    const userRole = req.user.role;
    const { emailAddress, emailType, isActive = true } = req.body;

    // Check authorization
    if (userRole !== 'admin' && parseInt(companyId) !== userCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage your own company\'s email addresses.'
      });
    }

    if (!emailAddress) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    if (!emailType || !['primary', 'billing', 'support', 'notifications', 'alerts'].includes(emailType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email type is required (primary, billing, support, notifications, alerts)'
      });
    }

    // Check if email already exists for this company
    const existingEmail = await CompanyEmail.findOne({
      where: { companyId: parseInt(companyId), emailAddress }
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address already exists for this company'
      });
    }

    // Check if company already has 5 active emails
    if (isActive) {
      const activeEmailCount = await CompanyEmail.count({
        where: { companyId: parseInt(companyId), isActive: true }
      });

      if (activeEmailCount >= 5) {
        return res.status(400).json({
          success: false,
          message: 'Company can have maximum 5 active email addresses'
        });
      }
    }

    // Create new email
    const email = await CompanyEmail.create({
      companyId: parseInt(companyId),
      emailAddress,
      emailType,
      isActive
    });

    res.status(201).json({
      success: true,
      message: 'Email address added successfully',
      email
    });
  } catch (error) {
    console.error('Error adding company email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add email address',
      error: error.message
    });
  }
};

/**
 * Update an email address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateCompanyEmail = async (req, res) => {
  try {
    const { companyId, emailId } = req.params;
    const userCompanyId = req.user.companyId;
    const userRole = req.user.role;
    const { emailAddress, emailType, isActive } = req.body;

    // Check authorization
    if (userRole !== 'admin' && parseInt(companyId) !== userCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage your own company\'s email addresses.'
      });
    }

    // Find the email
    const email = await CompanyEmail.findOne({
      where: { id: emailId, companyId: parseInt(companyId) }
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email address not found'
      });
    }

    // If changing to active, check the limit
    if (isActive && !email.isActive) {
      const activeEmailCount = await CompanyEmail.count({
        where: {
          companyId: parseInt(companyId),
          isActive: true,
          id: { [Op.ne]: emailId }
        }
      });

      if (activeEmailCount >= 5) {
        return res.status(400).json({
          success: false,
          message: 'Company can have maximum 5 active email addresses'
        });
      }
    }

    // Check if new email address already exists (if changing email)
    if (emailAddress && emailAddress !== email.emailAddress) {
      const existingEmail = await CompanyEmail.findOne({
        where: {
          companyId: parseInt(companyId),
          emailAddress,
          id: { [Op.ne]: emailId }
        }
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email address already exists for this company'
        });
      }
    }

    // Update email
    await email.update({
      emailAddress: emailAddress || email.emailAddress,
      emailType: emailType || email.emailType,
      isActive: isActive !== undefined ? isActive : email.isActive
    });

    res.json({
      success: true,
      message: 'Email address updated successfully',
      email
    });
  } catch (error) {
    console.error('Error updating company email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email address',
      error: error.message
    });
  }
};

/**
 * Delete an email address
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteCompanyEmail = async (req, res) => {
  try {
    const { companyId, emailId } = req.params;
    const userCompanyId = req.user.companyId;
    const userRole = req.user.role;

    // Check authorization
    if (userRole !== 'admin' && parseInt(companyId) !== userCompanyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage your own company\'s email addresses.'
      });
    }

    // Find the email
    const email = await CompanyEmail.findOne({
      where: { id: emailId, companyId: parseInt(companyId) }
    });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email address not found'
      });
    }

    // Delete email
    await email.destroy();

    res.json({
      success: true,
      message: 'Email address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting company email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email address',
      error: error.message
    });
  }
};

module.exports = {
  getCompanyEmails,
  addCompanyEmail,
  updateCompanyEmail,
  deleteCompanyEmail
};
