import axios from 'axios';

// Create axios instance
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired (401), redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// Authentication Endpoints
// ============================================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ============================================
// Booking Endpoints
// ============================================

export const bookingAPI = {
  getSeatStatus: (date) => api.get(`/bookings/seat-status/${date}`),
  getMyBookings: (date = null) => {
    const url = date ? `/bookings/my-bookings?date=${date}` : '/bookings/my-bookings';
    return api.get(url);
  },
  getBookingsForDate: (date) => api.get(`/bookings/date/${date}`),
  bookSpare: (data) => api.post('/bookings/spare', data),
  releaseSeat: (date) => api.post('/bookings/release', { date }),
};

// ============================================
// Holiday Endpoints
// ============================================

export const holidayAPI = {
  getHolidays: () => api.get('/holidays'),
  getHoliday: (id) => api.get(`/holidays/${id}`),
  createHoliday: (data) => api.post('/holidays', data),
  updateHoliday: (id, data) => api.put(`/holidays/${id}`, data),
  deleteHoliday: (id) => api.delete(`/holidays/${id}`),
};

// ============================================
// Admin Endpoints
// ============================================

export const adminAPI = {
  getBatchSchedule: (date) => api.get(`/admin/batch-schedule/${date}`),
  triggerAutobooking: (date = null) => {
    const data = date ? { date } : {};
    return api.post('/admin/trigger-autobooking', data);
  },
  getSystemStatus: () => api.get('/admin/system-status'),
};

export default api;
