const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { validateRequest } = require('../middleware/validators');
const { chatLimiter } = require('../middleware/rateLimiter');



// Validation rules
const createChatValidation = [
  body('participantId').isMongoId().withMessage('Invalid participant ID')
];

const createGroupChatValidation = [
  body('name').trim().isLength({ min: 3 }).withMessage('Group name must be at least 3 characters long'),
  body('participants').isArray().withMessage('Participants must be an array'),
  body('participants.*').isMongoId().withMessage('Invalid participant ID')
];

const messageValidation = [
  body('content').trim().notEmpty().withMessage('Message content is required'),
  body('type').optional().isIn(['text', 'image', 'file', 'audio', 'video']).withMessage('Invalid message type'),
  body('mediaUrl').optional().isURL().withMessage('Invalid media URL')
];

// All routes require authentication
router.use(auth);

// General routes first
router.get('/', chatLimiter, chatController.getChats);
router.get('/:chatId', chatLimiter, chatController.getChat);

// Chat-specific routes
router.get('/:chatId/messages', chatLimiter, chatController.getMessages);
router.get('/:chatId/search', chatLimiter, chatController.searchMessages);
router.post('/:chatId/messages/read', chatLimiter, chatController.markAsRead);
router.post('/:chatId/ai-reply', messageValidation, validateRequest, chatLimiter, chatController.getAIResponse);
router.patch('/:chatId/settings', chatLimiter, chatController.updateChatSettings);
router.post('/:chatId/send', messageValidation, validateRequest, chatLimiter, chatController.sendMessage);

// Chat creation routes
router.post('/create', createChatValidation, validateRequest, chatLimiter, chatController.createChat);
router.post('/create-group', createGroupChatValidation, validateRequest, chatLimiter, chatController.createGroupChat);

module.exports = router; 