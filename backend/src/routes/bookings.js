import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  bookSpareSeatController,
  releaseSeatController,
  getMyBookings,
  getBookingsForDate,
  getSeatStatus,
} from '../controllers/bookingController.js';

const router = express.Router();

// Protected routes (require JWT authentication)

/**
 * POST /api/bookings/spare
 * Book a spare seat for today or a future date
 * Body: { date: "YYYY-MM-DD" }
 */
router.post('/spare', protect, bookSpareSeatController);

/**
 * POST /api/bookings/release
 * Release a user's booking for a specific date
 * Body: { date: "YYYY-MM-DD" }
 */
router.post('/release', protect, releaseSeatController);

/**
 * GET /api/bookings/my-bookings
 * Get all bookings for the current user
 * Query params: fromDate, toDate, status
 */
router.get('/my-bookings', protect, getMyBookings);

// Public routes

/**
 * GET /api/bookings/date/:date
 * Get all bookings for a specific date (with seat statistics)
 */
router.get('/date/:date', getBookingsForDate);

/**
 * GET /api/bookings/seat-status/:date
 * Get seat availability status for a date
 */
router.get('/seat-status/:date', getSeatStatus);

export default router;
