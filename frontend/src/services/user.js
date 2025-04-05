import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';

export const userService = {
  // Search for users by name or email
  searchUsers: async (query) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.users.searchUsers}?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to search users');
      }

      const data = await response.json();
      return { data: data.users || [] };
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },

  // Get user profile by ID
  getUserById: async (userId) => {
    try {
      const response = await api.get(API_ENDPOINTS.users.getUserById(userId));
      return response;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (data) => {
    try {
      const response = await api.put(API_ENDPOINTS.users.updateProfile, data);
      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Update user password
  updatePassword: async (data) => {
    try {
      const response = await api.put(API_ENDPOINTS.users.updatePassword, data);
      return response;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}; 