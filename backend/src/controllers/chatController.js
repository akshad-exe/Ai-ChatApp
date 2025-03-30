const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { encryptMessage, decryptMessage } = require('../utils/encryption');
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get user's chats
exports.getUserChats = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const chats = await Chat.getUserChats(req.user._id, parseInt(page), parseInt(limit));
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chats', error: error.message });
  }
};

// Get chat messages
exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.getMessages(chatId, parseInt(page), parseInt(limit));
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};

// Get single chat by ID
exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId)
      .populate('participants', 'username email avatar')
      .populate('messages.sender', 'username avatar');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat', error: error.message });
  }
};

// Create new chat
exports.createChat = async (req, res) => {
  try {
    const { participantIds, isGroup, groupName, groupAvatar } = req.body;

    // Add current user to participants
    const participants = [req.user.id, ...participantIds];

    // Check if all participants exist
    const users = await User.find({ _id: { $in: participants } });
    if (users.length !== participants.length) {
      return res.status(404).json({ message: 'One or more participants not found' });
    }

    // For direct chat, check if chat already exists
    if (!isGroup) {
      const existingChat = await Chat.findOne({
        participants: { $all: participants },
        isGroup: false
      }).populate('participants', 'username email avatar');

      if (existingChat) {
        return res.json(existingChat);
      }
    }

    // Create new chat
    const chat = new Chat({
      participants,
      isGroup,
      groupName,
      groupAvatar,
      groupAdmin: isGroup ? req.user.id : undefined
    });

    await chat.save();
    const populatedChat = await chat.populate('participants', 'username email avatar');

    res.status(201).json(populatedChat);
  } catch (error) {
    res.status(500).json({ message: 'Error creating chat', error: error.message });
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

// Get AI reply
exports.getAiReply = async (req, res) => {
  try {
    const { chatId, messageId } = req.body;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get the original message
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Decrypt the original message
    const decryptedContent = decryptMessage(originalMessage.content);

    // TODO: Implement AI service integration here
    // For now, return a mock response
    const aiResponse = "This is a mock AI response. AI integration will be implemented later.";

    // Encrypt AI response
    const encryptedResponse = encryptMessage(aiResponse);

    // Create AI message
    const message = await Message.create({
      conversationId: chatId,
      sender: process.env.AI_USER_ID, // This should be set in your environment variables
      content: encryptedResponse,
      messageType: 'text',
      replyTo: messageId
    });

    // Update chat's last message
    await chat.updateLastMessage(message._id);

    // Populate message with sender info
    await message.populate('sender', 'username avatar');

    // Get socket service
    const socketService = req.app.get('socketService');

    // Emit message to chat room
    socketService.emitMessage(chatId, message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error getting AI reply', error: error.message });
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
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.searchMessages(chatId, query);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error searching messages', error: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Get socket service
    const socketService = req.app.get('socketService');

    // Update read status for all messages
    chat.messages.forEach(message => {
      if (!message.readBy.includes(req.user._id)) {
        message.readBy.push(req.user._id);
      }
    });

    // Reset unread count for current user
    chat.unreadCounts.set(req.user._id.toString(), 0);
    await chat.save();

    // Emit message read status to chat room
    socketService.emitToChat(chatId, 'messagesRead', {
      chatId,
      userId: req.user._id,
      username: req.user.username
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
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