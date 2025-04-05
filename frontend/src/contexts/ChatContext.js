'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '@/hooks/use-toast';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  // Fetch chats on component mount
  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to load chats');
      toast({
        title: 'Error',
        description: 'Failed to load chats. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (userId) => {
    try {
      const response = await api.post('/chats', { userId });
      
      if (response.data) {
        setChats(prevChats => [...prevChats, response.data]);
        return { success: true, chat: response.data };
      } else {
        return { success: false, error: 'Failed to create chat' };
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create chat' 
      };
    }
  };

  const createGroupChat = async ({ name, participants }) => {
    try {
      const response = await api.post('/chats/group', { name, participants });
      
      if (response.data) {
        setChats(prevChats => [...prevChats, response.data]);
        return { success: true, chat: response.data };
      } else {
        return { success: false, error: 'Failed to create group chat' };
      }
    } catch (error) {
      console.error('Error creating group chat:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to create group chat' 
      };
    }
  };

  const sendMessage = async (chatId, content) => {
    try {
      const response = await api.post(`/chats/${chatId}/messages`, { content });
      
      if (response.data) {
        // Update the chat with the new message
        setChats(prevChats => 
          prevChats.map(chat => 
            chat.id === chatId 
              ? { ...chat, lastMessage: response.data } 
              : chat
          )
        );
        return { success: true, message: response.data };
      } else {
        return { success: false, error: 'Failed to send message' };
      }
    } catch (error) {
      console.error('Error sending message:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to send message' 
      };
    }
  };

  const value = {
    chats,
    loading,
    error,
    createChat,
    createGroupChat,
    sendMessage,
    fetchChats
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 