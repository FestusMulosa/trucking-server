const jwt = require('jsonwebtoken');
const { User } = require('../models');

// In-memory cache for user data to avoid database lookups on every request
const userCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL

// Clear expired cache entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, cached] of userCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

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

    // Use JWT payload directly for maximum performance (no database lookup needed)
    if (decoded.id && decoded.email && decoded.role && decoded.companyId) {
      // JWT contains all necessary user data - use it directly
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        companyId: decoded.companyId,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        active: decoded.active
      };
    } else {
      // Fallback to cache/database lookup for older tokens
      const cacheKey = `user_${decoded.id}`;
      const cached = userCache.get(cacheKey);
      const now = Date.now();

      let user;

      if (cached && (now - cached.timestamp < CACHE_TTL)) {
        // Use cached user data
        user = cached.data;
        console.log(`Cache hit for user ${decoded.id}`);
      } else {
        // Cache miss or expired - fetch from database
        console.log(`Cache miss for user ${decoded.id} - fetching from database`);
        user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] } // Don't return the password
        });

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Invalid token. User not found.'
          });
        }

        // Cache the user data
        userCache.set(cacheKey, {
          data: user.toJSON(), // Convert Sequelize instance to plain object
          timestamp: now
        });
      }

      req.user = user;
    }

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

// Middleware to check if user has super admin role
const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'super_admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Super admin role required.'
    });
  }
};

// Middleware to check if user has company admin role or higher
const isCompanyAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'super_admin' || req.user.role === 'company_admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Company admin role or higher required.'
    });
  }
};

// Middleware to check if user has admin role (legacy - now company_admin)
const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'super_admin' || req.user.role === 'company_admin' || req.user.role === 'admin')) {
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
  if (req.user && (req.user.role === 'super_admin' || req.user.role === 'company_admin' || req.user.role === 'admin' || req.user.role === 'manager')) {
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

  // Super admins can access any company
  if (req.user.role === 'super_admin') {
    next();
  } else if (req.user.role === 'company_admin' || req.user.role === 'admin' || req.user.companyId === companyId) {
    // Company admins and users can only access their own company
    if (req.user.companyId === companyId) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access resources from your own company.'
      });
    }
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access resources from your own company.'
    });
  }
};

// Function to clear user cache (useful when user data is updated)
const clearUserCache = (userId) => {
  const cacheKey = `user_${userId}`;
  userCache.delete(cacheKey);
  console.log(`Cleared cache for user ${userId}`);
};

// Function to get cache statistics
const getCacheStats = () => {
  return {
    size: userCache.size,
    keys: Array.from(userCache.keys())
  };
};

// Ultra-fast token verification for high-frequency endpoints (no database lookup ever)
const verifyTokenFast = (req, res, next) => {
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

    // Verify the token (synchronous operation)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Use JWT payload directly (no database lookup)
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      companyId: decoded.companyId,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      active: decoded.active
    };

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

module.exports = {
  verifyToken,
  verifyTokenFast,
  isSuperAdmin,
  isCompanyAdmin,
  isAdmin,
  isManager,
  isSameCompanyOrAdmin,
  clearUserCache,
  getCacheStats
};
