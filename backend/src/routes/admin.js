import express from 'express';
import {
  triggerAutobooking,
  getSystemStatus,
  getBatchScheduleInfo,
  resetBookings,
} from '../controllers/adminController.js';

const router = express.Router();

/**
 * POST /api/admin/trigger-autobooking
 * Manually trigger auto-booking for a date (for testing)
 * Body: { date: "2025-02-24" } (optional, defaults to today)
 */
router.post('/trigger-autobooking', triggerAutobooking);

/**
 * GET /api/admin/system-status
 * Get system health and statistics
 */
router.get('/system-status', getSystemStatus);

/**
 * GET /api/admin/batch-schedule/:date
 * Get batch schedule information for a date
 * Params: :date in YYYY-MM-DD format
 */
router.get('/batch-schedule/:date', getBatchScheduleInfo);

/**
 * POST /api/admin/reset-bookings
 * Reset all bookings (FOR TESTING ONLY)
 * Warning: This deletes all bookings
 */
router.post('/reset-bookings', resetBookings);

export default router;
