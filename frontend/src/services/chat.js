import api from './api';

export const chatService = {
  // Chat operations
  async createChat(participants) {
    try {
      const response = await api.post('/chat', { participants });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create chat');
    }
  },

  async getChats() {
    try {
      const response = await api.get('/chat');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch chats');
    }
  },

  async getChat(chatId) {
    try {
      const response = await api.get(`/chat/${chatId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch chat');
    }
  },

  async getMessages(chatId, page = 1, limit = 50) {
    try {
      const response = await api.get(`/chat/${chatId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch messages');
    }
  },

  async sendMessage(chatId, content, type = 'text', mediaUrl = null) {
    try {
      const response = await api.post(`/chat/${chatId}/messages`, {
        content,
        type,
        mediaUrl
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send message');
    }
  },

  async updateChat(chatId, updates) {
    try {
      const response = await api.put(`/chat/${chatId}`, updates);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update chat');
    }
  },

  async deleteChat(chatId) {
    try {
      await api.delete(`/chat/${chatId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete chat');
    }
  },

  // Message operations
  async markMessagesAsRead(chatId, messageIds) {
    try {
      const response = await api.put(`/chat/${chatId}/messages/read`, {
        messageIds
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark messages as read');
    }
  },

  async deleteMessage(chatId, messageId) {
    try {
      await api.delete(`/chat/${chatId}/messages/${messageId}`);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete message');
    }
  },

  // Media operations
  async uploadMedia(file, type) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await api.post('/chat/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload media');
    }
  }
}; 