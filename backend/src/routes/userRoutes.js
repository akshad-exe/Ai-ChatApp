const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const validateRequest = require('../middleware/validate');
const auth = require('../middleware/auth');

// Validation middleware
const updateProfileValidation = [
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  validateRequest
];

const updatePasswordValidation = [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  validateRequest
];

// Routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, updateProfileValidation, userController.updateProfile);
router.put('/password', auth, updatePasswordValidation, userController.updatePassword);
router.get('/search', auth, userController.searchUsers);
router.get('/:userId', auth, userController.getUserById);

module.exports = router; 