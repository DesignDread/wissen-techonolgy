import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Holiday from '../models/Holiday.js';
import { ErrorHandler } from '../utils/errorHandler.js';
import { isScheduledDay } from '../utils/batchSchedule.js';

/**
 * Check if a date is a holiday
 */
export const isHoliday = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const holiday = await Holiday.findOne({
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  return !!holiday;
};

/**
 * Check if user already has a booking for the given date
 */
export const userHasBookingOnDate = async (userId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const booking = await Booking.findOne({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'active',
  });

  return !!booking;
};

/**
 * Count spare bookings for a date (max 10)
 */
export const countSpareBookingsForDate = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await Booking.countDocuments({
    date: { $gte: startOfDay, $lte: endOfDay },
    bookingType: 'spare',
    status: 'active',
  });

  // Hard cap at 10 since seats are 41-50
  return Math.min(count, 10);
};

/**
 * Get all occupied seats for a date
 */
export const getOccupiedSeatsForDate = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookings = await Booking.find(
    {
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'active',
    },
    'seatNumber'
  );

  return new Set(bookings.map((b) => b.seatNumber));
};

/**
 * Find the first available seat for a date within a specific range
 * @param {Date} date
 * @param {number} startSeat - Start of range (inclusive)
 * @param {number} endSeat - End of range (inclusive)
 */
export const findAvailableSeat = async (date, startSeat = 1, endSeat = 50) => {
  const occupiedSeats = await getOccupiedSeatsForDate(date);

  for (let seatNumber = startSeat; seatNumber <= endSeat; seatNumber++) {
    if (!occupiedSeats.has(seatNumber)) {
      return seatNumber;
    }
  }

  return null;
};

/**
 * Create a booking with retry logic for race conditions
 * Returns booking if successful, throws error if all retries fail
 * Spare bookings are restricted to seats 41-50
 * Auto-bookings use seats 1-40
 */
export const createBookingWithRetry = async (
  userId,
  date,
  bookingType,
  maxRetries = 3
) => {
  let lastError;

  // Determine seat range based on booking type
  const startSeat = bookingType === 'spare' ? 41 : 1;
  const endSeat = bookingType === 'spare' ? 50 : 40;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Find available seat in the designated range
      const seatNumber = await findAvailableSeat(date, startSeat, endSeat);

      if (!seatNumber) {
        throw new ErrorHandler(
          bookingType === 'spare'
            ? 'No available spare seats (41-50) for this date'
            : 'No available seats (1-40) for this date',
          400
        );
      }

      // Create booking
      const booking = new Booking({
        userId,
        date,
        seatNumber,
        bookingType,
        status: 'active',
      });

      await booking.save();
      return booking;
    } catch (error) {
      lastError = error;

      // If it's a duplicate key error on (seatNumber, date) index, retry
      if (error.code === 11000 && attempt < maxRetries) {
        // Wait a tiny bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 10));
        continue;
      }

      // For other errors or last attempt, throw
      throw error;
    }
  }

  throw lastError || new ErrorHandler('Failed to create booking', 500);
};

/**
 * Validate spare seat booking request
 */
export const validateSpareBookingRequest = async (userId, date) => {
  // Check if it's a holiday
  if (await isHoliday(date)) {
    throw new ErrorHandler('Cannot book on a holiday', 400);
  }

  // Check if user already has a booking for this date
  if (await userHasBookingOnDate(userId, date)) {
    throw new ErrorHandler('You already have a booking for this date', 400);
  }

  // Get user and check if it's their scheduled day
  const user = await User.findById(userId);
  if (!user) {
    throw new ErrorHandler('User not found', 404);
  }

  // CRITICAL: Prevent users from booking on their scheduled batch day
  if (isScheduledDay(user, date)) {
    throw new ErrorHandler(
      `Cannot book spare seat on your scheduled day - Batch ${user.batchNumber} is scheduled for this date. You are automatically booked.`,
      400
    );
  }

  // Check if current time is >= 12 PM
  const now = new Date();
  const currentHour = now.getHours();
  if (currentHour < 12) {
    throw new ErrorHandler(
      'Spare seat booking opens at 12 PM. Please try again later',
      400
    );
  }

  // Count spare bookings (max 10 allowed)
  const spareCount = await countSpareBookingsForDate(date);

  if (spareCount >= 10) {
    throw new ErrorHandler('All spare seats have been booked', 400);
  }
};

/**
 * Book a spare seat for a user
 */
export const bookSpareSeat = async (userId, date) => {
  // Validate request
  await validateSpareBookingRequest(userId, date);

  // Create booking with retry logic
  const booking = await createBookingWithRetry(userId, date, 'spare');

  return booking;
};

/**
 * Release a user's booking for a date
 * Converts status to 'released' or deletes the booking
 */
export const releaseSeat = async (userId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const booking = await Booking.findOne({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'active',
  });

  if (!booking) {
    throw new ErrorHandler('No active booking found for this date', 404);
  }

  // Set status to released instead of deleting
  booking.status = 'released';
  await booking.save();

  return booking;
};
