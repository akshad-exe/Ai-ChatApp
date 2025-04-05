import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';

export const chatService = {
  // Get all chats for the current user
  getChats: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.chat.getChats, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  },

  // Get messages for a specific chat
  getMessages: async (chatId) => {
    try {
      const response = await api.get(API_ENDPOINTS.chat.getMessages(chatId));
      return response;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a message in a chat
  sendMessage: async (chatId, message) => {
    try {
      const response = await api.post(API_ENDPOINTS.chat.sendMessage(chatId), message);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Create a new chat (both direct and group)
  createChat: async (data) => {
    try {
      const response = await api.post(API_ENDPOINTS.chat.createChat, data);
      return response;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  },

  // Create a group chat
  createGroupChat: async (name, userIds) => {
    try {
      const response = await api.post(API_ENDPOINTS.chat.createGroupChat, {
        name,
        participants: userIds
      });
      return response;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  },

  // Add participants to a group chat
  addParticipants: async (chatId, userIds) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.chat.getChat(chatId)}/participants`, {
        participants: userIds
      });
      return response;
    } catch (error) {
      console.error('Error adding participants:', error);
      throw error;
    }
  },

  // Remove a participant from a group chat
  removeParticipant: async (chatId, userId) => {
    try {
      const response = await api.delete(`${API_ENDPOINTS.chat.getChat(chatId)}/participants/${userId}`);
      return response;
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  },

  // Leave a group chat
  leaveGroupChat: async (chatId) => {
    try {
      const response = await api.post(`${API_ENDPOINTS.chat.getChat(chatId)}/leave`);
      return response;
    } catch (error) {
      console.error('Error leaving group chat:', error);
      throw error;
    }
  },

  // Delete a chat
  deleteChat: async (chatId) => {
    try {
      const response = await api.delete(API_ENDPOINTS.chat.getChat(chatId));
      return response;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  },

  // Get AI response for a message
  getAIResponse: async (chatId, message) => {
    try {
      const response = await api.post(API_ENDPOINTS.chat.getAIResponse(chatId), { message });
      return response.data;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw error;
    }
  }
};