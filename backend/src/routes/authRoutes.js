const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validateRequest } = require('../middleware/validators');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// Validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

// Public routes
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authLimiter, authController.login);

// Password reset routes
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.get('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', resetPasswordValidation, validateRequest, authController.resetPassword);

// Protected routes
router.get('/verify-token', auth, authController.verifyToken);
router.post('/logout', auth, authController.logout);

// Test protected route
router.get('/me', auth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router; 