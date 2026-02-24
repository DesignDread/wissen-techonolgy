'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/utils/withProtectedRoute';
import CalendarPicker from '@/components/CalendarPicker';
import SeatGrid from '@/components/SeatGrid';
import { bookingAPI, adminAPI } from '@/services/api';

export default function BookSparePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const seatGridRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [batchInfo, setBatchInfo] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }

    // Update time every minute to check 12 PM restriction
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [isAuthenticated, router]);

  // fetch batch schedule whenever the date changes
  useEffect(() => {
    const loadBatch = async () => {
      try {
        const res = await adminAPI.getBatchSchedule(selectedDate);
        // API returns array of days; take first element if any
        setBatchInfo(res.data.data && res.data.data.length ? res.data.data[0] : null);
      } catch (err) {
        console.error('Batch fetch error', err);
        setBatchInfo(null);
      }
    };
    if (selectedDate) loadBatch();
  }, [selectedDate]);

  // Fetch user's bookings to show warning if they have a scheduled booking
  const [userBookings, setUserBookings] = useState([]);
  useEffect(() => {
    const loadUserBookings = async () => {
      try {
        const res = await bookingAPI.getMyBookings();
        setUserBookings(res.data.data || []);
      } catch (err) {
        console.error('Bookings fetch error', err);
      }
    };
    if (isAuthenticated) loadUserBookings();
  }, [isAuthenticated]);
//time
  // booking allowed after noon (12 PM)
  const isAfterNoon = currentTime.getHours() >= 12;
  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isScheduledUser =
    batchInfo && user && batchInfo.scheduledBatch === user.batchNumber;
  
  // Block all booking if user's batch is scheduled for this date
  const canBook = (!isToday || isAfterNoon) && !isScheduledUser;

  const handleSeatSelect = (seatNumber) => {
    if (!canBook) {
      if (isScheduledUser) {
        setError(`❌ Cannot book on this date - Batch ${user?.batchNumber} is scheduled. You are auto-booked.`);
      } else {
        setError('Spare seats can only be booked after 12 PM');
      }
      return;
    }
    setSelectedSeat(seatNumber);
    setShowConfirm(true);
  };

  const handleConfirmBooking = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await bookingAPI.bookSpare({
        date: selectedDate,
        seatNumber: selectedSeat,
      });

      setSuccess(`✓ Seat ${selectedSeat} booked successfully for ${selectedDate}!`);
      setSelectedSeat(null);
      setShowConfirm(false);

      // Refetch seat data after successful booking
      if (seatGridRef.current?.refetchAfterAction) {
        await seatGridRef.current.refetchAfterAction();
      }

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book seat');
      console.error('Book seat error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-6 mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">🎯 Book Spare Seat</h1>
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Active Scheduled Booking Warning */}
        {userBookings.some((b) => b.bookingType === 'scheduled' && b.status === 'active') && (
          <div className="bg-blue-100 border-2 border-blue-500 text-blue-800 px-6 py-4 rounded-lg mb-6">
            <p className="font-bold text-lg">📅 You have an active scheduled booking</p>
            <p className="text-sm mt-2">
              You are automatically booked on your batch day. If you want to release this seat before your scheduled day, go to
              <Link
                href="/my-bookings"
                className="font-bold underline hover:text-blue-900 ml-1"
              >
                My Bookings →
              </Link>
            </p>
          </div>
        )}

        {isScheduledUser && (
          <div className="bg-red-100 border-2 border-red-500 text-red-800 px-6 py-4 rounded-lg mb-6">
            <p className="font-bold text-lg">🚫 BOOKING BLOCKED - Your Batch is Scheduled</p>
            <p className="text-sm mt-2">
              Batch {user?.batchNumber} is scheduled for {new Date(selectedDate).toLocaleDateString()}. 
              You are automatically booked. You cannot book additional spare seats on your scheduled day.
            </p>
            <p className="text-sm mt-2">To release your auto-booked seat, go to <Link href="/my-bookings" className="font-bold underline">My Bookings →</Link></p>
          </div>
        )}
        {isToday && !isAfterNoon && !isScheduledUser && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-6 py-4 rounded-lg mb-6">
            <p className="font-semibold text-lg">⏰ Available after 12:00 PM</p>
            <p className="text-sm mt-1">
              Spare seats can only be booked after 12 PM. Current time: {currentTime.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Batch info banner */}
        {batchInfo && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg mb-6">
            {batchInfo.scheduledBatch === undefined ? (
              <p>No batch scheduled for {selectedDate}.</p>
            ) : (
              <p>
                Scheduled Batch {batchInfo.scheduledBatch}. You still may book
                from the 10 spare seats (shown below).
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <CalendarPicker
                value={selectedDate}
                onChange={setSelectedDate}
                disabled={loading}
              />

              {/* Info Cards */}
              <div className="mt-6 space-y-4">
                <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                  <p className="text-xs text-blue-600 font-semibold uppercase">Selected Date</p>
                  <p className="text-lg font-bold text-blue-900">
                    {new Date(selectedDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className={`p-4 rounded border-l-4 ${
                  canBook ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                }`}>
                  <p className={`text-xs font-semibold uppercase ${
                    canBook ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {canBook ? '✓ Booking Available' : '✗ Not Available'}
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${
                    canBook ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {canBook
                      ? 'Ready to book'
                      : isToday
                      ? 'After 12 PM only'
                      : 'Any time'}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded border-l-4 border-purple-500">
                  <p className="text-xs text-purple-600 font-semibold uppercase">Info</p>
                  <p className="text-sm text-purple-900 mt-1">
                    {isToday
                      ? 'Spare seats available after 12 PM today'
                      : 'Select a seat to book'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Seat Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6">💺 Available Seats</h2>
              {canBook ? (
                <SeatGrid
                  ref={seatGridRef}
                  date={selectedDate}
                  onSeatSelect={handleSeatSelect}
                  disabled={loading}
                  selectedSeat={selectedSeat}
                />
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🕐</div>
                    <p className="text-gray-600 text-lg">
                      Spare seats available after 12:00 PM
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Current time: {currentTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="font-bold mb-4">📋 Seat Status Legend</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded"></div>
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded"></div>
                  <span className="text-sm">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded"></div>
                  <span className="text-sm">Your Seat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-400 rounded"></div>
                  <span className="text-sm">Disabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">🔒 Confirm Booking</h2>
            <p className="text-gray-600 mb-6">
              Book spare seat <strong>#{selectedSeat}</strong> for{' '}
              <strong>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </strong>
              ?
            </p>

            <div className="bg-blue-50 p-4 rounded mb-6 border-l-4 border-blue-500">
              <p className="text-sm text-blue-900">
                ℹ️ This seat is available until your release it or scheduler change occurs.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition disabled:opacity-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={loading}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? 'Booking...' : '✓ Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
