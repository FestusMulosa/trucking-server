const { Maintenance, Truck, Company } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all maintenance records for a company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMaintenanceRecords = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { status, truckId, startDate, endDate } = req.query;
    
    // Build the where clause
    const where = { companyId };
    
    if (status) {
      where.status = status;
    }
    
    if (truckId) {
      where.truckId = truckId;
    }
    
    if (startDate && endDate) {
      where.startDate = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      where.startDate = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      where.startDate = {
        [Op.lte]: endDate
      };
    }
    
    // Get all maintenance records for the company
    const maintenanceRecords = await Maintenance.findAll({
      where,
      include: [
        {
          model: Truck,
          as: 'truck',
          attributes: ['id', 'name', 'numberPlate', 'make', 'model']
        }
      ],
      order: [['startDate', 'DESC']]
    });
    
    res.json({
      success: true,
      maintenanceRecords
    });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance records',
      error: error.message
    });
  }
};

/**
 * Get a single maintenance record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMaintenanceRecord = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    
    // Get the maintenance record
    const maintenanceRecord = await Maintenance.findOne({
      where: { id, companyId },
      include: [
        {
          model: Truck,
          as: 'truck',
          attributes: ['id', 'name', 'numberPlate', 'make', 'model']
        }
      ]
    });
    
    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }
    
    res.json({
      success: true,
      maintenanceRecord
    });
  } catch (error) {
    console.error('Error fetching maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch maintenance record',
      error: error.message
    });
  }
};

/**
 * Create a new maintenance record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createMaintenanceRecord = async (req, res) => {
  try {
    const { companyId } = req.user;
    const {
      truckId,
      maintenanceType,
      description,
      startDate,
      endDate,
      status,
      cost,
      notes,
      performedBy
    } = req.body;
    
    // Validate required fields
    if (!truckId || !maintenanceType || !startDate || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if the truck exists and belongs to the company
    const truck = await Truck.findOne({
      where: { id: truckId, companyId }
    });
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found or does not belong to your company'
      });
    }
    
    // Create the maintenance record
    const maintenanceRecord = await Maintenance.create({
      companyId,
      truckId,
      maintenanceType,
      description,
      startDate,
      endDate,
      status,
      cost,
      notes,
      performedBy
    });
    
    // If the maintenance is in progress, update the truck status
    if (status === 'in_progress') {
      await truck.update({ status: 'maintenance' });
    }
    
    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      maintenanceRecord
    });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create maintenance record',
      error: error.message
    });
  }
};

/**
 * Update a maintenance record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateMaintenanceRecord = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const {
      truckId,
      maintenanceType,
      description,
      startDate,
      endDate,
      status,
      cost,
      notes,
      performedBy
    } = req.body;
    
    // Find the maintenance record
    const maintenanceRecord = await Maintenance.findOne({
      where: { id, companyId },
      include: [
        {
          model: Truck,
          as: 'truck'
        }
      ]
    });
    
    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }
    
    // If truckId is changing, check if the new truck exists and belongs to the company
    if (truckId && truckId !== maintenanceRecord.truckId) {
      const truck = await Truck.findOne({
        where: { id: truckId, companyId }
      });
      
      if (!truck) {
        return res.status(404).json({
          success: false,
          message: 'Truck not found or does not belong to your company'
        });
      }
    }
    
    // Update the maintenance record
    await maintenanceRecord.update({
      truckId: truckId || maintenanceRecord.truckId,
      maintenanceType: maintenanceType || maintenanceRecord.maintenanceType,
      description: description !== undefined ? description : maintenanceRecord.description,
      startDate: startDate || maintenanceRecord.startDate,
      endDate: endDate !== undefined ? endDate : maintenanceRecord.endDate,
      status: status || maintenanceRecord.status,
      cost: cost !== undefined ? cost : maintenanceRecord.cost,
      notes: notes !== undefined ? notes : maintenanceRecord.notes,
      performedBy: performedBy !== undefined ? performedBy : maintenanceRecord.performedBy
    });
    
    // Handle truck status changes based on maintenance status
    if (status && status !== maintenanceRecord.status) {
      const truck = await Truck.findByPk(maintenanceRecord.truckId);
      
      if (truck) {
        if (status === 'in_progress') {
          await truck.update({ status: 'maintenance' });
        } else if (status === 'completed' && truck.status === 'maintenance') {
          // Only change back to active if it's currently in maintenance
          await truck.update({ status: 'active' });
        }
      }
    }
    
    res.json({
      success: true,
      message: 'Maintenance record updated successfully',
      maintenanceRecord
    });
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update maintenance record',
      error: error.message
    });
  }
};

/**
 * Delete a maintenance record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteMaintenanceRecord = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    
    // Find the maintenance record
    const maintenanceRecord = await Maintenance.findOne({
      where: { id, companyId }
    });
    
    if (!maintenanceRecord) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }
    
    // Delete the maintenance record
    await maintenanceRecord.destroy();
    
    res.json({
      success: true,
      message: 'Maintenance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete maintenance record',
      error: error.message
    });
  }
};

module.exports = {
  getMaintenanceRecords,
  getMaintenanceRecord,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord
};
