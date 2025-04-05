import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      // Don't redirect here, let the component handle it
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  register: async (userData) => {
    const response = await api.post(API_ENDPOINTS.auth.register, userData);
    return response.data;
  },

  login: async (credentials) => {
    try {
      const response = await api.post(API_ENDPOINTS.auth.login, credentials);
      if (response.data.token) {
        // Store the token
        localStorage.setItem('token', response.data.token);
        // Set the token in the axios instance
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      throw error;
    }
  },

  logout: async () => {
    try {
      const response = await api.post(API_ENDPOINTS.auth.logout);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      throw error;
    }
  },

  forgotPassword: async (email) => {
    const response = await api.post(API_ENDPOINTS.auth.forgotPassword, { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post(API_ENDPOINTS.auth.resetPassword, {
      token,
      newPassword,
    });
    return response.data;
  },

  verifyToken: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, message: 'No token found' };
      }

      const response = await api.get(API_ENDPOINTS.auth.verifyToken);
      return { success: true, ...response.data };
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      return { success: false, message: error.response?.data?.message || 'Token verification failed' };
    }
  },
};

// Chat Service
export const chatService = {
  // Chat Management
  getChats: async () => {
    const response = await api.get(API_ENDPOINTS.chat.getChats);
    return response.data;
  },

  getChat: async (chatId) => {
    const response = await api.get(API_ENDPOINTS.chat.getChat(chatId));
    return response.data;
  },

  createChat: async (participantId) => {
    const response = await api.post(API_ENDPOINTS.chat.createChat, { participantId });
    return response.data;
  },

  createGroupChat: async (groupData) => {
    const response = await api.post(API_ENDPOINTS.chat.createGroupChat, groupData);
    return response.data;
  },

  // Message Management
  getMessages: async (chatId, params = {}) => {
    const response = await api.get(API_ENDPOINTS.chat.getMessages(chatId), { params });
    return response.data;
  },

  searchMessages: async (chatId, query) => {
    const response = await api.get(API_ENDPOINTS.chat.searchMessages(chatId), {
      params: { query },
    });
    return response.data;
  },

  sendMessage: async (chatId, messageData) => {
    const response = await api.post(API_ENDPOINTS.chat.sendMessage(chatId), messageData);
    return response.data;
  },

  markAsRead: async (chatId) => {
    const response = await api.post(API_ENDPOINTS.chat.markAsRead(chatId));
    return response.data;
  },

  getAIResponse: async (chatId, message) => {
    const response = await api.post(API_ENDPOINTS.chat.getAIResponse(chatId), { message });
    return response.data;
  },

  // Chat Settings
  updateSettings: async (chatId, settings) => {
    const response = await api.patch(API_ENDPOINTS.chat.updateSettings(chatId), settings);
    return response.data;
  },
};

// User Service
export const userService = {
  // Profile Management
  getProfile: async () => {
    const response = await api.get(API_ENDPOINTS.users.getProfile);
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put(API_ENDPOINTS.users.updateProfile, profileData);
    return response.data;
  },

  updatePassword: async (passwordData) => {
    const response = await api.put(API_ENDPOINTS.users.updatePassword, passwordData);
    return response.data;
  },

  // User Search and Details
  searchUsers: async (query) => {
    const response = await api.get(API_ENDPOINTS.users.searchUsers, {
      params: { query },
    });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await api.get(API_ENDPOINTS.users.getUserById(userId));
    return response.data;
  },
};

// File Upload Service
export const fileService = {
  uploadFile: async (file, type = 'file') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api; 