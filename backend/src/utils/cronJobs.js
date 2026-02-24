import User from '../models/User.js';
import { getScheduledBatchForDate } from '../utils/batchSchedule.js';
import { createBookingWithRetry } from '../services/bookingService.js';

/**
 * Auto-booking CRON job
 * Runs at 12:01 AM every day
 * Books 40 seats for scheduled batch users
 */
export const runDailyAutoBooking = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(
      `[AUTO-BOOKING] Starting auto-booking process for ${today.toDateString()}`
    );

    // Determine which batch is scheduled for today
    const scheduledBatch = getScheduledBatchForDate(today);

    if (!scheduledBatch) {
      console.log(
        `[AUTO-BOOKING] No scheduled batch for ${today.toDateString()}`
      );
      return;
    }

    console.log(
      `[AUTO-BOOKING] Scheduled batch for today: Batch ${scheduledBatch}`
    );

    // Get 40 users from the scheduled batch
    const users = await User.find({ batchNumber: scheduledBatch, isActive: true })
      .limit(40)
      .lean();

    if (users.length === 0) {
      console.log(
        `[AUTO-BOOKING] No active users found for Batch ${scheduledBatch}`
      );
      return;
    }

    console.log(
      `[AUTO-BOOKING] Found ${users.length} users to book from Batch ${scheduledBatch}`
    );

    // Book seats for each user
    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    for (const user of users) {
      try {
        const booking = await createBookingWithRetry(
          user._id,
          today,
          'scheduled',
          3 // 3 retry attempts
        );

        console.log(
          `[AUTO-BOOKING] ✓ Booked seat ${booking.seatNumber} for user ${user._id}`
        );
        successCount++;
      } catch (error) {
        failureCount++;
        failures.push({
          userId: user._id,
          email: user.email,
          error: error.message,
        });
        console.warn(`[AUTO-BOOKING] ✗ Failed to book for user ${user._id}: ${error.message}`);
      }
    }

    console.log(
      `[AUTO-BOOKING] Completed: ${successCount} successful, ${failureCount} failed`
    );

    if (failures.length > 0) {
      console.log(
        `[AUTO-BOOKING] Failed bookings:`,
        JSON.stringify(failures, null, 2)
      );
    }

    return {
      success: true,
      date: today,
      batch: scheduledBatch,
      totalProcessed: users.length,
      successful: successCount,
      failed: failureCount,
      failures,
    };
  } catch (error) {
    console.error('[AUTO-BOOKING] Error during auto-booking process:', error);
    throw error;
  }
};

/**
 * Initialize CRON job for daily auto-booking at 12:01 AM
 * Uses node-cron
 */
export const initializeAutobookingCron = (cronModule) => {
  // Run at 12:01 AM every day (00:01)
  const task = cronModule.schedule('1 0 * * *', () => {
    console.log('[CRON] Triggering daily auto-booking...');
    runDailyAutoBooking().catch((error) => {
      console.error('[CRON] Auto-booking task failed:', error);
    });
  });

  console.log('[CRON] Daily auto-booking scheduled for 12:01 AM every day');
  return task;
};

/**
 * Manual trigger for auto-booking (for testing/admin)
 */
export const triggerManualAutobooking = async (date = new Date()) => {
  date.setHours(0, 0, 0, 0);

  try {
    console.log(
      `[MANUAL-BOOKING] Starting manual auto-booking for ${date.toDateString()}`
    );

    const scheduledBatch = getScheduledBatchForDate(date);

    if (!scheduledBatch) {
      return {
        success: false,
        message: `No scheduled batch for ${date.toDateString()}`,
      };
    }

    const users = await User.find({ batchNumber: scheduledBatch, isActive: true })
      .limit(40)
      .lean();

    let successCount = 0;
    let failureCount = 0;
    const failures = [];

    for (const user of users) {
      try {
        await createBookingWithRetry(user._id, date, 'scheduled', 3);
        successCount++;
      } catch (error) {
        failureCount++;
        failures.push({
          userId: user._id,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      date,
      batch: scheduledBatch,
      totalProcessed: users.length,
      successful: successCount,
      failed: failureCount,
      failures: failureCount > 0 ? failures : undefined,
    };
  } catch (error) {
    console.error('[MANUAL-BOOKING] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
