const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

// Get all chats for the current user
router.get('/', chatController.getChats);

// Get single chat by ID
router.get('/:chatId', chatController.getChat);

// Create new chat
router.post('/', chatController.createChat);

// Send message
router.post('/:chatId/messages', chatController.sendMessage);

// Mark messages as read
router.put('/:chatId/read', chatController.markAsRead);

module.exports = router; 