/**
 * Authentication Utilities
 * Manages JWT token, user data, and auth checks
 */

export const authUtils = {
  /**
   * Check if user is authenticated
   */
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },

  /**
   * Get stored JWT token
   */
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  /**
   * Get stored user data
   */
  getUser: () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Save authentication data
   */
  saveAuth: (token, user) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Clear authentication data
   */
  logout: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Check if user is admin
   */
  isAdmin: () => {
    if (typeof window === 'undefined') return false;
    const user = authUtils.getUser();
    return user?.role === 'admin';
  },

  /**
   * Get user's squat number
   */
  getSquatNumber: () => {
    const user = authUtils.getUser();
    return user?.squatNumber || null;
  },

  /**
   * Get user's batch number
   */
  getBatchNumber: () => {
    const user = authUtils.getUser();
    return user?.batchNumber || null;
  },

  /**
   * Check user's role
   */
  hasRole: (role) => {
    const user = authUtils.getUser();
    return user?.role === role;
  },
};

export default authUtils;
