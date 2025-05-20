const { PlatformSetting, EmailRecipient, Company } = require('../models');

/**
 * Get all settings for a company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSettings = async (req, res) => {
  try {
    const { companyId } = req.user;
    
    // Get all settings for the company
    const settings = await PlatformSetting.findAll({
      where: { companyId },
      order: [['category', 'ASC'], ['settingKey', 'ASC']]
    });

    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      
      // Convert value based on type
      let value = setting.settingValue;
      if (setting.settingType === 'boolean') {
        value = value === 'true';
      } else if (setting.settingType === 'number') {
        value = parseFloat(value);
      } else if (setting.settingType === 'json' || setting.settingType === 'array') {
        try {
          value = JSON.parse(value);
        } catch (error) {
          console.error(`Error parsing JSON for setting ${setting.settingKey}:`, error);
        }
      }
      
      acc[setting.category][setting.settingKey] = value;
      return acc;
    }, {});

    res.json({
      success: true,
      settings: groupedSettings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
};

/**
 * Update settings for a company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateSettings = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings data'
      });
    }
    
    // Start a transaction
    const transaction = await PlatformSetting.sequelize.transaction();
    
    try {
      // Process each category of settings
      for (const [category, categorySettings] of Object.entries(settings)) {
        for (const [key, value] of Object.entries(categorySettings)) {
          // Determine the setting type
          let settingType = typeof value;
          let settingValue = value;
          
          if (settingType === 'boolean') {
            settingValue = value.toString();
            settingType = 'boolean';
          } else if (settingType === 'number') {
            settingValue = value.toString();
            settingType = 'number';
          } else if (settingType === 'object') {
            settingValue = JSON.stringify(value);
            settingType = Array.isArray(value) ? 'array' : 'json';
          }
          
          // Find or create the setting
          const [setting, created] = await PlatformSetting.findOrCreate({
            where: {
              companyId,
              category,
              settingKey: key
            },
            defaults: {
              settingValue,
              settingType,
              description: `Setting for ${key}`
            },
            transaction
          });
          
          // If the setting already exists, update it
          if (!created) {
            await setting.update({
              settingValue,
              settingType
            }, { transaction });
          }
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
      res.json({
        success: true,
        message: 'Settings updated successfully'
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

/**
 * Get all email recipients for a company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmailRecipients = async (req, res) => {
  try {
    const { companyId } = req.user;
    
    const recipients = await EmailRecipient.findAll({
      where: { companyId },
      order: [['email', 'ASC']]
    });
    
    res.json({
      success: true,
      recipients
    });
  } catch (error) {
    console.error('Error fetching email recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email recipients',
      error: error.message
    });
  }
};

/**
 * Add a new email recipient
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addEmailRecipient = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { email, name, notificationTypes } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Check if recipient already exists
    const existingRecipient = await EmailRecipient.findOne({
      where: { companyId, email }
    });
    
    if (existingRecipient) {
      return res.status(400).json({
        success: false,
        message: 'Email recipient already exists'
      });
    }
    
    // Create new recipient
    const recipient = await EmailRecipient.create({
      companyId,
      email,
      name: name || '',
      isActive: true,
      notificationTypes: notificationTypes || {
        maintenanceAlerts: true,
        statusChanges: true,
        dailyReports: false,
        fitnessExpiry: true
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Email recipient added successfully',
      recipient
    });
  } catch (error) {
    console.error('Error adding email recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add email recipient',
      error: error.message
    });
  }
};

/**
 * Update an email recipient
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateEmailRecipient = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const { email, name, isActive, notificationTypes } = req.body;
    
    // Find the recipient
    const recipient = await EmailRecipient.findOne({
      where: { id, companyId }
    });
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Email recipient not found'
      });
    }
    
    // Update recipient
    await recipient.update({
      email: email || recipient.email,
      name: name !== undefined ? name : recipient.name,
      isActive: isActive !== undefined ? isActive : recipient.isActive,
      notificationTypes: notificationTypes || recipient.notificationTypes
    });
    
    res.json({
      success: true,
      message: 'Email recipient updated successfully',
      recipient
    });
  } catch (error) {
    console.error('Error updating email recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email recipient',
      error: error.message
    });
  }
};

/**
 * Delete an email recipient
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteEmailRecipient = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    
    // Find the recipient
    const recipient = await EmailRecipient.findOne({
      where: { id, companyId }
    });
    
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Email recipient not found'
      });
    }
    
    // Delete recipient
    await recipient.destroy();
    
    res.json({
      success: true,
      message: 'Email recipient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email recipient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email recipient',
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getEmailRecipients,
  addEmailRecipient,
  updateEmailRecipient,
  deleteEmailRecipient
};
