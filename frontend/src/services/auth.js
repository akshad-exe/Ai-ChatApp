import { API_ENDPOINTS } from '@/config/api';
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
      debug('Starting login process', { email });
      
      if (!email || !password) {
        debug('Missing credentials', { hasEmail: !!email, hasPassword: !!password });
        throw new Error('Email and password are required');
      }

      debug('Sending login request to server');
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password
        })
      });

      debug('Received response from server', { 
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();
      debug('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.user) {
        debug('Invalid response format - missing user', data);
        throw new Error('Invalid response format from server');
      }

      // Store user data only
      debug('Storing user data');
      localStorage.setItem('user', JSON.stringify(data.user));
      
      debug('Login successful', { user: { ...data.user, password: undefined } });
      return { success: true, user: data.user };
    } catch (error) {
      debug('Login failed with error:', error);
      toast.error(error.message || 'Failed to login. Please try again.');
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  },

  async register(userData) {
    try {
      debug('Attempting registration', { ...userData, password: undefined });
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      const { user } = data;
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Account created successfully!');
      
      debug('Registration successful', { user: { ...user, password: undefined } });
      return data;
    } catch (error) {
      debug('Registration failed:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
      throw error;
    }
  },

  async logout() {
    try {
      debug('Attempting logout');
      await fetch(API_ENDPOINTS.auth.logout, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      localStorage.removeItem('user');
      toast.success('Successfully logged out!');
      debug('Logout successful');
    } catch (error) {
      debug('Logout error:', error);
      toast.error(error.message || 'Failed to logout. Please try again.');
      throw error;
    }
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('user');
  },

  async verifyToken() {
    try {
      debug('Verifying token');
      
      const response = await fetch(API_ENDPOINTS.auth.verifyToken, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      debug('Token verification response', { 
        status: response.status,
        ok: response.ok
      });

      if (!response.ok) {
        debug('Token verification failed', { status: response.status });
        localStorage.removeItem('user');
        return { success: false, message: 'Token verification failed' };
      }

      const data = await response.json();
      debug('Token verification successful', { user: { ...data.user, password: undefined } });
      
      // Update user data in localStorage
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      debug('Token verification error:', error);
      localStorage.removeItem('user');
      return { success: false, message: 'Token verification error' };
    }
  },

  async refreshToken() {
    try {
      debug('Attempting token refresh');
      
      const response = await fetch(API_ENDPOINTS.auth.refreshToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      debug('Token refresh successful');
      return data;
    } catch (error) {
      debug('Token refresh failed:', error);
      this.logout();
      throw new Error('Token refresh failed');
    }
  }
}; 