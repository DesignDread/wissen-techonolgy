import jwt from 'jsonwebtoken';
import { ErrorHandler } from '../utils/errorHandler.js';

/**
 * Protect route - Requires valid JWT
 */
export const protect = (req, res, next) => {
  try {
    // Get token from headers
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message,
    });
  }
};

/**
 * Optional authentication - Token is optional, user may be null
 */
export const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // If token is invalid but it's optional, just continue
    next();
  }
};

/**
 * Admin role required - User must be authenticated and have admin role
 */
export const requireAdmin = (req, res, next) => {
  // First check if user is authenticated
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }

  next();
};

/**
 * Middleware chain: protect → requireAdmin
 * Applied to routes that require both authentication and admin role
 */
export const protectAdmin = [protect, requireAdmin];
