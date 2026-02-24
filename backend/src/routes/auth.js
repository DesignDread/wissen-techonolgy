import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 * Body: { name, email, password, squatNumber (1-10), batchNumber (1 or 2) }
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login user
 * Body: { email, password }
 */
router.post('/login', login);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', logout);

/**
 * GET /api/auth/me
 * Get current user profile (protected)
 */
router.get('/me', protect, getProfile);

/**
 * PUT /api/auth/update-profile
 * Update user profile (protected)
 * Body: { name, batchNumber }
 */
router.put('/update-profile', protect, updateProfile);

/**
 * PUT /api/auth/change-password
 * Change password (protected)
 * Body: { currentPassword, newPassword }
 */
router.put('/change-password', protect, changePassword);

export default router;
