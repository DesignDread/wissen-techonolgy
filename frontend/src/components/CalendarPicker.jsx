'use client';

import { useState, useEffect } from 'react';
import { holidayAPI } from '@/services/api';

export default function CalendarPicker({ value, onChange, disabled = false }) {
  const [selectedDate, setSelectedDate] = useState(value || getTodayString());
  const [minDate, setMinDate] = useState(getTodayString());
  const [maxDate, setMaxDate] = useState(get30DaysLater());
  const [holidays, setHolidays] = useState([]);
  const [disabledDates, setDisabledDates] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  function get30DaysLater() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  // Fetch holidays on mount
  useEffect(() => {
    fetchHolidays();
  }, []);

  // Update when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedDate(value);
    }
  }, [value]);

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await holidayAPI.getHolidays();
      const holidayDates = response.data.data || [];
      setHolidays(holidayDates);
      
      // Build disabled dates set (holidays + weekends)
      const disabled = new Set();
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // Iterate through next 30 days
      for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayOfWeek = d.getDay();

        // Disable weekends (Saturday=6, Sunday=0)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          disabled.add(dateStr);
        }

        // Disable holidays
        if (holidayDates.some((h) => h.date === dateStr)) {
          disabled.add(dateStr);
        }
      }

      setDisabledDates(disabled);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to load holidays';
      setError(errorMsg);
      console.error('Failed to fetch holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  const isDateDisabled = (dateStr) => {
    return disabledDates.has(dateStr);
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    if (!isDateDisabled(newDate)) {
      setSelectedDate(newDate);
      onChange?.(newDate);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getDateInfo = (dateStr) => {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidays.some((h) => h.date === dateStr);
    const isDisabled = isWeekend || isHoliday;

    return { dayNames: dayNames[dayOfWeek], isWeekend, isHoliday, isDisabled };
  };

  const info = getDateInfo(selectedDate);

  const selectDate = (dateStr) => {
    if (!isDateDisabled(dateStr)) {
      setSelectedDate(dateStr);
      onChange?.(dateStr);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">📅 Select Date</h3>

      <div className="space-y-4">
        {loading && <p className="text-sm text-gray-500">Loading holidays...</p>}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="text-sm font-semibold">{error}</p>
            <button 
              onClick={fetchHolidays}
              className="mt-2 text-sm underline hover:font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose a date (Next 30 days, weekdays only)
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={minDate}
            max={maxDate}
            disabled={disabled || loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Date Info */}
        <div className={`rounded p-4 border-l-4 ${
          info.isDisabled ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'
        }`}>
          <p className="text-sm text-gray-600">Selected Date:</p>
          <p className="text-lg font-bold">{info.dayNames}</p>
          <p className="text-sm font-semibold mt-1">{formatDate(selectedDate)}</p>
          {info.isWeekend && (
            <p className="text-xs text-red-600 mt-1">⚠️ Weekend - Not available</p>
          )}
          {info.isHoliday && (
            <p className="text-xs text-red-600 mt-1">
              🔴 Holiday -{' '}
              {holidays.find((h) => h.date === selectedDate)?.reason}
            </p>
          )}
        </div>

        {/* Quick select buttons */}
        <div className="pt-2 border-t">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick Select:</p>
          <div className="grid grid-cols-2 gap-2">
            <QuickSelectButton
              label="Today"
              onClick={() => {
                const today = getTodayString();
                if (!isDateDisabled(today)) selectDate(today);
              }}
              disabled={
                disabled ||
                loading ||
                isDateDisabled(getTodayString())
              }
            />
            <QuickSelectButton
              label="Tomorrow"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                if (!isDateDisabled(tomorrowStr)) selectDate(tomorrowStr);
              }}
              disabled={disabled || loading}
            />
            <QuickSelectButton
              label="Next Week"
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                const nextWeekStr = nextWeek.toISOString().split('T')[0];
                if (!isDateDisabled(nextWeekStr)) selectDate(nextWeekStr);
              }}
              disabled={disabled || loading}
            />
            <QuickSelectButton
              label="Next Month"
              onClick={() => {
                const nextMonth = new Date();
                nextMonth.setDate(nextMonth.getDate() + 30);
                const nextMonthStr = nextMonth.toISOString().split('T')[0];
                if (!isDateDisabled(nextMonthStr)) selectDate(nextMonthStr);
              }}
              disabled={disabled || loading}
            />
          </div>
        </div>

        {/* Info */}
        {holidays.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
            <p className="font-semibold mb-1">🗓️ Upcoming Holidays:</p>
            <ul className="text-xs space-y-1">
              {holidays.slice(0, 3).map((h, i) => (
                <li key={i}>
                  {new Date(h.date).toLocaleDateString()} - {h.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickSelectButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 text-sm font-medium"
    >
      {label}
    </button>
  );
}
