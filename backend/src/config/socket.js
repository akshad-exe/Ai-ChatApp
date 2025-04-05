const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.username);

    // Update user's online status
    User.findByIdAndUpdate(socket.user._id, {
      isOnline: true,
      lastSeen: new Date()
    }).exec();

    // Join user's personal room
    socket.join(socket.user._id.toString());

    // Join all user's chat rooms
    Chat.find({ participants: socket.user._id })
      .then(chats => {
        chats.forEach(chat => {
          socket.join(chat._id.toString());
        });
      });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, type = 'text', mediaUrl } = data;
        
        // Verify user is part of the chat
        const chat = await Chat.findOne({
          _id: chatId,
          participants: socket.user._id
        });

        if (!chat) {
          socket.emit('error', { message: 'Not authorized to send messages in this chat' });
          return;
        }

        // Create new message
        const message = new Message({
          chat: chatId,
          sender: socket.user._id,
          content,
          type,
          mediaUrl
        });

        // Encrypt message if chat has encryption enabled
        if (chat.settings.encryption) {
          await message.encryptContent();
        }

        await message.save();

        // Update chat's last message
        chat.lastMessage = message._id;
        chat.lastMessageTime = new Date();
        await chat.save();

        // Emit message to chat room
        io.to(chatId).emit('new_message', {
          message: await message.getMessageDetails()
        });

        // Update unread counts for other participants
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.user._id.toString()) {
            const unreadCount = chat.unreadCounts.find(
              count => count.user.toString() === participantId.toString()
            );
            if (unreadCount) {
              unreadCount.count += 1;
            } else {
              chat.unreadCounts.push({
                user: participantId,
                count: 1
              });
            }
          }
        });
        await chat.save();

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle message read status
    socket.on('mark_read', async (data) => {
      try {
        const { chatId, messageId } = data;
        
        const message = await Message.findOne({
          _id: messageId,
          chat: chatId
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        await message.markAsRead(socket.user._id);

        // Update chat's unread count
        const chat = await Chat.findById(chatId);
        const unreadCount = chat.unreadCounts.find(
          count => count.user.toString() === socket.user._id.toString()
        );
        if (unreadCount) {
          unreadCount.count = 0;
          await chat.save();
        }

        // Emit read status to chat room
        io.to(chatId).emit('message_read', {
          messageId,
          readBy: socket.user._id
        });

      } catch (error) {
        console.error('Error marking message as read:', error);
        socket.emit('error', { message: 'Error marking message as read' });
      }
    });

    // Handle typing status
    socket.on('typing', (data) => {
      const { chatId, isTyping } = data;
      socket.to(chatId).emit('user_typing', {
        userId: socket.user._id,
        isTyping
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.user.username);

      // Update user's online status
      await User.findByIdAndUpdate(socket.user._id, {
        isOnline: false,
        lastSeen: new Date()
      }).exec();
    });
  });

  return io;
};

module.exports = {
  initializeSocket,
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized');
    }
    return io;
  }
}; 