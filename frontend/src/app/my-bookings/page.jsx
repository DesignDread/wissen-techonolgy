'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/utils/withProtectedRoute';
import { bookingAPI } from '@/services/api';

export default function MyBookingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [releasing, setReleasing] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, released

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      fetchBookings();
    }
  }, [isAuthenticated, router]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookingAPI.getMyBookings();
      setBookings(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseSeat = async (date) => {
    if (!window.confirm(`Release seat for ${date}?`)) {
      return;
    }

    try {
      setReleasing(date);
      setError('');
      await bookingAPI.releaseSeat(date);
      // Refresh bookings
      await fetchBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to release seat');
      console.error('Release seat error:', err);
    } finally {
      setReleasing(null);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'active') return booking.status === 'active';
    if (filter === 'released') return booking.status === 'released';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'released':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'scheduled' ? '📅' : '🎯';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-6 mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">My Bookings</h1>
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Refresh Button and Info */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📋 Your Bookings</h2>
            <p className="text-gray-600 text-sm mt-1">View and release your booked seats</p>
          </div>
          <button
            onClick={fetchBookings}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            {['all', 'active', 'released'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded capitalize transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {f}
                {f === 'all' && ` (${bookings.length})`}
                {f === 'active' && ` (${bookings.filter((b) => b.status === 'active').length})`}
                {f === 'released' && ` (${bookings.filter((b) => b.status === 'released').length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading bookings...</p>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Bookings</h2>
            <p className="text-gray-600 mb-6">You don't have any {filter} bookings yet.</p>
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded mb-6 text-left">
              <p className="font-semibold mb-2">💡 How booking works:</p>
              <ul className="text-sm space-y-1 ml-4">
                <li>• <strong>Scheduled (📅):</strong> Auto-booked on your batch day (seats 1-40). You can release anytime.</li>
                <li>• <strong>Spare (🎯):</strong> Book manually after 12 PM from available spare seats (41-50).</li>
              </ul>
            </div>
            <Link
              href="/book-spare"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition inline-block"
            >
              Book a Seat
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Scheduled Bookings Section */}
            {filteredBookings.some((b) => b.bookingType === 'scheduled') && (
              <div>
                <h3 className="text-xl font-bold text-blue-700 mb-4">📅 Scheduled Bookings (Auto-Booked on Your Batch Day)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredBookings
                    .filter((b) => b.bookingType === 'scheduled')
                    .map((booking) => (
                      <div
                        key={booking._id}
                        className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                          booking.status === 'active' ? 'border-blue-500' : 'border-gray-500'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold">
                              📅 Seat {booking.seatNumber}
                            </h3>
                            <p className="text-gray-600">{new Date(booking.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${booking.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {booking.status}
                          </span>
                        </div>

                        {booking.status === 'active' && (
                          <button
                            onClick={() => handleReleaseSeat(booking.date)}
                            disabled={releasing === booking.date}
                            className="w-full bg-red-500 text-white py-3 rounded hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                          >
                            {releasing === booking.date ? '🔄 Releasing...' : '🔓 RELEASE SEAT'}
                          </button>
                        )}

                        {booking.status === 'released' && (
                          <div className="bg-gray-100 text-gray-600 py-3 rounded text-center text-sm font-semibold">
                            Released on {new Date(booking.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Spare Bookings Section */}
            {filteredBookings.some((b) => b.bookingType === 'spare') && (
              <div>
                <h3 className="text-xl font-bold text-green-700 mb-4">🎯 Spare Bookings (Manually Booked)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredBookings
                    .filter((b) => b.bookingType === 'spare')
                    .map((booking) => (
                      <div
                        key={booking._id}
                        className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                          booking.status === 'active' ? 'border-green-500' : 'border-gray-500'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold">
                              🎯 Seat {booking.seatNumber}
                            </h3>
                            <p className="text-gray-600">{new Date(booking.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${booking.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {booking.status}
                          </span>
                        </div>

                        {booking.status === 'active' && (
                          <button
                            onClick={() => handleReleaseSeat(booking.date)}
                            disabled={releasing === booking.date}
                            className="w-full bg-red-500 text-white py-3 rounded hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                          >
                            {releasing === booking.date ? '🔄 Releasing...' : '🔓 RELEASE SEAT'}
                          </button>
                        )}

                        {booking.status === 'released' && (
                          <div className="bg-gray-100 text-gray-600 py-3 rounded text-center text-sm font-semibold">
                            Released on {new Date(booking.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
