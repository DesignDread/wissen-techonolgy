import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { ErrorHandler, catchAsyncErrors } from '../utils/errorHandler.js';
import { bookSpareSeat, releaseSeat } from '../services/bookingService.js';

/**
 * POST /api/bookings/spare
 * Book a spare seat for a user
 */
export const bookSpareSeatController = catchAsyncErrors(
  async (req, res, next) => {
    const { date } = req.body;
    const userId = req.user.userId;

    // Validate date
    if (!date) {
      return next(new ErrorHandler('Please provide a date', 400));
    }

    const bookingDate = new Date(date);

    if (isNaN(bookingDate.getTime())) {
      return next(new ErrorHandler('Invalid date format', 400));
    }

    // Book spare seat
    const booking = await bookSpareSeat(userId, bookingDate);

    res.status(201).json({
      success: true,
      message: 'Spare seat booked successfully',
      data: {
        bookingId: booking._id,
        date: booking.date,
        seatNumber: booking.seatNumber,
        bookingType: booking.bookingType,
        status: booking.status,
      },
    });
  }
);

/**
 * POST /api/bookings/release
 * Release a user's booking for a date
 */
export const releaseSeatController = catchAsyncErrors(async (req, res, next) => {
  const { date } = req.body;
  const userId = req.user.userId;

  // Validate date
  if (!date) {
    return next(new ErrorHandler('Please provide a date', 400));
  }

  const bookingDate = new Date(date);

  if (isNaN(bookingDate.getTime())) {
    return next(new ErrorHandler('Invalid date format', 400));
  }

  // Release seat
  const booking = await releaseSeat(userId, bookingDate);

  res.status(200).json({
    success: true,
    message: 'Seat released successfully',
    data: {
      bookingId: booking._id,
      date: booking.date,
      seatNumber: booking.seatNumber,
      status: booking.status,
    },
  });
});

/**
 * GET /api/bookings/my-bookings
 * Get all bookings for the current user
 */
export const getMyBookings = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.userId;
  const { fromDate, toDate, status } = req.query;

  const query = { userId };

  if (fromDate || toDate) {
    query.date = {};
    if (fromDate) {
      query.date.$gte = new Date(fromDate);
    }
    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      query.date.$lte = endDate;
    }
  }

  if (status) {
    query.status = status;
  }

  const bookings = await Booking.find(query).sort({ date: -1 }).populate('userId', 'name email squatNumber');

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

/**
 * GET /api/bookings/date/:date
 * Get all bookings for a specific date
 */
export const getBookingsForDate = catchAsyncErrors(async (req, res, next) => {
  const { date } = req.params;
  const bookingDate = new Date(date);

  if (isNaN(bookingDate.getTime())) {
    return next(new ErrorHandler('Invalid date format', 400));
  }

  const startOfDay = new Date(bookingDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(bookingDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'active',
  }).populate('userId', 'name email squatNumber batchNumber');

  // Calculate seat statistics
  const totalSeats = 50;
  const occupiedSeats = bookings.length;
  const availableSeats = totalSeats - occupiedSeats;
  const scheduledCount = bookings.filter((b) => b.bookingType === 'scheduled').length;
  const spareCount = bookings.filter((b) => b.bookingType === 'spare').length;

  res.status(200).json({
    success: true,
    data: {
      date: bookingDate,
      bookings,
      statistics: {
        totalSeats,
        occupiedSeats,
        availableSeats,
        scheduledBookings: scheduledCount,
        spareBookings: spareCount,
      },
    },
  });
});

/**
 * GET /api/bookings/seat-status/:date
 * Get seat availability status for a date (array of 50 seats)
 */
export const getSeatStatus = catchAsyncErrors(async (req, res, next) => {
  const { date } = req.params;
  const bookingDate = new Date(date);

  if (isNaN(bookingDate.getTime())) {
    return next(new ErrorHandler('Invalid date format', 400));
  }

  const startOfDay = new Date(bookingDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(bookingDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bookings = await Booking.find({
    date: { $gte: startOfDay, $lte: endOfDay },
    status: 'active',
  }).select('seatNumber bookingType');

  const seatMap = {};
  bookings.forEach((booking) => {
    seatMap[booking.seatNumber] = booking.bookingType;
  });

  const seatStatus = [];
  for (let i = 1; i <= 50; i++) {
    seatStatus.push({
      seatNumber: i,
      status: seatMap[i] ? 'occupied' : 'available',
      bookingType: seatMap[i] || null,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      date: bookingDate,
      seats: seatStatus,
    },
  });
});
