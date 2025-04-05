const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { encryptMessage, decryptMessage } = require('../utils/encryption');
const { getIO } = require('../config/socket');
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get all chats for a user
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate('participants', 'username email avatar isOnline lastSeen')
      .populate('lastMessage')
      .sort({ lastMessageTime: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Error fetching chats' });
  }
};

// Get messages for a specific chat
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('sender', 'username email avatar')
      .populate('readBy.user', 'username email avatar');

    // Mark messages as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      { $push: { readBy: { user: req.user._id } } }
    );

    // Reset unread count for this chat
    const unreadCount = chat.unreadCounts.find(
      count => count.user.toString() === req.user._id.toString()
    );
    if (unreadCount) {
      unreadCount.count = 0;
      await chat.save();
    }

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
};

// Get single chat by ID
exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', 'username email avatar isOnline lastSeen')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.some(p => p._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Error fetching chat' });
  }
};

// Create a new chat
exports.createChat = async (req, res) => {
  try {
    const { participantId } = req.body;

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      participants: { $all: [req.user._id, participantId] },
      isGroupChat: false
    });

    if (existingChat) {
      return res.json(await existingChat.getChatDetails());
    }

    // Create new chat
    const chat = new Chat({
      participants: [req.user._id, participantId],
      isGroupChat: false
    });

    await chat.save();

    // Emit new chat to both participants
    const io = getIO();
    chat.participants.forEach(participantId => {
      io.to(participantId.toString()).emit('new_chat', {
        chat: chat
      });
    });

    res.status(201).json(await chat.getChatDetails());
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Error creating chat' });
  }
};

// Create a group chat
exports.createGroupChat = async (req, res) => {
  try {
    const { name, participants } = req.body;

    // Add creator to participants
    participants.push(req.user._id);

    // Create group chat
    const chat = new Chat({
      participants,
      isGroupChat: true,
      groupName: name,
      groupAdmin: req.user._id
    });

    await chat.save();

    // Emit new chat to all participants
    const io = getIO();
    chat.participants.forEach(participantId => {
      io.to(participantId.toString()).emit('new_chat', {
        chat: chat
      });
    });

    res.status(201).json(await chat.getChatDetails());
  } catch (error) {
    console.error('Error creating group chat:', error);
    res.status(500).json({ message: 'Error creating group chat' });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, content, messageType = 'text', fileUrl, fileName, fileSize, fileType } = req.body;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Encrypt message content
    const encryptedContent = encryptMessage(content);

    // Create message
    const message = await Message.create({
      conversationId: chatId,
      sender: req.user._id,
      content: encryptedContent,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      fileType
    });

    // Update chat's last message
    await chat.updateLastMessage(message._id);

    // Populate message with sender info
    await message.populate('sender', 'username avatar');

    // Get socket service
    const socketService = req.app.get('socketService');

    // Emit message to chat room
    socketService.emitMessage(chatId, message);

    // Update unread counts for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== req.user._id.toString()) {
        const currentCount = chat.unreadCounts.get(participantId.toString()) || 0;
        chat.unreadCounts.set(participantId.toString(), currentCount + 1);
      }
    });
    await chat.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Get AI response
exports.getAIResponse = async (req, res) => {
  try {
    const { chatId, content } = req.body;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }

    // TODO: Implement AI response logic here
    // For now, return a mock response
    const aiResponse = {
      content: "I'm an AI assistant. This is a mock response.",
      isAIResponse: true
    };

    // Create AI message
    const aiMessage = new Message({
      chat: chatId,
      sender: req.user._id, // You might want to create a special AI user
      content: aiResponse.content,
      isAIResponse: true
    });

    if (chat.settings.encryption) {
      await aiMessage.encryptContent();
    }

    await aiMessage.save();

    // Update chat's last message
    chat.lastMessage = aiMessage._id;
    chat.lastMessageTime = new Date();
    await chat.save();

    // Emit AI response to chat room
    const io = getIO();
    io.to(chatId).emit('new_message', {
      message: await aiMessage.getMessageDetails()
    });

    res.json(await aiMessage.getMessageDetails());
  } catch (error) {
    console.error('Error getting AI response:', error);
    res.status(500).json({ message: 'Error getting AI response' });
  }
};

// Update chat settings
exports.updateChatSettings = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { notifications, encryption } = req.body;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Not authorized to update this chat' });
    }

    // Update settings
    if (notifications !== undefined) {
      chat.settings.notifications = notifications;
    }
    if (encryption !== undefined) {
      chat.settings.encryption = encryption;
    }

    await chat.save();

    // Emit updated settings to chat room
    const io = getIO();
    io.to(chatId).emit('chat_settings_updated', {
      chatId,
      settings: chat.settings
    });

    res.json(chat);
  } catch (error) {
    console.error('Error updating chat settings:', error);
    res.status(500).json({ message: 'Error updating chat settings' });
  }
};

// Search messages
exports.searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { query } = req.query;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }

    const messages = await Message.find({
      chat: chatId,
      content: { $regex: query, $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username email avatar')
      .limit(50);

    res.json(messages);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ message: 'Error searching messages' });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }

    // Mark all messages as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        'readBy.user': { $ne: req.user._id }
      },
      { $push: { readBy: { user: req.user._id } } }
    );

    // Reset unread count
    const unreadCount = chat.unreadCounts.find(
      count => count.user.toString() === req.user._id.toString()
    );
    if (unreadCount) {
      unreadCount.count = 0;
      await chat.save();
    }

    // Emit read status
    const io = getIO();
    io.to(chatId).emit('messages_read', {
      chatId,
      userId: req.user._id
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read' });
  }
};

// Helper function to get AI response using Gemini
async function getAIResponse(message) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I apologize, but I'm having trouble processing your request right now.";
  }
}