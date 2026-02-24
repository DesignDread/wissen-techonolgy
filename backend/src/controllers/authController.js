import User from '../models/User.js';
import { ErrorHandler, catchAsyncErrors } from '../utils/errorHandler.js';
import { generateToken } from '../utils/jwt.js';

/**
 * POST /api/auth/register
 * Register a new user
 */
export const register = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password, squatNumber, batchNumber } = req.body;

  // Validation
  if (!name || !email || !password || !squatNumber || !batchNumber) {
    return next(
      new ErrorHandler(
        'Please provide name, email, password, squatNumber, and batchNumber',
        400
      )
    );
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler('Email already registered', 400));
  }

  // Check if squat number already taken
  const existingSquat = await User.findOne({ squatNumber });
  if (existingSquat) {
    return next(new ErrorHandler('This squat number is already taken', 400));
  }

  // Validate batch number
  if (batchNumber != 1 && batchNumber != 2) {
    return next(new ErrorHandler('Batch number must be 1 or 2', 400));
  }

  // Validate squat number
  if (squatNumber < 1 || squatNumber > 10) {
    return next(new ErrorHandler('Squat number must be between 1 and 10', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    squatNumber,
    batchNumber,
  });

  // Generate token
  const token = generateToken(user._id, user.email, user.role);

  // Return response (don't include password)
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        squatNumber: user.squatNumber,
        batchNumber: user.batchNumber,
        role: user.role,
      },
      token,
    },
  });
});

/**
 * POST /api/auth/login
 * Login user
 */
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return next(new ErrorHandler('Please provide email and password', 400));
  }

  // Find user and select password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  // Check if password matches
  const isPasswordValid = await user.matchPassword(password);

  if (!isPasswordValid) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorHandler('Your account has been deactivated', 403));
  }

  // Generate token
  const token = generateToken(user._id, user.email, user.role);

  // Return response
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        squatNumber: user.squatNumber,
        batchNumber: user.batchNumber,
        role: user.role,
      },
      token,
    },
  });
});

/**
 * GET /api/auth/me
 * Get current user profile (protected)
 */
export const getProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      squatNumber: user.squatNumber,
      batchNumber: user.batchNumber,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

/**
 * POST /api/auth/logout
 * Logout user (token invalidation happens on client side)
 */
export const logout = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful. Please delete token from client.',
  });
});

/**
 * PUT /api/auth/update-profile
 * Update user profile (protected)
 */
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const { name, batchNumber, squatNumber } = req.body;
  const userId = req.user.userId;

  // Find user
  let user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  // Update allowed fields
  if (name) user.name = name;
  
  // Validate and update batch number if provided
  if (batchNumber) {
    if (batchNumber !== 1 && batchNumber !== 2) {
      return next(new ErrorHandler('Batch number must be 1 or 2', 400));
    }
    user.batchNumber = batchNumber;
  }

  // Note: squatNumber should not be updated after registration
  // (prevent conflicts with existing assignments)

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      squatNumber: user.squatNumber,
      batchNumber: user.batchNumber,
      role: user.role,
    },
  });
});

/**
 * PUT /api/auth/change-password
 * Change user password (protected)
 */
export const changePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  // Validation
  if (!currentPassword || !newPassword) {
    return next(
      new ErrorHandler('Please provide current and new password', 400)
    );
  }

  // Find user with password field
  const user = await User.findById(userId).select('+password');

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  // Verify current password
  const isPasswordValid = await user.matchPassword(currentPassword);

  if (!isPasswordValid) {
    return next(new ErrorHandler('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});
