const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get user's chats
router.get('/', chatController.getUserChats);

// Get chat messages
router.get('/:chatId/messages', chatController.getChatMessages);

// Send message
router.post('/sendMessage', chatController.sendMessage);

// Get AI reply
router.post('/aiReply', chatController.getAiReply);

// Search messages
router.get('/:chatId/search', chatController.searchMessages);

module.exports = router; 