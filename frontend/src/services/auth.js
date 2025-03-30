import api from './api';
import { toast } from 'react-toastify';

// Debug logging
const debug = (message, data = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Auth] ${message}`, data);
  }
};

export const authService = {
  async login(email, password) {
    try {
      debug('Attempting login', { email });
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data;
      
      // Store tokens in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Successfully logged in!');
      
      debug('Login successful', { user: { ...user, password: undefined } });
      return response.data;
    } catch (error) {
      debug('Login failed:', error);
      toast.error(error.response?.data?.message || 'Failed to login. Please try again.');
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  async register(userData) {
    try {
      debug('Attempting registration', { ...userData, password: undefined });
      const response = await api.post('/auth/register', userData);
      const { token, refreshToken, user } = response.data;
      
      // Store tokens in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Account created successfully!');
      
      debug('Registration successful', { user: { ...user, password: undefined } });
      return response.data;
    } catch (error) {
      debug('Registration failed:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  async logout() {
    try {
      debug('Attempting logout');
      await api.post('/auth/logout');
      localStorage.removeItem('token');
      // localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      toast.success('Successfully logged out!');
      debug('Logout successful');
    } catch (error) {
      debug('Logout error:', error);
      toast.error(error.response?.data?.message || 'Failed to logout. Please try again.');
      throw error;
    }
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  async refreshToken() {
    try {
      debug('Attempting token refresh');
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        debug('No refresh token available');
        throw new Error('No refresh token');
      }

      const response = await api.post('/auth/refresh-token', { refreshToken });
      const { token, newRefreshToken } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      debug('Token refresh successful');
      return response.data;
    } catch (error) {
      debug('Token refresh failed:', error);
      this.logout();
      throw new Error('Token refresh failed');
    }
  }
}; 