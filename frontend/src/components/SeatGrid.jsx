'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { bookingAPI } from '@/services/api';

const SeatGrid = forwardRef(function SeatGrid({ date, onSeatSelect, disabled = false, selectedSeat = null }, ref) {
  const [seats, setSeats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refetchingAfterAction, setRefetchingAfterAction] = useState(false);
  const [availablePool, setAvailablePool] = useState(null); // fixed pool of 10 seats

  // Expose fetchSeats to parent components via ref
  useImperativeHandle(ref, () => ({
    refetch: fetchSeats,
    refetchAfterAction: async () => {
      setRefetchingAfterAction(true);
      try {
        await fetchSeats();
      } finally {
        setRefetchingAfterAction(false);
      }
    },
  }));

  useEffect(() => {
    if (date) {
      fetchSeats();
    }
  }, [date]);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookingAPI.getSeatStatus(date);

      // API returns { success, data: { date, seats: [ ... ] } }
      const payload = response.data.data || {};
      const seatList = Array.isArray(payload)
        ? payload
        : payload.seats || [];

      const seatData = {};
      seatList.forEach((seat) => {
        // Only map spare seats (41-50)
        if (seat.seatNumber >= 41 && seat.seatNumber <= 50) {
          let status = seat.status;
          if (status === 'occupied') {
            status = 'booked';
          }
          seatData[seat.seatNumber] = status;
        }
      });

      // Ensure all spare seats (41-50) are initialized
      for (let i = 41; i <= 50; i++) {
        if (!seatData[i]) {
          seatData[i] = 'available';
        }
      }

      setSeats(seatData);
    } catch (err) {
      setError('Failed to load seat data');
      console.error('Fetch seats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600 cursor-pointer text-white';
      case 'booked':
        return 'bg-red-500 cursor-not-allowed text-white';
      case 'user':
        return 'bg-blue-500 cursor-not-allowed text-white';
      case 'disabled':
        return 'bg-gray-400 cursor-not-allowed text-gray-700';
      default:
        return 'bg-gray-400 cursor-not-allowed text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'booked':
        return 'Booked';
      case 'user':
        return 'Your Seat';
      case 'disabled':
        return 'Disabled';
      default:
        return 'Unavailable';
    }
  };

  const handleSeatClick = (seatNumber) => {
    const status = seats[seatNumber];
    if (status === 'available' && onSeatSelect && !disabled) {
      onSeatSelect(seatNumber);
    }
  };

  // Calculate statistics
  const stats = {
    available: Object.values(seats).filter((s) => s === 'available').length,
    booked: Object.values(seats).filter((s) => s === 'booked').length,
    user: Object.values(seats).filter((s) => s === 'user').length,
    disabled: Object.values(seats).filter((s) => s === 'disabled').length,
  };

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded p-4">
        <p className="font-semibold mb-2">{error}</p>
        <button
          onClick={fetchSeats}
          className="text-sm underline hover:font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded border border-green-200">
          <p className="text-sm text-green-600 font-semibold">Available</p>
          <p className="text-2xl font-bold text-green-700">{stats.available}</p>
        </div>
        <div className="bg-red-50 p-4 rounded border border-red-200">
          <p className="text-sm text-red-600 font-semibold">Booked</p>
          <p className="text-2xl font-bold text-red-700">{stats.booked}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <p className="text-sm text-blue-600 font-semibold">Your Seat</p>
          <p className="text-2xl font-bold text-blue-700">{stats.user}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-sm text-gray-600 font-semibold">Disabled</p>
          <p className="text-2xl font-bold text-gray-700">{stats.disabled}</p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {Array(10)
            .fill(null)
            .map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-300 rounded animate-pulse"
              />
            ))}
        </div>
      ) : (
        <>
          {/* Seat Grid - Show spare seats 41-50 only */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2 mb-4">
            {Array(10)
              .fill(null)
              .map((_, i) => {
                const seatNumber = 41 + i; // Seats 41-50
                const status = seats[seatNumber] || 'disabled';
                const isSelected = seatNumber === selectedSeat;

                return (
                  <button
                    key={seatNumber}
                    onClick={() => handleSeatClick(seatNumber)}
                    disabled={status !== 'available' || disabled}
                    title={`Seat ${seatNumber}: ${getStatusLabel(status)}`}
                    className={`
                      aspect-square rounded font-bold text-xs md:text-sm
                      transition-all duration-200
                      flex items-center justify-center
                      ${getStatusColor(status)}
                      ${isSelected ? 'ring-2 ring-yellow-400 scale-110' : ''}
                      ${disabled ? 'opacity-50' : ''}
                    `}
                  >
                    {seatNumber}
                  </button>
                );
              })}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchSeats}
            disabled={loading || disabled || refetchingAfterAction}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {refetchingAfterAction ? '🔄 Updating...' : '🔄 Refresh'}
          </button>
        </>
      )}
    </div>
  );
});

export default SeatGrid;
