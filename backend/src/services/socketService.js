const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketService {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // Map to store user ID to socket ID mapping
    this.socketUsers = new Map(); // Map to store socket ID to user ID mapping
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.user._id}`);

      // Store socket mappings
      this.userSockets.set(socket.user._id.toString(), socket.id);
      this.socketUsers.set(socket.id, socket.user._id.toString());

      // Join user's personal room
      socket.join(socket.user._id.toString());

      // Handle joining chat room
      socket.on('joinChat', async (chatId) => {
        try {
          socket.join(chatId);
          console.log(`User ${socket.user._id} joined chat ${chatId}`);
          
          // Notify others in the chat
          socket.to(chatId).emit('userJoined', {
            userId: socket.user._id,
            username: socket.user.username
          });
        } catch (error) {
          console.error('Error joining chat:', error);
        }
      });

      // Handle leaving chat room
      socket.on('leaveChat', (chatId) => {
        socket.leave(chatId);
        console.log(`User ${socket.user._id} left chat ${chatId}`);
        
        // Notify others in the chat
        socket.to(chatId).emit('userLeft', {
          userId: socket.user._id,
          username: socket.user.username
        });
      });

      // Handle typing status
      socket.on('typing', (data) => {
        socket.to(data.chatId).emit('userTyping', {
          userId: socket.user._id,
          username: socket.user.username,
          isTyping: data.isTyping
        });
      });

      // Handle message read status
      socket.on('messageRead', async (data) => {
        try {
          socket.to(data.chatId).emit('messageRead', {
            messageId: data.messageId,
            userId: socket.user._id,
            username: socket.user.username
          });
        } catch (error) {
          console.error('Error handling message read:', error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.user._id}`);
        
        // Remove socket mappings
        this.userSockets.delete(socket.user._id.toString());
        this.socketUsers.delete(socket.id);
      });
    });
  }

  // Method to emit message to a specific chat
  emitMessage(chatId, message) {
    this.io.to(chatId).emit('message', message);
  }

  // Method to emit message to a specific user
  emitToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId.toString());
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  // Method to emit to all users in a chat
  emitToChat(chatId, event, data) {
    this.io.to(chatId).emit(event, data);
  }

  // Method to check if a user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId.toString());
  }

  // Method to get all online users in a chat
  getOnlineUsers(chatId) {
    const chat = this.io.sockets.adapter.rooms.get(chatId);
    if (!chat) return [];

    return Array.from(chat)
      .map(socketId => this.socketUsers.get(socketId))
      .filter(userId => userId !== undefined);
  }
}

module.exports = SocketService; 