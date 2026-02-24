/**
 * Batch Schedule Logic
 *
 * Rotation Pattern:
 * Batch 1: Week1 (Mon-Wed), Week2 (Thu-Fri)
 * Batch 2: Week1 (Thu-Fri), Week2 (Mon-Wed)
 */

/**
 * Get the current week number in the month
 * @param {Date} date
 * @returns {number} 1 or 2
 */
export const getWeekNumberInMonth = (date) => {
  const day = date.getDate();
  // Week 1: 1-14, Week 2: 15-31
  return day <= 14 ? 1 : 2;
};

/**
 * Get day of week (0 = Sunday, 1 = Monday, ..., 5 = Friday)
 * @param {Date} date
 * @returns {number}
 */
export const getDayOfWeek = (date) => {
  return date.getDay();
};

/**
 * Check if a date is a weekday (Mon-Fri)
 * @param {Date} date
 * @returns {boolean}
 */
export const isWeekday = (date) => {
  const day = getDayOfWeek(date);
  return day >= 1 && day <= 5; // Monday to Friday
};

/**
 * Check if date falls in a specific day range
 * Days: 1 = Monday, 5 = Friday
 * @param {Date} date
 * @param {number} startDay - 1-5
 * @param {number} endDay - 1-5
 * @returns {boolean}
 */
export const isInDayRange = (date, startDay, endDay) => {
  const day = getDayOfWeek(date);
  if (startDay <= endDay) {
    return day >= startDay && day <= endDay;
  }
  // Wrap around (e.g., Thu-Mon)
  return day >= startDay || day <= endDay;
};

/**
 * Determine if a date is a scheduled day for the user
 * @param {Object} user - User document with batchNumber
 * @param {Date} date - Date to check
 * @returns {boolean}
 */
export const isScheduledDay = (user, date) => {
  // Don't schedule on weekends
  if (!isWeekday(date)) {
    return false;
  }

  const batchNumber = user.batchNumber;
  const week = getWeekNumberInMonth(date);

  if (batchNumber === 1) {
    // Batch 1: Week 1 (Mon-Wed), Week 2 (Thu-Fri)
    return week === 1 ? isInDayRange(date, 1, 3) : isInDayRange(date, 4, 5);
  } else if (batchNumber === 2) {
    // Batch 2: Week 1 (Thu-Fri), Week 2 (Mon-Wed)
    return week === 1 ? isInDayRange(date, 4, 5) : isInDayRange(date, 1, 3);
  }

  return false;
};

/**
 * Get next scheduled date for a user from today
 * @param {Object} user - User document
 * @param {Date} startDate - Start searching from this date (default: today)
 * @returns {Date|null}
 */
export const getNextScheduledDate = (user, startDate = new Date()) => {
  const maxDaysToCheck = 30;

  for (let i = 0; i < maxDaysToCheck; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + i);
    checkDate.setHours(0, 0, 0, 0);

    if (isScheduledDay(user, checkDate)) {
      return checkDate;
    }
  }

  return null;
};

/**
 * Get all users with batch assigned for a specific date
 * @param {Date} date
 * @returns {number} batchNumber (1 or 2) or null if no scheduled batch
 */
export const getScheduledBatchForDate = (date) => {
  const week = getWeekNumberInMonth(date);

  if (!isWeekday(date)) {
    return null;
  }

  const isMonWed = isInDayRange(date, 1, 3);
  const isThuFri = isInDayRange(date, 4, 5);

  if (week === 1) {
    // Batch 1 in Mon-Wed, Batch 2 in Thu-Fri
    return isMonWed ? 1 : isThuFri ? 2 : null;
  } else if (week === 2) {
    // Batch 1 in Thu-Fri, Batch 2 in Mon-Wed
    return isThuFri ? 1 : isMonWed ? 2 : null;
  }

  return null;
};
