const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  auth: {
    register: `${API_URL}/api/auth/register`,
    login: `${API_URL}/api/auth/login`,
    forgotPassword: `${API_URL}/api/auth/forgot-password`,
    resetPassword: `${API_URL}/api/auth/reset-password`,
    verifyResetToken: `${API_URL}/api/auth/verify-reset-token`,
    verifyToken: `${API_URL}/api/auth/verify-token`,
    logout: `${API_URL}/api/auth/logout`
  },
  chat: {
    conversations: `${API_URL}/api/chat/conversations`,
    messages: `${API_URL}/api/chat/messages`
  },
  users: {
    profile: `${API_URL}/api/users/profile`,
    updateProfile: `${API_URL}/api/users/profile/update`
  }
}; 