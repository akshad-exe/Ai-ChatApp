const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  auth: {
    register: `${API_URL}/auth/register`,
    login: `${API_URL}/auth/login`,
    forgotPassword: `${API_URL}/auth/forgot-password`,
    resetPassword: `${API_URL}/auth/reset-password`,
    verifyResetToken: `${API_URL}/auth/verify-reset-token`,
    verifyToken: `${API_URL}/auth/verify-token`,
    logout: `${API_URL}/auth/logout`
  },
  chat: {
    // Chat management
    getChats: `${API_URL}/chat`,
    getChat: (chatId) => `${API_URL}/chat/${chatId}`,
    createChat: `${API_URL}/chat/create`,
    createGroupChat: `${API_URL}/chat/create-group`,
    
    // Message management
    getMessages: (chatId) => `${API_URL}/chat/${chatId}/messages`,
    searchMessages: (chatId) => `${API_URL}/chat/${chatId}/search`,
    sendMessage: (chatId) => `${API_URL}/chat/${chatId}/send`,
    markAsRead: (chatId) => `${API_URL}/chat/${chatId}/messages/read`,
    getAIResponse: (chatId) => `${API_URL}/chat/${chatId}/ai-reply`,
    
    // Chat settings
    updateSettings: (chatId) => `${API_URL}/chat/${chatId}/settings`
  },
  users: {
    // Profile management
    getProfile: `${API_URL}/users/profile`,
    updateProfile: `${API_URL}/users/profile`,
    updatePassword: `${API_URL}/users/password`,
    
    // User search and details
    searchUsers: `${API_URL}/users/search`,
    getUserById: (userId) => `${API_URL}/users/${userId}`
  }
}; 