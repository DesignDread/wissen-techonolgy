import { ErrorHandler, catchAsyncErrors } from '../utils/errorHandler.js';
import { triggerManualAutobooking } from '../utils/cronJobs.js';

/**
 * POST /api/admin/trigger-autobooking
 * Manually trigger auto-booking for a specific date
 * Body: { date: "2025-02-24" } (optional)
 */
export const triggerAutobooking = catchAsyncErrors(async (req, res, next) => {
  const { date } = req.body;

  let targetDate = new Date();
  if (date) {
    targetDate = new Date(date);
  }

  if (isNaN(targetDate.getTime())) {
    return next(new ErrorHandler('Invalid date format', 400));
  }

  const result = await triggerManualAutobooking(targetDate);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(200).json({
    success: true,
    message: 'Auto-booking triggered successfully',
    data: result,
  });
});

/**
 * GET /api/admin/system-status
 * Get system status and statistics
 */
export const getSystemStatus = catchAsyncErrors(async (req, res, next) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    success: true,
    data: {
      status: 'running',
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      environment: process.env.NODE_ENV,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      },
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/admin/batch-schedule/:date
 * Get batch schedule information for a date
 */
export const getBatchScheduleInfo = catchAsyncErrors(async (req, res, next) => {
  const { date } = req.params;
  const targetDate = new Date(date);

  if (isNaN(targetDate.getTime())) {
    return next(new ErrorHandler('Invalid date format', 400));
  }

  const {
    getWeekNumberInMonth,
    getDayOfWeek,
    isWeekday,
    getScheduledBatchForDate,
  } = await import('../utils/batchSchedule.js');

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = days[getDayOfWeek(targetDate)];
  const week = getWeekNumberInMonth(targetDate);
  const scheduledBatch = getScheduledBatchForDate(targetDate);

  res.status(200).json({
    success: true,
    data: {
      date: targetDate.toISOString().split('T')[0],
      dayOfWeek: dayName,
      weekOfMonth: week,
      isWeekday: isWeekday(targetDate),
      scheduledBatch: scheduledBatch,
      message: scheduledBatch
        ? `Batch ${scheduledBatch} is scheduled for this date`
        : 'No batch scheduled for this date',
    },
  });
});

/**
 * POST /api/admin/reset-bookings
 * Delete all bookings (USE WITH CAUTION - for testing only)
 */
export const resetBookings = catchAsyncErrors(async (req, res, next) => {
  const Booking = (await import('../models/Booking.js')).default;

  const result = await Booking.deleteMany({});

  res.status(200).json({
    success: true,
    message: 'All bookings deleted',
    deletedCount: result.deletedCount,
  });
});
