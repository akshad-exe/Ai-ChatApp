const Chat = require('../models/Chat');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get all chats for a user
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ participants: req.user.id })
      .populate('participants', 'username email avatar')
      .populate('messages.sender', 'username avatar')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chats', error: error.message });
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
    const { chatId, content, type, mediaUrl } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add user message
    const message = {
      sender: req.user.id,
      content,
      type,
      mediaUrl,
      isAI: false,
      readBy: [req.user.id]
    };
    chat.messages.push(message);
    chat.lastMessage = message;
    await chat.save();

    // If it's a group chat, update unread counts for other participants
    if (chat.isGroup) {
      chat.participants.forEach(participantId => {
        if (participantId.toString() !== req.user.id) {
          const currentCount = chat.unreadCounts.get(participantId.toString()) || 0;
          chat.unreadCounts.set(participantId.toString(), currentCount + 1);
        }
      });
      await chat.save();
    }

    // Get AI response if it's a direct chat
    if (!chat.isGroup) {
      const aiResponse = await getAIResponse(content);
      
      // Add AI message
      const aiMessage = {
        sender: null,
        content: aiResponse,
        type: 'text',
        isAI: true,
        readBy: [req.user.id]
      };
      chat.messages.push(aiMessage);
      chat.lastMessage = aiMessage;
      await chat.save();
    }

    // Populate the messages with sender info
    const populatedChat = await chat.populate([
      { path: 'participants', select: 'username email avatar' },
      { path: 'messages.sender', select: 'username avatar' }
    ]);

    res.json(populatedChat);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
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

    // Update read status for all messages
    chat.messages.forEach(message => {
      if (!message.readBy.includes(req.user.id)) {
        message.readBy.push(req.user.id);
      }
    });

    // Reset unread count for current user
    chat.unreadCounts.set(req.user.id.toString(), 0);
    await chat.save();

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