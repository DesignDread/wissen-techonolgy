import express from 'express';
import { protect, protectAdmin } from '../middleware/auth.js';
import { ErrorHandler, catchAsyncErrors } from '../utils/errorHandler.js';
import Holiday from '../models/Holiday.js';

const router = express.Router();

/**
 * POST /api/holidays (Admin only)
 * Create a new holiday
 */
const createHoliday = catchAsyncErrors(async (req, res, next) => {
  const { date, reason } = req.body;

  if (!date || !reason) {
    return next(
      new ErrorHandler('Please provide both date and reason', 400)
    );
  }

  const holiday = new Holiday({
    date: new Date(date),
    reason,
  });

  await holiday.save();

  res.status(201).json({
    success: true,
    message: 'Holiday created successfully',
    data: holiday,
  });
});

/**
 * GET /api/holidays (Public)
 * Get all holidays
 */
const getHolidays = catchAsyncErrors(async (req, res, next) => {
  const { fromDate, toDate } = req.query;

  const query = {};

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

  const holidays = await Holiday.find(query).sort({ date: 1 });

  res.status(200).json({
    success: true,
    count: holidays.length,
    data: holidays,
  });
});

/**
 * GET /api/holidays/:id (Public)
 * Get a specific holiday
 */
const getHolidayById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const holiday = await Holiday.findById(id);

  if (!holiday) {
    return next(new ErrorHandler('Holiday not found', 404));
  }

  res.status(200).json({
    success: true,
    data: holiday,
  });
});

/**
 * PUT /api/holidays/:id (Admin only)
 * Update a holiday
 */
const updateHoliday = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { date, reason } = req.body;

  let holiday = await Holiday.findById(id);

  if (!holiday) {
    return next(new ErrorHandler('Holiday not found', 404));
  }

  if (date) holiday.date = new Date(date);
  if (reason) holiday.reason = reason;

  await holiday.save();

  res.status(200).json({
    success: true,
    message: 'Holiday updated successfully',
    data: holiday,
  });
});

/**
 * DELETE /api/holidays/:id (Admin only)
 * Delete a holiday
 */
const deleteHoliday = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const holiday = await Holiday.findByIdAndDelete(id);

  if (!holiday) {
    return next(new ErrorHandler('Holiday not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Holiday deleted successfully',
    data: holiday,
  });
});

// Routes
router.post('/', protectAdmin, createHoliday);
router.get('/', getHolidays);
router.get('/:id', getHolidayById);
router.put('/:id', protectAdmin, updateHoliday);
router.delete('/:id', protectAdmin, deleteHoliday);

export default router;
