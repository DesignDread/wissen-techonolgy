'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/utils/withProtectedRoute';
import { bookingAPI, adminAPI } from '@/services/api';
import SeatGrid from '@/components/SeatGrid';
import CalendarPicker from '@/components/CalendarPicker';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [batchInfo, setBatchInfo] = useState(null);
  const [myBooking, setMyBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [releasing, setReleasing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [selectedDate, isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get batch schedule
      const batchRes = await adminAPI.getBatchSchedule(selectedDate);
      setBatchInfo(batchRes.data.data);

      // Get user's booking for this date
      const bookingRes = await bookingAPI.getBookingsForDate(selectedDate);
      const userBooking = bookingRes.data.data.bookings.find((b) => b.userId === user._id);
      setMyBooking(userBooking || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseSeat = async () => {
    if (!myBooking || !window.confirm('Release your seat?')) {
      return;
    }

    try {
      setReleasing(true);
      setError('');
      await bookingAPI.releaseSeat(myBooking.date);
      // Refresh dashboard data
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release seat');
      console.error('Release seat error:', err);
    } finally {
      setReleasing(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h1>
          <p className="text-gray-600 mt-2">
            Squat #{user?.squatNumber} • Batch {user?.batchNumber}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/my-bookings"
            className="bg-blue-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-2xl mb-2">📅</div>
            <h3 className="font-bold">My Bookings</h3>
            <p className="text-sm text-blue-100">View all your bookings</p>
          </Link>

          <Link
            href="/book-spare"
            className="bg-green-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition"
          >
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-bold">Book Spare Seat</h3>
            <p className="text-sm text-green-100">Available after 12 PM</p>
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              className="bg-purple-600 text-white p-6 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="text-2xl mb-2">👨‍💼</div>
              <h3 className="font-bold">Admin Panel</h3>
              <p className="text-sm text-purple-100">Manage holidays</p>
            </Link>
          )}
        </div>

        {/* Batch Schedule Info */}
        {batchInfo && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold mb-4">Schedule Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Date</p>
                <p className="font-bold">{batchInfo.date}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Day of Week</p>
                <p className="font-bold">{batchInfo.dayOfWeek}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Week of Month</p>
                <p className="font-bold">Week {batchInfo.weekOfMonth}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Scheduled Batch</p>
                <p className="font-bold">
                  {batchInfo.scheduledBatch ? `Batch ${batchInfo.scheduledBatch}` : '—'}
                </p>
              </div>
            </div>

            {batchInfo.scheduledBatch === user?.batchNumber && (
              <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                ✓ Your batch is scheduled for today! You should have a seat reserved.
              </div>
            )}

            {batchInfo.scheduledBatch && batchInfo.scheduledBatch !== user?.batchNumber && (
              <div className="mt-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                ℹ️ Batch {batchInfo.scheduledBatch} is scheduled. After 12 PM, spare seats will be available.
              </div>
            )}

            {!batchInfo.scheduledBatch && (
              <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
                ⚠️ No batch scheduled for this date. After 12 PM, you can book a spare seat.
              </div>
            )}
          </div>
        )}

        {/* My Booking Today */}
        {myBooking && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-green-500">
            <h2 className="text-2xl font-bold mb-4">Your Booking</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">Seat Number</p>
                <p className="font-bold text-2xl text-green-600">{myBooking.seatNumber}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-bold capitalize">{myBooking.bookingType}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-bold capitalize">{myBooking.status}</p>
              </div>
            </div>
            <button
              onClick={handleReleaseSeat}
              disabled={releasing}
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {releasing ? '🔓 Releasing...' : '🔓 Release Seat'}
            </button>
          </div>
        )}

        {/* Seat Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <CalendarPicker value={selectedDate} onChange={setSelectedDate} disabled={loading} />
          </div>
          <div className="lg:col-span-3">
            <SeatGrid date={selectedDate} key={selectedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}
