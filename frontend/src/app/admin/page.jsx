'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { withAdminRoute } from '@/utils/withProtectedRoute';
import { holidayAPI, adminAPI, bookingAPI } from '@/services/api';

function AdminPage() {
  const router = useRouter();
  const [holidays, setHolidays] = useState([]);
  const [batchSchedule, setBatchSchedule] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('holidays'); // holidays, schedule, status

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    reason: '',
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      if (tab === 'holidays') {
        const response = await holidayAPI.getHolidays();
        setHolidays(response.data.data || []);
      } else if (tab === 'schedule') {
        const response = await adminAPI.getBatchSchedule();
        setBatchSchedule(response.data.data || []);
      } else if (tab === 'status') {
        const response = await adminAPI.getSystemStatus();
        setSystemStatus(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.reason) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (editingId) {
        await holidayAPI.updateHoliday(editingId, formData);
        setSuccess('Holiday updated successfully');
      } else {
        await holidayAPI.createHoliday(formData);
        setSuccess('Holiday created successfully');
      }

      setFormData({ date: '', reason: '' });
      setEditingId(null);
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save holiday');
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (holiday) => {
    setFormData({
      date: holiday.date,
      reason: holiday.reason,
    });
    setEditingId(holiday._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;

    try {
      setError('');
      setSuccess('');
      await holidayAPI.deleteHoliday(id);
      setSuccess('Holiday deleted successfully');
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete holiday');
      console.error('Delete error:', err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({ date: '', reason: '' });
    setEditingId(null);
  };

  const handleTabChange = async (newTab) => {
    setTab(newTab);
    setFormData({ date: '', reason: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (newTab === 'holidays') {
        const response = await holidayAPI.getHolidays();
        setHolidays(response.data.data || []);
      } else if (newTab === 'schedule') {
        const response = await adminAPI.getBatchSchedule();
        setBatchSchedule(response.data.data || []);
      } else if (newTab === 'status') {
        const response = await adminAPI.getSystemStatus();
        setSystemStatus(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md p-6 mb-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">👨‍💼 Admin Dashboard</h1>
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

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            {[
              { key: 'holidays', label: '📅 Holidays', icon: '📅' },
              { key: 'schedule', label: '📊 Batch Schedule', icon: '📊' },
              { key: 'status', label: '⚙️ System Status', icon: '⚙️' },
            ].map((tabItem) => (
              <button
                key={tabItem.key}
                onClick={() => handleTabChange(tabItem.key)}
                className={`flex-1 px-6 py-4 transition font-semibold text-center ${
                  tab === tabItem.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Holidays Tab */}
            {tab === 'holidays' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">📅 Manage Holidays</h2>
                  <button
                    onClick={() => {
                      if (!showForm) {
                        setShowForm(true);
                        setFormData({ date: '', reason: '' });
                        setEditingId(null);
                      }
                    }}
                    disabled={showForm}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    + Add Holiday
                  </button>
                </div>

                {showForm && (
                  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-xl font-bold mb-4">
                      {editingId ? 'Edit Holiday' : 'Create New Holiday'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleFormChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Reason
                        </label>
                        <input
                          type="text"
                          name="reason"
                          value={formData.reason}
                          onChange={handleFormChange}
                          placeholder="e.g., National Holiday, Maintenance"
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                          required
                        />
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                          {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {holidays.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-gray-600">No holidays configured</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {holidays.map((holiday) => (
                      <div
                        key={holiday._id}
                        className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold">{holiday.reason}</h3>
                            <p className="text-gray-600">
                              {new Date(holiday.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(holiday)}
                            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition font-semibold text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(holiday._id)}
                            className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition font-semibold text-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Schedule Tab */}
            {tab === 'schedule' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">📊 Batch Schedule</h2>

                {batchSchedule.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md p-12 text-center">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="text-gray-600">No batch schedule data</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {batchSchedule.map((schedule, idx) => (
                      <div
                        key={idx}
                        className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                          schedule.scheduledBatch === 1
                            ? 'border-blue-500'
                            : schedule.scheduledBatch === 2
                            ? 'border-green-500'
                            : 'border-gray-500'
                        }`}
                      >
                        <div className="mb-4">
                          <h3 className="text-xl font-bold">
                            {new Date(schedule.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {new Date(schedule.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-600 font-semibold">Scheduled Batch</p>
                            <p className="text-lg font-bold text-gray-800">
                              {schedule.scheduledBatch || 'None'}
                            </p>
                          </div>

                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-600 font-semibold">Day of Week</p>
                            <p className="font-semibold text-gray-800">{schedule.dayOfWeek}</p>
                          </div>

                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-xs text-gray-600 font-semibold">Week of Month</p>
                            <p className="font-semibold text-gray-800">{schedule.weekOfMonth}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Status Tab */}
            {tab === 'status' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">⚙️ System Status</h2>

                {systemStatus ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600 font-semibold uppercase mb-2">
                        💾 Database
                      </p>
                      <p className={`text-2xl font-bold ${
                        systemStatus.database?.status === 'connected'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {systemStatus.database?.status === 'connected' ? '✓ Connected' : '✗ Disconnected'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                      <p className="text-sm text-gray-600 font-semibold uppercase mb-2">
                        ⏰ CRON Job
                      </p>
                      <p className={`text-2xl font-bold ${
                        systemStatus.cronJob?.status === 'running'
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}>
                        {systemStatus.cronJob?.status === 'running' ? '▶ Running' : '⏸ Not Running'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                      <p className="text-sm text-gray-600 font-semibold uppercase mb-2">
                        👥 Total Users
                      </p>
                      <p className="text-3xl font-bold text-purple-600">
                        {systemStatus.totalUsers || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
                      <p className="text-sm text-gray-600 font-semibold uppercase mb-2">
                        🪑 Total Bookings
                      </p>
                      <p className="text-3xl font-bold text-orange-600">
                        {systemStatus.totalBookings || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-pink-500 md:col-span-2">
                      <p className="text-sm text-gray-600 font-semibold uppercase mb-2">
                        📝 Last CRON Run
                      </p>
                      <p className="text-lg font-semibold text-pink-600">
                        {systemStatus.cronJob?.lastRun
                          ? new Date(systemStatus.cronJob.lastRun).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default withAdminRoute(AdminPage);
