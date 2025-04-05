import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
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
    debug('Making request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL
    });
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
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      debug('Authentication error');
      localStorage.removeItem('user');
      
      // Redirect to login page if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export { api };