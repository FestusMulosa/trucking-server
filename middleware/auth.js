const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided or invalid format.' 
      });
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user by id
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] } // Don't return the password
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. User not found.' 
      });
    }

    // Add the user to the request object
    req.user = user;
    
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

// Middleware to check if user has admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin role required.' 
    });
  }
};

// Middleware to check if user has manager role or higher
const isManager = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'manager')) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. Manager role or higher required.' 
    });
  }
};

// Middleware to check if user belongs to the same company or is admin
const isSameCompanyOrAdmin = (req, res, next) => {
  const companyId = parseInt(req.params.companyId || req.body.companyId);
  
  if (!companyId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Company ID is required.' 
    });
  }

  if (req.user.role === 'admin' || req.user.companyId === companyId) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied. You can only access resources from your own company.' 
    });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isManager,
  isSameCompanyOrAdmin
};
