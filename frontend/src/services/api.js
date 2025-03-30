import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Debug logging
const debug = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] ${message}`, data || '');
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    debug('Making request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      hasToken: !!token
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    debug('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    debug('Response received:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    debug('Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });

    if (error.response) {
      const errorMessage = error.response.data?.message || 'An error occurred';
      debug('Error response:', {
        status: error.response.status,
        message: errorMessage
      });

      switch (error.response.status) {
        case 404:
          return Promise.reject(new Error('Resource not found'));
        case 500:
          return Promise.reject(new Error('Server error'));
        default:
          return Promise.reject(new Error(errorMessage));
      }
    }

    if (error.request) {
      debug('Network error:', error.request);
      return Promise.reject(new Error('Network error - Please check your connection'));
    }

    return Promise.reject(error);
  }
);

export default api; 